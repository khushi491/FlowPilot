"""Pure DAG scheduling helpers for workflow execution (fan-in + condition skips)."""

from collections import defaultdict
from typing import Any, Optional


def initial_indegree(
    adjacency: dict[str, list[dict[str, Any]]], node_ids: list[str]
) -> dict[str, int]:
    indegree = {nid: 0 for nid in node_ids}
    for edges in adjacency.values():
        for edge in edges:
            target = edge["target"]
            indegree[target] = indegree.get(target, 0) + 1
    return indegree


def build_predecessors(
    adjacency: dict[str, list[dict[str, Any]]],
) -> dict[str, set[str]]:
    preds: dict[str, set[str]] = defaultdict(set)
    for source, edges in adjacency.items():
        for edge in edges:
            preds[edge["target"]].add(source)
    return preds


def resolve_after_completion(
    *,
    node_id: str,
    node_type: str,
    branch: Optional[str],
    adjacency: dict[str, list[dict[str, Any]]],
    predecessors: dict[str, set[str]],
    indegree: dict[str, int],
    ready: list[str],
    skipped: set[str],
    executed: set[str],
) -> None:
    """Satisfy outgoing edges after a node finishes; enqueue only when fan-in is ready."""
    outgoing = adjacency.get(node_id, [])
    if node_type == "condition":
        for edge in outgoing:
            handle = edge.get("sourceHandle")
            target = edge["target"]
            if handle is not None and handle != branch:
                skipped.add(target)
                _satisfy_incoming(
                    target,
                    adjacency=adjacency,
                    predecessors=predecessors,
                    indegree=indegree,
                    ready=ready,
                    skipped=skipped,
                    executed=executed,
                )
                continue
            _satisfy_incoming(
                target,
                adjacency=adjacency,
                predecessors=predecessors,
                indegree=indegree,
                ready=ready,
                skipped=skipped,
                executed=executed,
            )
        return

    for edge in outgoing:
        _satisfy_incoming(
            edge["target"],
            adjacency=adjacency,
            predecessors=predecessors,
            indegree=indegree,
            ready=ready,
            skipped=skipped,
            executed=executed,
        )


def _satisfy_incoming(
    target: str,
    *,
    adjacency: dict[str, list[dict[str, Any]]],
    predecessors: dict[str, set[str]],
    indegree: dict[str, int],
    ready: list[str],
    skipped: set[str],
    executed: set[str],
) -> None:
    if target not in indegree:
        return
    indegree[target] -= 1
    if indegree[target] > 0:
        return
    if target in executed:
        return
    if target in skipped:
        _propagate_skip_outgoing(
            target,
            adjacency=adjacency,
            predecessors=predecessors,
            indegree=indegree,
            ready=ready,
            skipped=skipped,
            executed=executed,
        )
        return

    preds = predecessors.get(target, set())
    if preds and preds.issubset(skipped):
        skipped.add(target)
        _propagate_skip_outgoing(
            target,
            adjacency=adjacency,
            predecessors=predecessors,
            indegree=indegree,
            ready=ready,
            skipped=skipped,
            executed=executed,
        )
        return

    if target not in ready:
        ready.append(target)


def _propagate_skip_outgoing(
    node_id: str,
    *,
    adjacency: dict[str, list[dict[str, Any]]],
    predecessors: dict[str, set[str]],
    indegree: dict[str, int],
    ready: list[str],
    skipped: set[str],
    executed: set[str],
) -> None:
    for edge in adjacency.get(node_id, []):
        _satisfy_incoming(
            edge["target"],
            adjacency=adjacency,
            predecessors=predecessors,
            indegree=indegree,
            ready=ready,
            skipped=skipped,
            executed=executed,
        )
