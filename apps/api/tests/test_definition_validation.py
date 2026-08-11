from app.api.routes.workflows import _ensure_valid_definition
from app.core.errors import AppError


def test_empty_draft_definition_allowed():
    _ensure_valid_definition({"nodes": [], "edges": []}, require_nodes=False)


def test_empty_definition_rejected_when_required():
    try:
        _ensure_valid_definition({"nodes": [], "edges": []}, require_nodes=True)
        assert False, "expected AppError"
    except AppError as exc:
        assert exc.code == "invalid_definition"
        assert exc.status_code == 422


def test_cyclic_definition_rejected_on_save():
    definition = {
        "nodes": [
            {"id": "a", "type": "llm", "data": {"type": "llm"}},
            {"id": "b", "type": "api", "data": {"type": "api"}},
        ],
        "edges": [
            {"id": "e1", "source": "a", "target": "b"},
            {"id": "e2", "source": "b", "target": "a"},
        ],
    }
    try:
        _ensure_valid_definition(definition)
        assert False, "expected AppError"
    except AppError as exc:
        assert exc.code == "invalid_definition"
        assert "cycle" in exc.message.lower()


def test_valid_definition_passes():
    definition = {
        "nodes": [
            {"id": "a", "type": "llm", "data": {"type": "llm", "config": {}}},
            {"id": "b", "type": "output", "data": {"type": "output", "config": {}}},
        ],
        "edges": [{"id": "e1", "source": "a", "target": "b"}],
    }
    _ensure_valid_definition(definition)
