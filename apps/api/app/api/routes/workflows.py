from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.models.workflow import Workflow, WorkflowRun, WorkflowVersion
from app.schemas.workflow import RunCreate, WorkflowCreate, WorkflowOut, WorkflowRunOut, WorkflowUpdate

router = APIRouter()

ALLOWED_STATUSES = {"draft", "active", "paused", "failed"}


@router.post("/workflows", response_model=WorkflowOut, status_code=201)
async def create_workflow(
    payload: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.status not in ALLOWED_STATUSES:
        raise AppError("Invalid workflow status", code="invalid_status")

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


@router.get("/workflows", response_model=list[WorkflowOut])
async def list_workflows(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Workflow).where(Workflow.user_id == user.id).order_by(Workflow.updated_at.desc())
    if status:
        if status not in ALLOWED_STATUSES:
            raise AppError("Invalid workflow status filter", code="invalid_status")
        query = query.where(Workflow.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


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
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    workflow = await _get_owned_workflow(db, user.id, workflow_id)
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
    return run


async def _get_owned_workflow(db: AsyncSession, user_id, workflow_id: str) -> Workflow:
    wid = parse_uuid(workflow_id, "workflow_id")
    result = await db.execute(select(Workflow).where(Workflow.id == wid, Workflow.user_id == user_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise AppError("Workflow not found", status_code=404, code="not_found")
    return workflow
