from typing import Optional
from uuid import UUID

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import decode_access_token, hash_password
from app.db.session import get_db
from app.models.user import User

DEMO_EMAIL = "demo@flowpilot.dev"


async def get_or_create_demo_user(db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(
        email=DEMO_EMAIL,
        full_name="Demo User",
        hashed_password=hash_password("demo-password"),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
    x_demo_user: Optional[str] = Header(default=None, alias="X-Demo-User"),
) -> User:
    """Resolve authenticated user. Falls back to demo user before full auth UI lands."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        user_id = decode_access_token(token)
        if not user_id:
            raise AppError("Invalid or expired token", status_code=401, code="unauthorized")
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise AppError("User not found", status_code=401, code="unauthorized")
        return user

    if x_demo_user == "1" or authorization is None:
        return await get_or_create_demo_user(db)

    raise AppError("Authentication required", status_code=401, code="unauthorized")


def parse_uuid(value: str, field_name: str = "id") -> UUID:
    try:
        return UUID(value)
    except ValueError as exc:
        raise AppError(f"Invalid {field_name}", status_code=400, code="invalid_id") from exc
