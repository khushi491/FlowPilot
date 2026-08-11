from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, parse_uuid
from app.core.config import get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.engine.executor import enqueue_decision
from app.models.enums import RunStatus
from app.models.user import User
from app.models.workflow import NodeRun, WorkflowRun
from app.schemas.common import PaginatedResponse
from app.schemas.workflow import NodeRunOut, RunDecision, WorkflowRunOut

router = APIRouter()
settings = get_settings()


@router.get("/runs", response_model=PaginatedResponse[WorkflowRunOut])
async def list_runs(
    status: Optional[str] = None,
    workflow_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = [WorkflowRun.user_id == user.id]
    if status:
        filters.append(WorkflowRun.status == status)
    if workflow_id:
        filters.append(WorkflowRun.workflow_id == parse_uuid(workflow_id, "workflow_id"))

    total = await db.scalar(select(func.count()).select_from(WorkflowRun).where(*filters))
    result = await db.execute(
        select(WorkflowRun)
        .where(*filters)
        .order_by(WorkflowRun.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return PaginatedResponse(
        items=list(result.scalars().all()),
        total=int(total or 0),
        limit=limit,
        offset=offset,
    )


@router.get("/runs/{run_id}", response_model=WorkflowRunOut)
async def get_run(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    run = await _get_owned_run(db, user.id, run_id)
    return run


@router.get("/runs/{run_id}/nodes", response_model=list[NodeRunOut])
async def get_run_nodes(
    run_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    run = await _get_owned_run(db, user.id, run_id)
    result = await db.execute(
        select(NodeRun).where(NodeRun.workflow_run_id == run.id).order_by(NodeRun.created_at.asc())
    )
    return list(result.scalars().all())


@router.post("/runs/{run_id}/decision", response_model=WorkflowRunOut)
async def decide_run(
    run_id: str,
    payload: RunDecision,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    run = await _get_owned_run(db, user.id, run_id)
    if run.status != RunStatus.paused.value:
        raise AppError("Run is not waiting for approval", status_code=409, code="not_paused")

    pause = (run.output_payload or {}).get("_pause") if isinstance(run.output_payload, dict) else None
    if not pause:
        raise AppError("Run is missing an approval checkpoint", status_code=409, code="missing_checkpoint")

    if settings.use_celery:
        from app.workers.tasks import resume_run_task

        resume_run_task.delay(str(run.id), payload.approved, payload.note)
    else:
        background_tasks.add_task(enqueue_decision, run.id, payload.approved, payload.note)
    run.logs = list(run.logs or []) + [
        {
            "level": "info",
            "message": "Approval decision accepted" if payload.approved else "Rejection accepted",
        }
    ]
    await db.commit()
    await db.refresh(run)
    return run


async def _get_owned_run(db: AsyncSession, user_id, run_id: str) -> WorkflowRun:
    rid = parse_uuid(run_id, "run_id")
    result = await db.execute(
        select(WorkflowRun)
        .options(selectinload(WorkflowRun.node_runs))
        .where(WorkflowRun.id == rid, WorkflowRun.user_id == user_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise AppError("Run not found", status_code=404, code="not_found")
    return run
