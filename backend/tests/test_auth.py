import pytest
from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/api/v1/auth/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_get_me(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "total_sessions" in data

def test_sync_user(client: TestClient):
    payload = {
        "supabase_uid": "test-supabase-uid-123",
        "email": "testuser@example.com",
        "full_name": "Updated Test User",
        "avatar_url": "https://example.com/avatar.jpg"
    }
    response = client.post("/api/v1/auth/sync-user", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"

def test_logout(client: TestClient):
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
