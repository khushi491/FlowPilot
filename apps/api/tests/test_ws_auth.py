from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_websocket_requires_token():
    with client.websocket_connect(f"/ws/runs/{uuid4()}") as websocket:
        message = websocket.receive_json()
        assert message["type"] == "error"
        assert "Authentication" in message["message"]


def test_websocket_rejects_invalid_token():
    with client.websocket_connect(f"/ws/runs/{uuid4()}?token=not-a-valid-jwt") as websocket:
        message = websocket.receive_json()
        assert message["type"] == "error"
        assert "Invalid" in message["message"]
