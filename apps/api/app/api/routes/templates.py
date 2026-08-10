from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.models.workflow import Workflow, WorkflowVersion
from app.schemas.workflow import TemplateOut, TemplateUseRequest, WorkflowOut
from app.services.templates import get_template, list_templates

router = APIRouter()


@router.get("/templates", response_model=list[TemplateOut])
async def get_templates():
    return [
        TemplateOut(
            id=t["id"],
            name=t["name"],
            description=t["description"],
            tags=t["tags"],
            example_input=t["example_input"],
            definition=t["definition"],
        )
        for t in list_templates()
    ]


@router.post("/templates/{template_id}/use", response_model=WorkflowOut, status_code=201)
async def use_template(
    template_id: str,
    payload: TemplateUseRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    template = get_template(template_id)
    if not template:
        raise AppError("Template not found", status_code=404, code="not_found")

    workflow = Workflow(
        id=uuid4(),
        user_id=user.id,
        name=payload.name or template["name"],
        description=template["description"],
        status="draft",
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
            changelog=f"Created from template {template_id}",
        )
    )
    await db.commit()
    await db.refresh(workflow)
    return workflow
