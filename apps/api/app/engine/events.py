import asyncio
import json
from collections import defaultdict
from typing import Any

from app.core.config import get_settings


class RunEventBus:
    """Pub/sub for run updates.

    Prefers Redis so Celery workers and the API process can share events.
    Falls back to in-process queues when Redis is unavailable.
    """

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)
        self._redis = None
        self._listeners: dict[str, asyncio.Task] = {}
        self._listener_queues: dict[str, set[asyncio.Queue]] = defaultdict(set)

    async def _get_redis(self):
        if self._redis is None:
            import redis.asyncio as redis

            self._redis = redis.from_url(get_settings().redis_url, decode_responses=True)
        return self._redis

    def subscribe(self, run_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[run_id].add(queue)
        self._listener_queues[run_id].add(queue)
        if run_id not in self._listeners:
            self._listeners[run_id] = asyncio.create_task(self._redis_listen(run_id))
        return queue

    def unsubscribe(self, run_id: str, queue: asyncio.Queue) -> None:
        self._subscribers[run_id].discard(queue)
        self._listener_queues[run_id].discard(queue)
        if not self._subscribers[run_id]:
            self._subscribers.pop(run_id, None)
        if not self._listener_queues[run_id]:
            self._listener_queues.pop(run_id, None)
            task = self._listeners.pop(run_id, None)
            if task:
                task.cancel()

    async def publish(self, run_id: str, event: dict[str, Any]) -> None:
        payload = json.dumps(event, default=str)
        published = False
        try:
            client = await self._get_redis()
            await client.publish(f"flowpilot:run:{run_id}", payload)
            published = True
        except Exception:
            published = False

        if not published:
            for queue in list(self._subscribers.get(run_id, set())):
                await queue.put(event)

    async def _redis_listen(self, run_id: str) -> None:
        channel = f"flowpilot:run:{run_id}"
        pubsub = None
        try:
            client = await self._get_redis()
            pubsub = client.pubsub()
            await pubsub.subscribe(channel)
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message is None:
                    await asyncio.sleep(0.05)
                    continue
                data = message.get("data")
                if not data:
                    continue
                try:
                    event = json.loads(data)
                except json.JSONDecodeError:
                    continue
                for queue in list(self._listener_queues.get(run_id, set())):
                    await queue.put(event)
        except asyncio.CancelledError:
            raise
        except Exception:
            # Redis listener failed; local publish fallback still works for in-process runs.
            return
        finally:
            if pubsub is not None:
                try:
                    await pubsub.unsubscribe(channel)
                    await pubsub.aclose()
                except Exception:
                    pass


event_bus = RunEventBus()
