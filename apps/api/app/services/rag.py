"""RAG document processing and retrieval."""

from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentChunk
from app.services.chunking import chunk_text
from app.services.embeddings import embed_texts


def extract_text_from_file(path: Path, content_type: str) -> str:
    suffix = path.suffix.lower()
    if suffix in {".txt", ".md"} or content_type.startswith("text/"):
        return path.read_text(encoding="utf-8", errors="ignore")
    if suffix == ".pdf" or content_type == "application/pdf":
        reader = PdfReader(str(path))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages).strip()
    return path.read_text(encoding="utf-8", errors="ignore")


async def process_document(db: AsyncSession, document: Document) -> Document:
    path = Path(document.storage_path)
    text = extract_text_from_file(path, document.content_type)
    document.text_content = text
    chunks = chunk_text(text)
    embeddings = await embed_texts(chunks) if chunks else []

    # Replace existing chunks if re-processed.
    existing = await db.execute(select(DocumentChunk).where(DocumentChunk.document_id == document.id))
    for chunk in existing.scalars().all():
        await db.delete(chunk)

    for index, (content, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(
            DocumentChunk(
                id=uuid4(),
                document_id=document.id,
                chunk_index=index,
                content=content,
                token_count=len(content.split()),
                embedding=embedding,
                meta={"source": document.filename},
            )
        )

    document.chunk_count = len(chunks)
    document.meta = {**(document.meta or {}), "status": "indexed", "chunk_count": len(chunks)}
    await db.commit()
    await db.refresh(document)
    return document


def distance_to_score(distance: float) -> float:
    """Convert pgvector cosine distance to a similarity score in roughly [0, 1]."""
    return max(0.0, 1.0 - float(distance))


async def retrieve_chunks(
    db: AsyncSession,
    user_id: UUID,
    query: str,
    top_k: int = 4,
) -> list[dict[str, Any]]:
    """Retrieve top-k chunks with pgvector cosine ANN (ORDER BY embedding <=> query)."""
    top_k = max(1, min(int(top_k), 50))
    query_embedding = (await embed_texts([query]))[0]
    distance = DocumentChunk.embedding.cosine_distance(query_embedding)

    result = await db.execute(
        select(DocumentChunk, distance.label("distance"))
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.user_id == user_id)
        .where(DocumentChunk.embedding.is_not(None))
        .order_by(distance)
        .limit(top_k)
    )
    rows = result.all()
    return [
        {
            "content": chunk.content,
            "document_id": str(chunk.document_id),
            "chunk_index": chunk.chunk_index,
            "score": distance_to_score(dist),
        }
        for chunk, dist in rows
    ]
