import pytest

from app.engine.expressions import ExpressionError, evaluate_condition_expression
from app.engine.nodes import execute_condition


def test_simple_comparison():
    assert evaluate_condition_expression("score > 50", {"score": 80}) is True
    assert evaluate_condition_expression("score > 50", {"score": 10}) is False


def test_input_attribute_lookup():
    assert evaluate_condition_expression("input.value == true", {"value": True}) is True
    assert evaluate_condition_expression("context.flag == false", {"flag": False}) is True


def test_boolean_and_or():
    assert evaluate_condition_expression("score >= 10 and score < 100", {"score": 42}) is True
    assert evaluate_condition_expression("score < 0 or score > 100", {"score": 5}) is False


def test_rejects_function_calls():
    with pytest.raises(ExpressionError):
        evaluate_condition_expression("__import__('os').system('id')", {})


def test_rejects_attribute_escape_chains():
    with pytest.raises(ExpressionError):
        evaluate_condition_expression("(1).__class__.__mro__", {})


def test_rejects_subscripts():
    with pytest.raises(ExpressionError):
        evaluate_condition_expression("items[0]", {"items": [1]})


def test_rejects_template_placeholders():
    with pytest.raises(ExpressionError):
        evaluate_condition_expression("{{score}} > 1", {"score": 5})


@pytest.mark.asyncio
async def test_execute_condition_does_not_template_inject():
    # Even if context contains a malicious string, expression source is not interpolated.
    result = await execute_condition(
        {"expression": "score > 50"},
        {"score": 80, "payload": "__import__('os')"},
    )
    assert result["branch"] == "true"
    assert result["expression"] == "score > 50"
