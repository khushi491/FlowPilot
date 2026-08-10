from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class WorkflowCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    status: str = "draft"
    definition: dict[str, Any] = Field(default_factory=lambda: {"nodes": [], "edges": []})
    tags: list[str] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    definition: Optional[dict[str, Any]] = None
    tags: Optional[list[str]] = None


class WorkflowOut(ORMModel):
    id: UUID
    user_id: UUID
    name: str
    description: str
    status: str
    definition: dict[str, Any]
    tags: list[Any]
    created_at: datetime
    updated_at: datetime


class RunCreate(BaseModel):
    input: dict[str, Any] = Field(default_factory=dict)


class WorkflowRunOut(ORMModel):
    id: UUID
    workflow_id: UUID
    user_id: UUID
    status: str
    input_payload: dict[str, Any]
    output_payload: Optional[dict[str, Any]]
    error_message: Optional[str]
    logs: list[Any]
    total_tokens: int
    estimated_cost_usd: float
    retry_count: int
    duration_ms: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


class NodeRunOut(ORMModel):
    id: UUID
    workflow_run_id: UUID
    node_id: str
    node_type: str
    status: str
    input_data: Optional[dict[str, Any]]
    output_data: Optional[dict[str, Any]]
    logs: list[Any]
    error_message: Optional[str]
    tokens_used: int
    estimated_cost_usd: float
    retry_count: int
    duration_ms: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


class DocumentOut(ORMModel):
    id: UUID
    user_id: UUID
    filename: str
    content_type: str
    size_bytes: int
    chunk_count: int
    meta: dict[str, Any]
    created_at: datetime


class TemplateOut(BaseModel):
    id: str
    name: str
    description: str
    tags: list[str]
    example_input: dict[str, Any]
    definition: dict[str, Any]


class TemplateUseRequest(BaseModel):
    name: Optional[str] = None
