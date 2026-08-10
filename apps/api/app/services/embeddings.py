import hashlib
import math
import re
from typing import List

import httpx

from app.core.config import get_settings

settings = get_settings()


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def mock_embed(text: str, dimensions: int | None = None) -> List[float]:
    """Deterministic pseudo-embedding for local/demo use without an API key."""
    dims = dimensions or settings.embedding_dimensions
    vec = [0.0] * dims
    tokens = _tokenize(text) or ["empty"]
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        for i in range(0, min(len(digest), 32)):
            idx = (digest[i] * (i + 1) + len(token)) % dims
            vec[idx] += 1.0
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


async def embed_texts(texts: List[str]) -> List[List[float]]:
    if settings.use_mock_embeddings or not settings.openai_api_key:
        return [mock_embed(text) for text in texts]

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": settings.embedding_model, "input": texts},
        )
        response.raise_for_status()
        payload = response.json()
        data = sorted(payload["data"], key=lambda item: item["index"])
        return [item["embedding"] for item in data]


def cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)
