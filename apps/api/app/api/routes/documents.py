import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.core.config import get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.workflow import DocumentOut
from app.services.rag import process_document

router = APIRouter()
settings = get_settings()

ALLOWED_EXTENSIONS = {".txt", ".md", ".markdown", ".pdf"}
ALLOWED_CONTENT_TYPES = {
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/octet-stream",
}


def _detect_kind(filename: str, content_type: str, raw: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise AppError("Only .txt, .md, and .pdf files are supported", code="unsupported_type")
    if content_type not in ALLOWED_CONTENT_TYPES and not content_type.startswith("text/"):
        raise AppError("Unsupported content type", code="unsupported_type")

    if suffix == ".pdf" or content_type == "application/pdf":
        if not raw.startswith(b"%PDF"):
            raise AppError("File content does not look like a PDF", code="invalid_file")
        return "pdf"
    if suffix in {".md", ".markdown"}:
        return "markdown"
    return "text"


@router.post("/documents/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename:
        raise AppError("Filename is required", code="invalid_file")

    safe_name = Path(file.filename).name
    if not safe_name or safe_name in {".", ".."}:
        raise AppError("Invalid filename", code="invalid_file")

    content_type = file.content_type or "application/octet-stream"
    raw = await file.read(settings.max_upload_bytes + 1)
    if len(raw) > settings.max_upload_bytes:
        raise AppError(
            f"File exceeds maximum size of {settings.max_upload_bytes} bytes",
            code="file_too_large",
        )
    if not raw:
        raise AppError("Uploaded file is empty", code="empty_file")

    kind = _detect_kind(safe_name, content_type, raw)

    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)
    doc_id = uuid.uuid4()
    storage_path = upload_root / f"{doc_id}_{safe_name}"
    storage_path.write_bytes(raw)

    document = Document(
        id=doc_id,
        user_id=user.id,
        filename=safe_name,
        content_type=content_type,
        size_bytes=len(raw),
        storage_path=str(storage_path),
        text_content="",
        chunk_count=0,
        meta={"status": "uploaded", "kind": kind},
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    try:
        document = await process_document(db, document)
    except Exception as exc:  # noqa: BLE001
        document.meta = {**(document.meta or {}), "status": "failed", "error": str(exc)}
        await db.commit()
        await db.refresh(document)
        raise AppError(f"Failed to process document: {exc}", status_code=500, code="rag_failed") from exc

    return document


@router.get("/documents", response_model=PaginatedResponse[DocumentOut])
async def list_documents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = [Document.user_id == user.id]
    total = await db.scalar(select(func.count()).select_from(Document).where(*filters))
    result = await db.execute(
        select(Document)
        .where(*filters)
        .order_by(Document.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return PaginatedResponse(
        items=list(result.scalars().all()),
        total=int(total or 0),
        limit=limit,
        offset=offset,
    )


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    did = parse_uuid(document_id, "document_id")
    result = await db.execute(select(Document).where(Document.id == did, Document.user_id == user.id))
    document = result.scalar_one_or_none()
    if not document:
        raise AppError("Document not found", status_code=404, code="not_found")

    path = Path(document.storage_path)
    if path.exists():
        path.unlink()

    await db.delete(document)
    await db.commit()
    return None
