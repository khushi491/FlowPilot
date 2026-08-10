import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.core.config import get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.workflow import DocumentOut

router = APIRouter()
settings = get_settings()


@router.post("/documents/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename:
        raise AppError("Filename is required", code="invalid_file")

    content_type = file.content_type or "application/octet-stream"
    allowed = {
        "text/plain",
        "application/pdf",
        "text/markdown",
        "application/octet-stream",
    }
    if content_type not in allowed and not file.filename.lower().endswith((".txt", ".md", ".pdf")):
        raise AppError("Only text, markdown, and PDF files are supported", code="unsupported_type")

    raw = await file.read()
    if not raw:
        raise AppError("Uploaded file is empty", code="empty_file")

    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)
    doc_id = uuid.uuid4()
    safe_name = Path(file.filename).name
    storage_path = upload_root / f"{doc_id}_{safe_name}"
    storage_path.write_bytes(raw)

    text_content = ""
    if safe_name.lower().endswith((".txt", ".md")) or content_type.startswith("text/"):
        text_content = raw.decode("utf-8", errors="ignore")
    elif safe_name.lower().endswith(".pdf") or content_type == "application/pdf":
        text_content = f"[PDF uploaded: {safe_name}] Text extraction will run during RAG processing."

    document = Document(
        id=doc_id,
        user_id=user.id,
        filename=safe_name,
        content_type=content_type,
        size_bytes=len(raw),
        storage_path=str(storage_path),
        text_content=text_content,
        chunk_count=0,
        meta={"status": "uploaded"},
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


@router.get("/documents", response_model=list[DocumentOut])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


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
