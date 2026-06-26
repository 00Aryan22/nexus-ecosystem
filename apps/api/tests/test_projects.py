import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_create_and_list_projects(client: AsyncClient) -> None:
    payload = {
        "name": "Nexus DeFi",
        "industry": "Web3",
        "problem_statement": "Founders lack AI-guided startup planning tools.",
        "stage": "idea",
        "is_public": False,
    }
    create = await client.post("/api/v1/projects", json=payload)
    assert create.status_code == 201
    body = create.json()
    assert body["data"]["name"] == "Nexus DeFi"
    project_id = body["data"]["id"]

    listing = await client.get("/api/v1/projects")
    assert listing.status_code == 200
    assert listing.json()["meta"]["total"] >= 1

    get_one = await client.get(f"/api/v1/projects/{project_id}")
    assert get_one.status_code == 200

    update = await client.put(
        f"/api/v1/projects/{project_id}",
        json={"stage": "building", "name": "Nexus DeFi v2"},
    )
    assert update.status_code == 200
    assert update.json()["data"]["stage"] == "building"

    delete = await client.delete(f"/api/v1/projects/{project_id}")
    assert delete.status_code == 200
    assert delete.json()["data"]["deleted"] is True


@pytest.mark.asyncio
async def test_projects_require_auth() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/projects")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_project_ownership_forbidden(client: AsyncClient, other_user) -> None:
    from app.core.database import AsyncSessionLocal
    from app.models.project import Project

    async with AsyncSessionLocal() as db:
        project = Project(
            user_id=other_user.id,
            name="Other Project",
            industry="AI",
            problem_statement="Someone else's startup idea here.",
            stage="idea",
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        project_id = project.id

    response = await client.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 403
