import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis import close_redis
from app.modules.ai.router import router as ai_router
from app.modules.analytics.router import router as analytics_router
from app.modules.auditor.router import router as auditor_router
from app.modules.audits.router import router as audits_router
from app.modules.auth.router import router as auth_router
from app.modules.dev_infra.router import router as dev_infra_router
from app.modules.founder_agent.router import router as founder_agent_router
from app.modules.memory.router import router as memory_router
from app.modules.passports.router import router as passports_router
from app.modules.projects.router import router as projects_router
from app.modules.stitch.router import router as stitch_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Eagerly initialise DB engine on startup so the first request is fast
    from app.core.database import get_engine

    await get_engine()
    yield
    await close_redis()
    from app.core.database import dispose_engine

    await dispose_engine()


app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    description=(
        "NEXUS AI REST API — wallet auth, startup projects, skill passports, "
        "contract audits, analytics, and AI founder agent."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "auth", "description": "SIWE wallet authentication and sessions"},
        {"name": "projects", "description": "Startup builder projects"},
        {"name": "skill-passports", "description": "Skill passport credentials and NFT linkage"},
        {"name": "audits", "description": "Audit history (legacy CRUD)"},
        {"name": "auditor", "description": "AI Smart Contract Auditor with SSE streaming"},
        {"name": "analytics", "description": "Product analytics and dashboard metrics"},
        {
            "name": "founder_agent",
            "description": "AI Founder Agent conversations and startup planning",
        },
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(projects_router, prefix=settings.api_v1_prefix)
app.include_router(passports_router, prefix=settings.api_v1_prefix)
app.include_router(audits_router, prefix=settings.api_v1_prefix)
app.include_router(auditor_router, prefix=settings.api_v1_prefix)
app.include_router(analytics_router, prefix=settings.api_v1_prefix)
app.include_router(founder_agent_router, prefix=settings.api_v1_prefix)
app.include_router(ai_router, prefix=settings.api_v1_prefix)
app.include_router(stitch_router, prefix=settings.api_v1_prefix)
app.include_router(memory_router, prefix=settings.api_v1_prefix)
app.include_router(dev_infra_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "status": "operational",
        "docs": "/docs",
        "version": "0.2.0",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}


@app.get(f"{settings.api_v1_prefix}/health")
async def health_v1() -> dict[str, str]:
    return {"status": "ok", "service": "nexus-api", "version": "0.2.0"}
