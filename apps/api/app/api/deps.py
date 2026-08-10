from typing import Optional
from uuid import UUID

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError("Authentication required", status_code=401, code="unauthorized")

    token = authorization.split(" ", 1)[1].strip()
    user_id = decode_access_token(token)
    if not user_id:
        raise AppError("Invalid or expired token", status_code=401, code="unauthorized")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppError("User not found", status_code=401, code="unauthorized")
    return user


def parse_uuid(value: str, field_name: str = "id") -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise AppError(f"Invalid {field_name}", status_code=400, code="invalid_id") from exc
