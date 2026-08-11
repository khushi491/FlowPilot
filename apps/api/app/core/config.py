from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# apps/api/app/core/config.py -> repo root is 4 levels up
REPO_ROOT = Path(__file__).resolve().parents[4]
ENV_CANDIDATES = (
    REPO_ROOT / ".env",
    Path.cwd() / ".env",
    Path(__file__).resolve().parents[2] / ".env",  # apps/api/.env
)

PLACEHOLDER_JWT_SECRET = "change-me-to-a-long-random-secret"
_DEV_ENVS = frozenset({"development", "dev", "test", "local"})


def _env_files() -> tuple[str, ...]:
    return tuple(str(path) for path in ENV_CANDIDATES if path.exists())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_files() or (".env",),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "FlowPilot API"
    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    database_url: str = "postgresql+asyncpg://flowpilot:flowpilot@localhost:5433/flowpilot"
    database_url_sync: str = "postgresql://flowpilot:flowpilot@localhost:5433/flowpilot"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = PLACEHOLDER_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    upload_dir: str = str(REPO_ROOT / "uploads")
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    llm_model: str = "gpt-4o-mini"
    use_mock_llm: bool = True
    use_mock_embeddings: bool = True

    default_node_timeout_seconds: int = 60
    default_max_retries: int = 2
    embedding_dimensions: int = 1536
    use_celery: bool = False

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_dev_env(self) -> bool:
        return self.app_env.strip().lower() in _DEV_ENVS

    @model_validator(mode="after")
    def reject_placeholder_jwt_outside_dev(self) -> "Settings":
        if not self.is_dev_env and self.jwt_secret == PLACEHOLDER_JWT_SECRET:
            raise ValueError(
                "JWT_SECRET must be set to a strong random value when APP_ENV is not a "
                "development/test environment"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
