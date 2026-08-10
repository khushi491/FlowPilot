"""RAG retrieval helpers. Full chunking/embeddings arrive in the RAG step."""

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentChunk


async def retrieve_chunks(
    db: AsyncSession,
    user_id: UUID,
    query: str,
    top_k: int = 4,
) -> list[dict[str, Any]]:
    # Prefer stored chunks when available; otherwise fall back to document text snippets.
    chunk_result = await db.execute(
        select(DocumentChunk)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.user_id == user_id)
        .order_by(DocumentChunk.created_at.desc())
        .limit(top_k * 5)
    )
    chunks = list(chunk_result.scalars().all())
    if chunks:
        query_terms = {t.lower() for t in query.split() if t}
        scored = []
        for chunk in chunks:
            content_l = chunk.content.lower()
            score = sum(1 for term in query_terms if term in content_l)
            scored.append((score, chunk))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [
            {
                "content": chunk.content,
                "document_id": str(chunk.document_id),
                "chunk_index": chunk.chunk_index,
                "score": float(score),
            }
            for score, chunk in scored[:top_k]
        ]

    doc_result = await db.execute(
        select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc()).limit(top_k)
    )
    docs = list(doc_result.scalars().all())
    return [
        {
            "content": (doc.text_content or doc.filename)[:800],
            "document_id": str(doc.id),
            "chunk_index": 0,
            "score": 0.1,
        }
        for doc in docs
    ]
