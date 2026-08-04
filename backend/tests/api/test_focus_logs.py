import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

def test_batch_focus_logs_and_timeline(client: TestClient):
    # 1. Create a session first
    sess_res = client.post("/api/v1/sessions", json={"title": "Test Log Session"})
    session_id = sess_res.json()["id"]

    now_iso = datetime.now(timezone.utc).isoformat()

    # 2. Batch insert logs
    batch_payload = {
        "session_id": session_id,
        "logs": [
            {
                "focus_score": 85.0,
                "face_detected": True,
                "face_count": 1,
                "head_yaw": 2.0,
                "head_pitch": 1.0,
                "head_roll": 0.0,
                "head_direction": "front",
                "focus_level": "high",
                "is_distracted": False,
                "face_missing_duration_ms": 0,
                "recorded_at": now_iso
            },
            {
                "focus_score": 40.0,
                "face_detected": True,
                "face_count": 1,
                "head_yaw": 30.0,
                "head_pitch": 5.0,
                "head_roll": 0.0,
                "head_direction": "left",
                "focus_level": "low",
                "is_distracted": True,
                "face_missing_duration_ms": 0,
                "recorded_at": now_iso
            }
        ]
    }

    batch_res = client.post("/api/v1/focus-logs/batch", json=batch_payload)
    assert batch_res.status_code == 201
    assert batch_res.json()["inserted_count"] == 2

    # 3. Get timeline
    timeline_res = client.get(f"/api/v1/focus-logs/session/{session_id}/timeline?interval=1m")
    assert timeline_res.status_code == 200
    timeline_data = timeline_res.json()["data"]
    assert len(timeline_data) >= 1
