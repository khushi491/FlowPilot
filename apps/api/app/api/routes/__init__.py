from fastapi import APIRouter

from app.api.routes import documents, runs, templates, workflows, ws

api_router = APIRouter()
api_router.include_router(workflows.router, tags=["workflows"])
api_router.include_router(runs.router, tags=["runs"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(templates.router, tags=["templates"])
api_router.include_router(ws.router, tags=["websocket"])
