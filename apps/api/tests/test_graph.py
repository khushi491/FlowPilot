import pytest

from app.engine.graph import GraphValidationError, topological_order, validate_definition


def test_validate_workflow_json_success():
    definition = {
        "nodes": [
            {"id": "a", "type": "llm", "data": {"type": "llm", "config": {"prompt": "hi"}}},
            {"id": "b", "type": "output", "data": {"type": "output", "config": {"key": "result"}}},
        ],
        "edges": [{"id": "e1", "source": "a", "target": "b"}],
    }
    validate_definition(definition)
    assert topological_order(definition) == ["a", "b"]


def test_validate_workflow_json_requires_nodes():
    with pytest.raises(GraphValidationError):
        validate_definition({"nodes": [], "edges": []})


def test_graph_dependency_ordering():
    definition = {
        "nodes": [
            {"id": "c", "type": "output", "data": {"type": "output"}},
            {"id": "a", "type": "llm", "data": {"type": "llm"}},
            {"id": "b", "type": "api", "data": {"type": "api"}},
        ],
        "edges": [
            {"id": "e1", "source": "a", "target": "b"},
            {"id": "e2", "source": "b", "target": "c"},
        ],
    }
    order = topological_order(definition)
    assert order.index("a") < order.index("b") < order.index("c")


def test_cycle_detection():
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
    with pytest.raises(GraphValidationError, match="cycle"):
        validate_definition(definition)
