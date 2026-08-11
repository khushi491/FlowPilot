import asyncio
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.security import decode_access_token
from app.db.session import AsyncSessionLocal
from app.engine.events import event_bus
from app.models.workflow import WorkflowRun

router = APIRouter()


@router.websocket("/ws/runs/{run_id}")
async def workflow_run_ws(websocket: WebSocket, run_id: str, token: Optional[str] = None):
    # Prefer query token (browser WebSocket limitation); also accept Authorization header.
    if not token:
        auth = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()

    await websocket.accept()

    if not token:
        await websocket.send_json({"type": "error", "message": "Authentication required"})
        await websocket.close(code=4401)
        return

    user_id = decode_access_token(token)
    if not user_id:
        await websocket.send_json({"type": "error", "message": "Invalid token"})
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(WorkflowRun).where(WorkflowRun.id == run_id))
        run = result.scalar_one_or_none()
        if not run:
            await websocket.send_json({"type": "error", "message": "Run not found"})
            await websocket.close(code=4404)
            return

        if run.user_id != user_id:
            await websocket.send_json({"type": "error", "message": "Forbidden"})
            await websocket.close(code=4403)
            return

        await websocket.send_json(
            {
                "type": "run.status",
                "run_id": str(run.id),
                "status": run.status,
                "logs": run.logs,
                "output": run.output_payload,
                "error": run.error_message,
            }
        )

    queue = event_bus.subscribe(run_id)
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=25)
                await websocket.send_json(event)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    finally:
        event_bus.unsubscribe(run_id, queue)
