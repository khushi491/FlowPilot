# Docker development setup

## Services

| Service  | Description                         | Port |
|----------|-------------------------------------|------|
| `web`    | Next.js frontend                    | 3000 |
| `api`    | FastAPI backend + migrations        | 8000 |
| `worker` | Celery worker (optional scale path) | —    |
| `postgres` | PostgreSQL + pgvector             | 5432 |
| `redis`  | Redis broker/cache                  | 6379 |

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:3000
- API docs: http://localhost:8000/docs

## Environment variables

See root `.env.example` for the full list. Important values:

- `DATABASE_URL` / `DATABASE_URL_SYNC` — Postgres connection strings
- `REDIS_URL` — Redis for Celery
- `JWT_SECRET` — change in any shared environment
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` — browser-facing API endpoints
- `USE_MOCK_LLM` / `USE_MOCK_EMBEDDINGS` — keep `true` without API keys
