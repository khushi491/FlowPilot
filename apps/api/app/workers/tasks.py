import asyncio
from uuid import UUID

from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.execute_run_task")
def execute_run_task(run_id: str) -> str:
    from app.engine.executor import execute_workflow_run

    asyncio.run(execute_workflow_run(UUID(run_id)))
    return run_id
