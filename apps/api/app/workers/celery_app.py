from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "flowpilot",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)
celery_app.conf.task_routes = {"app.workers.tasks.*": {"queue": "flowpilot"}}
celery_app.conf.task_default_queue = "flowpilot"
