import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_analytics_dashboard_and_events(client: AsyncClient) -> None:
    event = await client.post(
        "/api/v1/analytics/events",
        json={"event_type": "page_view", "event_data": {"page": "/dashboard"}},
    )
    assert event.status_code == 200
    assert event.json()["data"]["event_type"] == "page_view"

    listing = await client.get("/api/v1/analytics/events")
    assert listing.status_code == 200
    assert listing.json()["meta"]["total"] >= 1

    dashboard = await client.get("/api/v1/analytics/dashboard")
    assert dashboard.status_code == 200
    data = dashboard.json()["data"]
    assert "total_projects" in data
    assert "recent_events" in data


@pytest.mark.asyncio
async def test_analytics_require_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/analytics/dashboard")
    assert response.status_code == 401
