from app.schemas.common import PaginatedResponse


def test_paginated_response_shape():
    page = PaginatedResponse[str](items=["a", "b"], total=10, limit=2, offset=0)
    assert page.items == ["a", "b"]
    assert page.total == 10
    assert page.limit == 2
    assert page.offset == 0
