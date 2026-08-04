import pytest
from fastapi.testclient import TestClient

def test_create_and_get_session(client: TestClient):
    # 1. Create session
    payload = {
        "title": "Belajar Mathematics",
        "source_url": "https://youtube.com/watch?v=123",
        "source_type": "youtube"
    }
    response = client.post("/api/v1/sessions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Belajar Mathematics"
    assert data["status"] == "active"
    session_id = data["id"]

    # 2. Get active session
    active_res = client.get("/api/v1/sessions/active")
    assert active_res.status_code == 200
    assert active_res.json()["id"] == session_id

    # 3. Update session (pause)
    patch_res = client.patch(f"/api/v1/sessions/{session_id}", json={"action": "pause"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "paused"
    assert patch_res.json()["pause_count"] == 1

    # 4. List sessions
    list_res = client.get("/api/v1/sessions")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1
