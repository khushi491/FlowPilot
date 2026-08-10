from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, parse_uuid
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.models.workflow import NodeRun, WorkflowRun
from app.schemas.workflow import NodeRunOut, WorkflowRunOut

router = APIRouter()


@router.get("/runs", response_model=list[WorkflowRunOut])
async def list_runs(
    status: Optional[str] = None,
    workflow_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(WorkflowRun).where(WorkflowRun.user_id == user.id).order_by(WorkflowRun.created_at.desc())
    if status:
        query = query.where(WorkflowRun.status == status)
    if workflow_id:
        query = query.where(WorkflowRun.workflow_id == parse_uuid(workflow_id, "workflow_id"))
    result = await db.execute(query)
    return list(result.scalars().all())


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
