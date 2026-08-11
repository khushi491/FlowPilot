"""Simple in-process sliding-window rate limiter for demo deployments."""

from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Deque, Dict

from fastapi import Request

from app.core.config import get_settings
from app.core.errors import AppError

_lock = Lock()
_buckets: Dict[str, Deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def check_rate_limit(request: Request, *, bucket: str, limit: int, window_seconds: int = 60) -> None:
    if limit <= 0:
        return
    key = f"{bucket}:{_client_key(request)}"
    now = time.monotonic()
    cutoff = now - window_seconds
    with _lock:
        q = _buckets[key]
        while q and q[0] < cutoff:
            q.popleft()
        if len(q) >= limit:
            raise AppError(
                "Rate limit exceeded. Please try again shortly.",
                status_code=429,
                code="rate_limited",
            )
        q.append(now)


async def rate_limit_auth(request: Request) -> None:
    settings = get_settings()
    check_rate_limit(
        request,
        bucket="auth",
        limit=settings.rate_limit_auth_per_minute,
    )


async def rate_limit_upload(request: Request) -> None:
    settings = get_settings()
    check_rate_limit(
        request,
        bucket="upload",
        limit=settings.rate_limit_upload_per_minute,
    )


async def rate_limit_run(request: Request) -> None:
    settings = get_settings()
    check_rate_limit(
        request,
        bucket="run",
        limit=settings.rate_limit_run_per_minute,
    )
