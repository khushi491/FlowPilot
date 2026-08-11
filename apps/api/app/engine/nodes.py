import asyncio
import json
import re
from typing import Any, Callable, Optional
from urllib.parse import urlencode

import httpx

from app.core.config import get_settings
from app.engine.expressions import ExpressionError, evaluate_condition_expression
from app.engine.url_safety import assert_safe_url

settings = get_settings()


def render_template(template: str, context: dict[str, Any]) -> str:
    def replacer(match: re.Match[str]) -> str:
        key = match.group(1).strip()
        value = context.get(key, "")
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        return str(value)

    return re.sub(r"\{\{\s*([^}]+)\s*\}\}", replacer, template)


async def execute_llm(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    prompt = render_template(str(config.get("prompt", "")), context)
    model = str(config.get("model") or settings.llm_model)
    if settings.use_mock_llm or not settings.openai_api_key:
        tokens = max(32, len(prompt.split()))
        content = (
            f"[Mock LLM:{model}] Processed prompt with {tokens} estimated tokens.\n"
            f"Summary: {prompt[:280]}"
        )
        return {
            "content": content,
            "tokens_used": tokens,
            "estimated_cost_usd": round(tokens * 0.000002, 6),
            "model": model,
            "mocked": True,
        }

    # Real OpenAI-compatible call can be wired here when API key is present.
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        response.raise_for_status()
        payload = response.json()
        content = payload["choices"][0]["message"]["content"]
        tokens = payload.get("usage", {}).get("total_tokens", len(prompt.split()))
        return {
            "content": content,
            "tokens_used": tokens,
            "estimated_cost_usd": round(tokens * 0.000002, 6),
            "model": model,
            "mocked": False,
        }


async def execute_api(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    method = str(config.get("method") or "GET").upper()
    url = render_template(str(config.get("url") or ""), context)
    if not url:
        raise ValueError("API node requires a URL")

    headers = config.get("headers") or {}
    query = config.get("query") or {}
    if isinstance(query, dict):
        rendered_query = {
            k: render_template(str(v), context) if isinstance(v, str) else v for k, v in query.items()
        }
        if rendered_query:
            separator = "&" if "?" in url else "?"
            url = f"{url}{separator}{urlencode(rendered_query)}"

    assert_safe_url(url)

    body = config.get("body")
    json_body = None
    content = None
    if isinstance(body, str) and body.strip():
        rendered = render_template(body, context)
        try:
            json_body = json.loads(rendered)
        except json.JSONDecodeError:
            content = rendered
    elif isinstance(body, dict):
        json_body = body

    async with httpx.AsyncClient(timeout=settings.default_node_timeout_seconds) as client:
        response = await client.request(method, url, headers=headers, json=json_body, content=content)
        text = response.text
        try:
            data = response.json()
        except Exception:
            data = {"text": text}
        return {
            "status_code": response.status_code,
            "data": data,
            "api_response": data,
            "ok": response.is_success,
        }


async def execute_database(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    query = render_template(str(config.get("query") or ""), context)
    # Safe mock execution for portfolio demo; production would use a read-only SQL runner.
    return {
        "query": query,
        "rows": [{"result": 1, "note": "Mock database result"}],
        "row_count": 1,
        "mocked": True,
    }


async def execute_condition(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    # Evaluate the expression against context keys directly — do not template-interpolate
    # untrusted context into source code before parsing.
    expression = str(config.get("expression") or "True")
    try:
        value = evaluate_condition_expression(expression, context)
    except ExpressionError as exc:
        raise ValueError(str(exc)) from exc
    return {"expression": expression, "result": value, "branch": "true" if value else "false"}


async def execute_rag(
    config: dict[str, Any],
    context: dict[str, Any],
    retriever: Optional[Callable[[str, int], Any]] = None,
) -> dict[str, Any]:
    query = render_template(str(config.get("query") or ""), context)
    top_k = int(config.get("top_k") or 4)
    chunks: list[dict[str, Any]] = []
    if retriever:
        maybe = retriever(query, top_k)
        chunks = await maybe if asyncio.iscoroutine(maybe) else maybe
    else:
        chunks = [
            {
                "content": f"Mock retrieved context for query: {query}",
                "score": 0.42,
            }
        ]
    context_text = "\n\n".join(c.get("content", "") for c in chunks)
    return {"query": query, "chunks": chunks, "context": context_text, "top_k": top_k}


async def execute_approval(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": "waiting_approval",
        "message": str(config.get("message") or "Approval required"),
        "paused": True,
        "preview": context.get("content") or context.get("api_response") or context,
    }


async def execute_output(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    key = str(config.get("key") or "result")
    value = context.get("content")
    if value is None:
        value = context.get("api_response", context)
    return {"key": key, "value": value, "output": {key: value}}
