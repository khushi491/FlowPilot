from fastapi import Request

from app.core.errors import AppError
from app.core.rate_limit import check_rate_limit


def test_rate_limit_blocks_after_threshold():
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": "/auth/login",
        "raw_path": b"/auth/login",
        "query_string": b"",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("test", 80),
    }
    request = Request(scope)
    for _ in range(3):
        check_rate_limit(request, bucket="test-auth", limit=3, window_seconds=60)
    try:
        check_rate_limit(request, bucket="test-auth", limit=3, window_seconds=60)
        assert False, "expected rate limit"
    except AppError as exc:
        assert exc.status_code == 429
        assert exc.code == "rate_limited"
