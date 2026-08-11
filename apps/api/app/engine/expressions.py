"""Safe condition expression evaluator (no eval / exec).

Supports a small boolean/comparison DSL over workflow context keys:
  score > 50
  input.value == true
  content != ""
  score >= 10 and score < 100
  not flagged

Disallowed: function calls, subscripts, nested attributes, imports, templates.
"""

from __future__ import annotations

import ast
import operator
from typing import Any


class ExpressionError(ValueError):
    """Raised when a condition expression is invalid or unsupported."""


_CMP_OPS = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
}

_BIN_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
}


def evaluate_condition_expression(expression: str, context: dict[str, Any]) -> bool:
    source = (expression or "").strip() or "True"
    if "{{" in source or "}}" in source:
        raise ExpressionError("Template placeholders are not allowed in condition expressions")
    try:
        tree = ast.parse(source, mode="eval")
    except SyntaxError as exc:
        raise ExpressionError(f"Invalid expression syntax: {exc.msg}") from exc
    return bool(_eval(tree.body, context))


def _eval(node: ast.AST, context: dict[str, Any]) -> Any:
    if isinstance(node, ast.Expression):
        return _eval(node.body, context)

    if isinstance(node, ast.Constant):
        return node.value

    # Python <3.8 compatibility leftover; keep NameConstant-style True/False/None via Name
    if isinstance(node, ast.Name):
        if node.id in {"True", "true"}:
            return True
        if node.id in {"False", "false"}:
            return False
        if node.id in {"None", "null"}:
            return None
        if node.id in {"input", "context"}:
            return dict(context)
        if node.id not in context:
            raise ExpressionError(f"Unknown variable: {node.id}")
        return context[node.id]

    if isinstance(node, ast.Attribute):
        # Only allow input.field or context.field → context[field]
        if not isinstance(node.value, ast.Name) or node.value.id not in {"input", "context"}:
            raise ExpressionError("Only input.field or context.field attribute access is allowed")
        if not node.attr.isidentifier():
            raise ExpressionError("Invalid attribute name")
        return context.get(node.attr)

    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
        return not bool(_eval(node.operand, context))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return -_eval(node.operand, context)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.UAdd):
        return +_eval(node.operand, context)

    if isinstance(node, ast.BoolOp):
        if isinstance(node.op, ast.And):
            result = True
            for value in node.values:
                result = bool(_eval(value, context))
                if not result:
                    return False
            return True
        if isinstance(node.op, ast.Or):
            for value in node.values:
                if bool(_eval(value, context)):
                    return True
            return False
        raise ExpressionError("Unsupported boolean operator")

    if isinstance(node, ast.Compare):
        left = _eval(node.left, context)
        for op, comparator in zip(node.ops, node.comparators):
            op_type = type(op)
            if op_type not in _CMP_OPS:
                raise ExpressionError(f"Unsupported comparison: {op_type.__name__}")
            right = _eval(comparator, context)
            if not _CMP_OPS[op_type](left, right):
                return False
            left = right
        return True

    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in _BIN_OPS:
            raise ExpressionError(f"Unsupported arithmetic operator: {op_type.__name__}")
        left = _eval(node.left, context)
        right = _eval(node.right, context)
        try:
            return _BIN_OPS[op_type](left, right)
        except Exception as exc:  # noqa: BLE001
            raise ExpressionError(f"Arithmetic error: {exc}") from exc

    raise ExpressionError(f"Unsupported expression element: {type(node).__name__}")
