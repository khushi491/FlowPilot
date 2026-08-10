import asyncio

import pytest

from app.engine.nodes import execute_condition, execute_llm, execute_output


@pytest.mark.asyncio
async def test_workflow_execution_success_path():
    llm = await execute_llm({"prompt": "Say hello about {{topic}}", "model": "mock"}, {"topic": "agents"})
    assert "content" in llm
    assert llm["tokens_used"] > 0

    output = await execute_output({"key": "summary"}, {"content": llm["content"]})
    assert output["output"]["summary"] == llm["content"]


@pytest.mark.asyncio
async def test_workflow_execution_failure_on_bad_api_url():
    from app.engine.nodes import execute_api

    with pytest.raises(Exception):
        await execute_api({"method": "GET", "url": ""}, {})


@pytest.mark.asyncio
async def test_condition_routing():
    true_result = await execute_condition({"expression": "score > 50"}, {"score": 80})
    false_result = await execute_condition({"expression": "score > 50"}, {"score": 10})
    assert true_result["branch"] == "true"
    assert false_result["branch"] == "false"


def test_async_helpers_importable():
    assert asyncio.iscoroutinefunction(execute_llm)
