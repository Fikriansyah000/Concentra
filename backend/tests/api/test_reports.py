import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

def test_report_generation(client: TestClient):
    # 1. Create a session
    sess_res = client.post("/api/v1/sessions", json={"title": "Report Session"})
    session_id = sess_res.json()["id"]

    now_iso = datetime.now(timezone.utc).isoformat()

    # 2. Add focus logs
    client.post(
        "/api/v1/focus-logs/batch",
        json={
            "session_id": session_id,
            "logs": [
                {
                    "focus_score": 90.0,
                    "face_detected": True,
                    "face_count": 1,
                    "head_direction": "front",
                    "focus_level": "high",
                    "is_distracted": False,
                    "face_missing_duration_ms": 0,
                    "recorded_at": now_iso
                }
            ]
        }
    )

    # 3. Stop session
    client.patch(f"/api/v1/sessions/{session_id}", json={"action": "stop"})

    # 4. Generate report
    gen_res = client.post(f"/api/v1/reports/generate/{session_id}")
    assert gen_res.status_code == 201
    report_data = gen_res.json()
    assert report_data["session_id"] == session_id
    assert report_data["avg_focus_score"] == 90.0
    assert report_data["focus_distribution"]["high"] == 100.0
