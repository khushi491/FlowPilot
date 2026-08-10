import asyncio
import traceback
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.engine.events import event_bus
from app.engine.graph import GraphValidationError, build_adjacency, node_map, validate_definition
from app.engine import nodes as node_exec
from app.models.enums import NodeRunStatus, RunStatus
from app.models.workflow import NodeRun, Workflow, WorkflowRun

settings = get_settings()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _emit(run_id: UUID, event_type: str, payload: dict[str, Any]) -> None:
    await event_bus.publish(
        str(run_id),
        {"type": event_type, "run_id": str(run_id), "timestamp": _utcnow().isoformat(), **payload},
    )


async def execute_workflow_run(run_id: UUID) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(WorkflowRun)
            .options(selectinload(WorkflowRun.workflow))
            .where(WorkflowRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if not run:
            return
        workflow: Workflow = run.workflow
        definition = workflow.definition or {"nodes": [], "edges": []}

        run.status = RunStatus.running.value
        run.started_at = _utcnow()
        run.logs = list(run.logs or []) + [{"level": "info", "message": "Execution started"}]
        await db.commit()
        await _emit(run.id, "run.status", {"status": run.status})

        try:
            validate_definition(definition)
        except GraphValidationError as exc:
            run.status = RunStatus.failed.value
            run.error_message = exc.message
            run.completed_at = _utcnow()
            run.duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)
            run.logs = list(run.logs or []) + [{"level": "error", "message": exc.message}]
            await db.commit()
            await _emit(run.id, "run.status", {"status": run.status, "error": exc.message})
            return

        nodes = node_map(definition)
        adjacency = build_adjacency(definition)
        context: dict[str, Any] = dict(run.input_payload or {})
        final_output: Optional[dict[str, Any]] = None

        # Start from zero-indegree nodes, but honor condition branching.
        indegree = {nid: 0 for nid in nodes}
        for edges in adjacency.values():
            for edge in edges:
                indegree[edge["target"]] = indegree.get(edge["target"], 0) + 1
        ready = [nid for nid, deg in indegree.items() if deg == 0]
        executed: set[str] = set()
        skipped: set[str] = set()

        while ready:
            node_id = ready.pop(0)
            if node_id in executed or node_id in skipped:
                continue
            node = nodes[node_id]
            node_type = (node.get("data") or {}).get("type") or node.get("type")
            config = (node.get("data") or {}).get("config") or {}

            node_run = NodeRun(
                id=uuid4(),
                workflow_run_id=run.id,
                node_id=node_id,
                node_type=str(node_type),
                status=NodeRunStatus.running.value,
                input_data={"context_keys": list(context.keys())},
                logs=[{"level": "info", "message": f"Starting {node_type} node"}],
                started_at=_utcnow(),
            )
            db.add(node_run)
            await db.commit()
            await _emit(
                run.id,
                "node.status",
                {"node_id": node_id, "node_run_id": str(node_run.id), "status": node_run.status},
            )

            success = False
            output: dict[str, Any] = {}
            last_error: Optional[str] = None
            max_retries = settings.default_max_retries
            for attempt in range(max_retries + 1):
                node_run.retry_count = attempt
                try:
                    output = await asyncio.wait_for(
                        _execute_node(str(node_type), config, context, db, run.user_id),
                        timeout=settings.default_node_timeout_seconds,
                    )
                    success = True
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = str(exc)
                    node_run.logs = list(node_run.logs or []) + [
                        {"level": "error", "message": f"Attempt {attempt + 1} failed: {last_error}"}
                    ]
                    await db.commit()
                    await _emit(
                        run.id,
                        "node.log",
                        {"node_id": node_id, "message": last_error, "attempt": attempt + 1},
                    )
                    if attempt < max_retries:
                        await asyncio.sleep(0.2)

            if not success:
                node_run.status = NodeRunStatus.failed.value
                node_run.error_message = last_error
                node_run.completed_at = _utcnow()
                node_run.duration_ms = int(
                    (node_run.completed_at - node_run.started_at).total_seconds() * 1000
                )
                run.status = RunStatus.failed.value
                run.error_message = f"Node {node_id} failed: {last_error}"
                run.completed_at = _utcnow()
                run.duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)
                run.retry_count = max(run.retry_count, node_run.retry_count)
                await db.commit()
                await _emit(
                    run.id,
                    "node.status",
                    {"node_id": node_id, "status": node_run.status, "error": last_error},
                )
                await _emit(run.id, "run.status", {"status": run.status, "error": run.error_message})
                return

            # Merge outputs into context
            context.update(output)
            if "content" in output:
                context["content"] = output["content"]
            if "context" in output:
                context["context"] = output["context"]
            if "api_response" in output:
                context["api_response"] = output["api_response"]
            if "output" in output and isinstance(output["output"], dict):
                final_output = output["output"]

            tokens = int(output.get("tokens_used") or 0)
            cost = float(output.get("estimated_cost_usd") or 0.0)
            node_run.output_data = output
            node_run.tokens_used = tokens
            node_run.estimated_cost_usd = cost
            run.total_tokens += tokens
            run.estimated_cost_usd = round(run.estimated_cost_usd + cost, 6)

            if output.get("paused"):
                node_run.status = NodeRunStatus.waiting_approval.value
                node_run.completed_at = _utcnow()
                node_run.duration_ms = int(
                    (node_run.completed_at - node_run.started_at).total_seconds() * 1000
                )
                run.status = RunStatus.paused.value
                run.logs = list(run.logs or []) + [
                    {"level": "info", "message": f"Paused for approval at node {node_id}"}
                ]
                await db.commit()
                await _emit(run.id, "node.status", {"node_id": node_id, "status": node_run.status})
                await _emit(run.id, "run.status", {"status": run.status})
                return

            node_run.status = NodeRunStatus.completed.value
            node_run.completed_at = _utcnow()
            node_run.duration_ms = int(
                (node_run.completed_at - node_run.started_at).total_seconds() * 1000
            )
            executed.add(node_id)
            await db.commit()
            await _emit(run.id, "node.status", {"node_id": node_id, "status": node_run.status, "output": output})

            outgoing = adjacency.get(node_id, [])
            if node_type == "condition":
                branch = output.get("branch")
                for edge in outgoing:
                    handle = edge.get("sourceHandle")
                    target = edge["target"]
                    if handle and handle != branch:
                        skipped.add(target)
                        continue
                    if handle == branch or handle is None:
                        ready.append(target)
            else:
                for edge in outgoing:
                    ready.append(edge["target"])

        run.status = RunStatus.completed.value
        run.output_payload = final_output or {"context": context}
        run.completed_at = _utcnow()
        run.duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)
        run.logs = list(run.logs or []) + [{"level": "info", "message": "Execution completed"}]
        await db.commit()
        await _emit(
            run.id,
            "run.status",
            {"status": run.status, "output": run.output_payload, "tokens": run.total_tokens},
        )


async def _execute_node(
    node_type: str,
    config: dict[str, Any],
    context: dict[str, Any],
    db: AsyncSession,
    user_id: UUID,
) -> dict[str, Any]:
    if node_type == "llm":
        return await node_exec.execute_llm(config, context)
    if node_type == "api":
        return await node_exec.execute_api(config, context)
    if node_type == "database":
        return await node_exec.execute_database(config, context)
    if node_type == "condition":
        return await node_exec.execute_condition(config, context)
    if node_type == "rag":
        from app.services.rag import retrieve_chunks

        async def retriever(query: str, top_k: int):
            return await retrieve_chunks(db, user_id, query, top_k)

        return await node_exec.execute_rag(config, context, retriever=retriever)
    if node_type == "approval":
        return await node_exec.execute_approval(config, context)
    if node_type == "output":
        return await node_exec.execute_output(config, context)
    raise ValueError(f"Unsupported node type: {node_type}")


async def enqueue_run(run_id: UUID) -> None:
    """Schedule execution without blocking the request."""
    try:
        await execute_workflow_run(run_id)
    except Exception:  # noqa: BLE001
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(WorkflowRun).where(WorkflowRun.id == run_id))
            run = result.scalar_one_or_none()
            if run:
                run.status = RunStatus.failed.value
                run.error_message = traceback.format_exc()[-1000:]
                run.completed_at = _utcnow()
                await db.commit()
                await _emit(run.id, "run.status", {"status": run.status, "error": run.error_message})
