from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_workflows_require_auth():
    response = client.get("/workflows")
    assert response.status_code == 401


def test_signup_validation_error():
    response = client.post("/auth/signup", json={"email": "not-an-email", "password": "short"})
    assert response.status_code == 422


def test_create_workflow_validation_without_auth():
    response = client.post("/workflows", json={"name": ""})
    assert response.status_code in {401, 422}


def test_paginated_list_endpoints_require_auth():
    for path in ("/workflows", "/runs", "/documents"):
        response = client.get(path)
        assert response.status_code == 401
