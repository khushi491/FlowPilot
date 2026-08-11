from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.core.rate_limit import rate_limit_run
from app.core.config import get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.engine.executor import enqueue_run
from app.engine.graph import GraphValidationError, validate_definition
from app.models.user import User
from app.models.workflow import Workflow, WorkflowRun, WorkflowVersion
from app.schemas.common import PaginatedResponse
from app.schemas.workflow import RunCreate, WorkflowCreate, WorkflowOut, WorkflowRunOut, WorkflowUpdate

router = APIRouter()

ALLOWED_STATUSES = {"draft", "active", "paused", "failed"}
settings = get_settings()


def _ensure_valid_definition(definition: dict, *, require_nodes: bool = False) -> None:
    """Validate graph structure. Empty drafts are allowed unless require_nodes is set."""
    nodes = definition.get("nodes") or []
    if not nodes and not require_nodes:
        return
    try:
        validate_definition(definition)
    except GraphValidationError as exc:
        raise AppError(exc.message, status_code=422, code="invalid_definition") from exc


@router.post("/workflows", response_model=WorkflowOut, status_code=201)
async def create_workflow(
    payload: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.status not in ALLOWED_STATUSES:
        raise AppError("Invalid workflow status", code="invalid_status")

    require_nodes = payload.status == "active"
    _ensure_valid_definition(payload.definition, require_nodes=require_nodes)

    workflow = Workflow(
        id=uuid4(),
        user_id=user.id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        definition=payload.definition,
        tags=payload.tags,
    )
    db.add(workflow)
    db.add(
        WorkflowVersion(
            id=uuid4(),
            workflow_id=workflow.id,
            version=1,
            definition=payload.definition,
            changelog="Initial version",
        )
    )
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.get("/workflows", response_model=PaginatedResponse[WorkflowOut])
async def list_workflows(
    status: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = [Workflow.user_id == user.id]
    if status:
        if status not in ALLOWED_STATUSES:
            raise AppError("Invalid workflow status filter", code="invalid_status")
        filters.append(Workflow.status == status)

    total = await db.scalar(select(func.count()).select_from(Workflow).where(*filters))
    result = await db.execute(
        select(Workflow)
        .where(*filters)
        .order_by(Workflow.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return PaginatedResponse(
        items=list(result.scalars().all()),
        total=int(total or 0),
        limit=limit,
        offset=offset,
    )


@router.get("/workflows/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    workflow = await _get_owned_workflow(db, user.id, workflow_id)
    return workflow


@router.put("/workflows/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: str,
    payload: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    workflow = await _get_owned_workflow(db, user.id, workflow_id)
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in ALLOWED_STATUSES:
        raise AppError("Invalid workflow status", code="invalid_status")

    next_definition = data.get("definition", workflow.definition) or {"nodes": [], "edges": []}
    next_status = data.get("status", workflow.status)
    require_nodes = next_status == "active"
    if "definition" in data or require_nodes:
        _ensure_valid_definition(next_definition, require_nodes=require_nodes)

    definition_changed = "definition" in data
    for key, value in data.items():
        setattr(workflow, key, value)

    if definition_changed:
        result = await db.execute(
            select(WorkflowVersion)
            .where(WorkflowVersion.workflow_id == workflow.id)
            .order_by(WorkflowVersion.version.desc())
        )
        latest = result.scalars().first()
        next_version = (latest.version + 1) if latest else 1
        db.add(
            WorkflowVersion(
                id=uuid4(),
                workflow_id=workflow.id,
                version=next_version,
                definition=workflow.definition,
                changelog=f"Version {next_version}",
            )
        )

    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/workflows/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    workflow = await _get_owned_workflow(db, user.id, workflow_id)
    await db.delete(workflow)
    await db.commit()
    return None


@router.post("/workflows/{workflow_id}/runs", response_model=WorkflowRunOut, status_code=201)
async def create_run(
    workflow_id: str,
    payload: RunCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _: None = Depends(rate_limit_run),
):
    workflow = await _get_owned_workflow(db, user.id, workflow_id)
    _ensure_valid_definition(workflow.definition or {"nodes": [], "edges": []}, require_nodes=True)

    run = WorkflowRun(
        id=uuid4(),
        workflow_id=workflow.id,
        user_id=user.id,
        status="queued",
        input_payload=payload.input,
        logs=[{"message": "Run queued", "level": "info"}],
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    if settings.use_celery:
        from app.workers.tasks import execute_run_task

        execute_run_task.delay(str(run.id))
    else:
        background_tasks.add_task(enqueue_run, run.id)
    return run


async def _get_owned_workflow(db: AsyncSession, user_id, workflow_id: str) -> Workflow:
    wid = parse_uuid(workflow_id, "workflow_id")
    result = await db.execute(select(Workflow).where(Workflow.id == wid, Workflow.user_id == user_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise AppError("Workflow not found", status_code=404, code="not_found")
    return workflow
