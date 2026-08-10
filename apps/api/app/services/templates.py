from typing import Any

TEMPLATES: list[dict[str, Any]] = [
    {
        "id": "resume-reviewer",
        "name": "Resume Reviewer Agent",
        "description": "Analyze a resume against a job description and return structured feedback.",
        "tags": ["hr", "llm", "review"],
        "example_input": {
            "resume_text": "Jane Doe — Software Engineer with 4 years of Python experience...",
            "job_description": "Looking for a backend engineer with FastAPI and PostgreSQL...",
        },
        "definition": {
            "nodes": [
                {
                    "id": "llm-1",
                    "type": "llm",
                    "position": {"x": 100, "y": 120},
                    "data": {
                        "label": "Review Resume",
                        "type": "llm",
                        "config": {
                            "prompt": "Review this resume for the role. Resume: {{resume_text}}. Job: {{job_description}}. Provide strengths, gaps, and a score.",
                            "model": "gpt-4o-mini",
                        },
                    },
                },
                {
                    "id": "output-1",
                    "type": "output",
                    "position": {"x": 420, "y": 120},
                    "data": {"label": "Final Review", "type": "output", "config": {"key": "review"}},
                },
            ],
            "edges": [{"id": "e1", "source": "llm-1", "target": "output-1"}],
        },
    },
    {
        "id": "customer-support",
        "name": "Customer Support Auto-Reply Agent",
        "description": "Draft a polite support reply using RAG context from uploaded docs.",
        "tags": ["support", "rag", "automation"],
        "example_input": {"ticket": "I was charged twice for my subscription this month."},
        "definition": {
            "nodes": [
                {
                    "id": "rag-1",
                    "type": "rag",
                    "position": {"x": 80, "y": 100},
                    "data": {
                        "label": "Search Knowledge Base",
                        "type": "rag",
                        "config": {"query": "{{ticket}}", "top_k": 4},
                    },
                },
                {
                    "id": "llm-1",
                    "type": "llm",
                    "position": {"x": 360, "y": 100},
                    "data": {
                        "label": "Draft Reply",
                        "type": "llm",
                        "config": {
                            "prompt": "Using context: {{context}}. Draft a helpful support reply for: {{ticket}}",
                            "model": "gpt-4o-mini",
                        },
                    },
                },
                {
                    "id": "approval-1",
                    "type": "approval",
                    "position": {"x": 640, "y": 100},
                    "data": {
                        "label": "Human Approval",
                        "type": "approval",
                        "config": {"message": "Approve support reply before send"},
                    },
                },
                {
                    "id": "output-1",
                    "type": "output",
                    "position": {"x": 900, "y": 100},
                    "data": {"label": "Reply", "type": "output", "config": {"key": "reply"}},
                },
            ],
            "edges": [
                {"id": "e1", "source": "rag-1", "target": "llm-1"},
                {"id": "e2", "source": "llm-1", "target": "approval-1"},
                {"id": "e3", "source": "approval-1", "target": "output-1"},
            ],
        },
    },
    {
        "id": "research-summarizer",
        "name": "Research Summarizer Agent",
        "description": "Fetch research content via API and summarize key findings.",
        "tags": ["research", "summarize", "api"],
        "example_input": {"topic": "agentic workflow orchestration"},
        "definition": {
            "nodes": [
                {
                    "id": "api-1",
                    "type": "api",
                    "position": {"x": 80, "y": 140},
                    "data": {
                        "label": "Fetch Notes",
                        "type": "api",
                        "config": {
                            "method": "GET",
                            "url": "https://httpbin.org/get",
                            "query": {"topic": "{{topic}}"},
                        },
                    },
                },
                {
                    "id": "llm-1",
                    "type": "llm",
                    "position": {"x": 360, "y": 140},
                    "data": {
                        "label": "Summarize",
                        "type": "llm",
                        "config": {
                            "prompt": "Summarize research about {{topic}} using this payload: {{api_response}}",
                            "model": "gpt-4o-mini",
                        },
                    },
                },
                {
                    "id": "output-1",
                    "type": "output",
                    "position": {"x": 640, "y": 140},
                    "data": {"label": "Summary", "type": "output", "config": {"key": "summary"}},
                },
            ],
            "edges": [
                {"id": "e1", "source": "api-1", "target": "llm-1"},
                {"id": "e2", "source": "llm-1", "target": "output-1"},
            ],
        },
    },
]


def list_templates() -> list[dict[str, Any]]:
    return TEMPLATES


def get_template(template_id: str) -> dict[str, Any] | None:
    return next((t for t in TEMPLATES if t["id"] == template_id), None)
