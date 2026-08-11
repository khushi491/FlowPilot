import pytest

from app.api.routes.documents import _detect_kind
from app.core.errors import AppError


def test_detect_kind_accepts_text():
    assert _detect_kind("notes.txt", "text/plain", b"hello") == "text"


def test_detect_kind_accepts_markdown():
    assert _detect_kind("readme.md", "text/markdown", b"# hi") == "markdown"


def test_detect_kind_accepts_pdf_header():
    assert _detect_kind("doc.pdf", "application/pdf", b"%PDF-1.4 fake") == "pdf"


def test_detect_kind_rejects_fake_pdf():
    with pytest.raises(AppError) as exc:
        _detect_kind("doc.pdf", "application/pdf", b"not-a-pdf")
    assert exc.value.code == "invalid_file"


def test_detect_kind_rejects_unknown_extension():
    with pytest.raises(AppError) as exc:
        _detect_kind("evil.exe", "application/octet-stream", b"MZ")
    assert exc.value.code == "unsupported_type"
