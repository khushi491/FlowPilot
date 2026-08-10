# FlowPilot

Visual AI-agent workflow builder for creating, running, and monitoring LLM-powered automation workflows with drag-and-drop nodes.

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, React Flow, lucide-react
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL + pgvector
- **Queue:** Redis + Celery
- **Realtime:** WebSockets
- **Auth:** JWT
- **Deployment:** Docker + GitHub Actions

## Monorepo Structure

```
FlowPilot/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── docker/           # Docker-related assets
├── .github/          # CI workflows
└── docker-compose.yml
```

## Quick Start

See upcoming documentation for local setup with Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

## License

MIT
