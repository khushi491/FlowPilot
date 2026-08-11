import asyncio

import pytest

from app.engine.events import RunEventBus


@pytest.mark.asyncio
async def test_event_bus_falls_back_to_local_when_redis_unavailable(monkeypatch):
    bus = RunEventBus()

    async def boom():
        raise ConnectionError("redis down")

    monkeypatch.setattr(bus, "_get_redis", boom)

    queue = bus.subscribe("run-1")
    await bus.publish("run-1", {"type": "run.status", "status": "running"})
    event = await asyncio.wait_for(queue.get(), timeout=1)
    assert event["status"] == "running"
    bus.unsubscribe("run-1", queue)
