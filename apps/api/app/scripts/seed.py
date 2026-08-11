"""Seed demo user, sample workflow, and a knowledge document."""

import asyncio
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.document import Document
from app.models.user import User
from app.models.workflow import Workflow, WorkflowVersion
from app.services.rag import process_document
from app.services.templates import get_template

DEMO_EMAIL = "demo@flowpilot.dev"
DEMO_PASSWORD = "demo12345"


async def seed(*, force: bool = False) -> None:
    settings = get_settings()
    if not force and not settings.is_dev_env and not settings.seed_on_start:
        raise SystemExit(
            "Refusing to seed outside development. "
            "Set APP_ENV=development or SEED_ON_START=true (or pass --force)."
        )

    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                id=uuid4(),
                email=DEMO_EMAIL,
                full_name="Demo User",
                hashed_password=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            print(f"Created demo user {DEMO_EMAIL}")
        else:
            print(f"Demo user already exists: {DEMO_EMAIL}")

        wf_result = await db.execute(select(Workflow).where(Workflow.user_id == user.id))
        if not wf_result.scalars().first():
            template = get_template("resume-reviewer")
            assert template
            workflow = Workflow(
                id=uuid4(),
                user_id=user.id,
                name=template["name"],
                description=template["description"],
                status="active",
                definition=template["definition"],
                tags=template["tags"],
            )
            db.add(workflow)
            db.add(
                WorkflowVersion(
                    id=uuid4(),
                    workflow_id=workflow.id,
                    version=1,
                    definition=template["definition"],
                    changelog="Seeded demo workflow",
                )
            )
            await db.commit()
            print(f"Created demo workflow: {workflow.name}")

        doc_result = await db.execute(select(Document).where(Document.user_id == user.id))
        if not doc_result.scalars().first():
            content = (
                "FlowPilot Support Knowledge Base\n\n"
                "Refund Policy: Customers charged twice should contact support. "
                "We issue refunds within 5 business days for duplicate charges.\n\n"
                "Subscription changes can be made from the billing portal. "
                "Human approval is required before sending automated replies."
            )
            doc_id = uuid4()
            path = Path(settings.upload_dir) / f"{doc_id}_support-kb.txt"
            path.write_text(content, encoding="utf-8")
            document = Document(
                id=doc_id,
                user_id=user.id,
                filename="support-kb.txt",
                content_type="text/plain",
                size_bytes=len(content.encode("utf-8")),
                storage_path=str(path),
                text_content=content,
                chunk_count=0,
                meta={"status": "uploaded", "seed": True},
            )
            db.add(document)
            await db.commit()
            await db.refresh(document)
            await process_document(db, document)
            print("Created and indexed demo document")

    print("Seed complete.")
    print(f"Login with {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    import sys

    force = "--force" in sys.argv
    asyncio.run(seed(force=force))
