import pytest
from fastapi.testclient import TestClient

def test_analytics_endpoints(client: TestClient):
    # 1. Summary
    sum_res = client.get("/api/v1/analytics/summary")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert "total_study_sessions" in sum_data
    assert "avg_focus_score" in sum_data

    # 2. Weekly
    wk_res = client.get("/api/v1/analytics/weekly")
    assert wk_res.status_code == 200
    wk_data = wk_res.json()
    assert "daily_breakdown" in wk_data

    # 3. Daily
    daily_res = client.get("/api/v1/analytics/daily")
    assert daily_res.status_code == 200
    assert isinstance(daily_res.json(), list)

    # 4. Trends
    tr_res = client.get("/api/v1/analytics/focus-trend?days=7")
    assert tr_res.status_code == 200
    assert len(tr_res.json()) == 7

    # 5. Study Patterns
    pt_res = client.get("/api/v1/analytics/study-pattern")
    assert pt_res.status_code == 200
    pt_data = pt_res.json()
    assert "most_productive_hour" in pt_data
    assert "hourly_distribution" in pt_data
