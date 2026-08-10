from collections import defaultdict, deque
from typing import Any


class GraphValidationError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def validate_definition(definition: dict[str, Any]) -> None:
    nodes = definition.get("nodes") or []
    edges = definition.get("edges") or []
    if not isinstance(nodes, list) or not isinstance(edges, list):
        raise GraphValidationError("Workflow definition must include nodes and edges lists")
    if not nodes:
        raise GraphValidationError("Workflow must contain at least one node")

    node_ids = set()
    for node in nodes:
        node_id = node.get("id")
        if not node_id:
            raise GraphValidationError("Each node requires an id")
        if node_id in node_ids:
            raise GraphValidationError(f"Duplicate node id: {node_id}")
        node_ids.add(node_id)
        node_type = (node.get("data") or {}).get("type") or node.get("type")
        if not node_type:
            raise GraphValidationError(f"Node {node_id} is missing a type")

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source not in node_ids or target not in node_ids:
            raise GraphValidationError(f"Edge references unknown node: {source} -> {target}")

    # Detect cycles via Kahn's algorithm.
    topological_order(definition)


def topological_order(definition: dict[str, Any]) -> list[str]:
    nodes = definition.get("nodes") or []
    edges = definition.get("edges") or []
    node_ids = [n["id"] for n in nodes]
    indegree = {nid: 0 for nid in node_ids}
    adjacency: dict[str, list[str]] = defaultdict(list)

    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        adjacency[source].append(target)
        indegree[target] += 1

    queue = deque([nid for nid, deg in indegree.items() if deg == 0])
    order: list[str] = []
    while queue:
        current = queue.popleft()
        order.append(current)
        for neighbor in adjacency[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != len(node_ids):
        raise GraphValidationError("Workflow graph contains a cycle")
    return order


def build_adjacency(definition: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    adjacency: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for edge in definition.get("edges") or []:
        adjacency[edge["source"]].append(edge)
    return adjacency


def node_map(definition: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {node["id"]: node for node in definition.get("nodes") or []}
