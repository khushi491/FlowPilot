"""Unit tests for fan-in scheduling and condition skip propagation."""

from app.engine.graph import build_adjacency
from app.engine.scheduling import build_predecessors, initial_indegree, resolve_after_completion


def _run_schedule(definition: dict, outcomes: dict[str, dict]) -> list[str]:
    """Simulate completion order using resolve_after_completion.

    outcomes maps node_id -> {"type": ..., "branch": optional}
    """
    adjacency = build_adjacency(definition)
    node_ids = [n["id"] for n in definition["nodes"]]
    indegree = initial_indegree(adjacency, node_ids)
    predecessors = build_predecessors(adjacency)
    ready = [nid for nid, deg in indegree.items() if deg == 0]
    executed: set[str] = set()
    skipped: set[str] = set()
    order: list[str] = []

    while ready:
        node_id = ready.pop(0)
        if node_id in executed or node_id in skipped:
            continue
        order.append(node_id)
        executed.add(node_id)
        meta = outcomes[node_id]
        resolve_after_completion(
            node_id=node_id,
            node_type=meta["type"],
            branch=meta.get("branch"),
            adjacency=adjacency,
            predecessors=predecessors,
            indegree=indegree,
            ready=ready,
            skipped=skipped,
            executed=executed,
        )
    return order


def test_diamond_fan_in_waits_for_both_parents():
    definition = {
        "nodes": [
            {"id": "a"},
            {"id": "b"},
            {"id": "c"},
            {"id": "d"},
        ],
        "edges": [
            {"source": "a", "target": "b"},
            {"source": "a", "target": "c"},
            {"source": "b", "target": "d"},
            {"source": "c", "target": "d"},
        ],
    }
    outcomes = {
        "a": {"type": "llm"},
        "b": {"type": "llm"},
        "c": {"type": "llm"},
        "d": {"type": "output"},
    }
    order = _run_schedule(definition, outcomes)
    assert order[0] == "a"
    assert set(order[1:3]) == {"b", "c"}
    assert order[-1] == "d"
    assert order.index("d") > order.index("b")
    assert order.index("d") > order.index("c")


def test_condition_skip_still_allows_join():
    definition = {
        "nodes": [
            {"id": "cond"},
            {"id": "true_path"},
            {"id": "false_path"},
            {"id": "join"},
        ],
        "edges": [
            {"source": "cond", "target": "true_path", "sourceHandle": "true"},
            {"source": "cond", "target": "false_path", "sourceHandle": "false"},
            {"source": "true_path", "target": "join"},
            {"source": "false_path", "target": "join"},
        ],
    }
    outcomes = {
        "cond": {"type": "condition", "branch": "true"},
        "true_path": {"type": "llm"},
        "false_path": {"type": "llm"},
        "join": {"type": "output"},
    }
    order = _run_schedule(definition, outcomes)
    assert "true_path" in order
    assert "false_path" not in order
    assert order[-1] == "join"


def test_condition_false_branch_taken():
    definition = {
        "nodes": [
            {"id": "cond"},
            {"id": "true_path"},
            {"id": "false_path"},
        ],
        "edges": [
            {"source": "cond", "target": "true_path", "sourceHandle": "true"},
            {"source": "cond", "target": "false_path", "sourceHandle": "false"},
        ],
    }
    outcomes = {
        "cond": {"type": "condition", "branch": "false"},
        "true_path": {"type": "llm"},
        "false_path": {"type": "llm"},
    }
    order = _run_schedule(definition, outcomes)
    assert order == ["cond", "false_path"]
