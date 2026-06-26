from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis import close_redis
from app.modules.analytics.router import router as analytics_router
from app.modules.audits.router import router as audits_router
from app.modules.auth.router import router as auth_router
from app.modules.passports.router import router as passports_router
from app.modules.projects.router import router as projects_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await close_redis()


app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    description=(
        "NEXUS AI REST API — wallet auth, startup projects, skill passports, "
        "contract audits, and analytics."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "auth", "description": "SIWE wallet authentication and sessions"},
        {"name": "projects", "description": "Startup builder projects"},
        {"name": "skill-passports", "description": "Skill passport credentials and NFT linkage"},
        {"name": "audits", "description": "Smart contract audit submissions and reports"},
        {"name": "analytics", "description": "Product analytics and dashboard metrics"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(projects_router, prefix=settings.api_v1_prefix)
app.include_router(passports_router, prefix=settings.api_v1_prefix)
app.include_router(audits_router, prefix=settings.api_v1_prefix)
app.include_router(analytics_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}


@app.get(f"{settings.api_v1_prefix}/health")
async def health_v1() -> dict[str, str]:
    return {"status": "ok", "service": "nexus-api", "version": "0.2.0"}
