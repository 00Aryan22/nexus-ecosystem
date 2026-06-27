<USER_REQUEST>
Phase 3 backend work is **code-complete**. Here is what was finished and how to verify it locally.

## Phase 3 deliverables

### CRUD APIs (auth required, row ownership enforced)

| Module | Endpoints |
|--------|-----------|
| **Projects** | `POST/GET/GET{id}/PUT/DELETE` `/api/v1/projects` |
| **Skill Passports** | `POST/GET/GET{id}/PUT` `/api/v1/passports` |
| **Audits** | `POST /api/v1/audits/submit`, `GET /api/v1/audits`, `GET /api/v1/audits/{id}`, `GET /api/v1/audits/{id}/report` |
| **Analytics** | `GET /api/v1/analytics/dashboard`, `POST/GET /api/v1/analytics/events` |

All responses use the shared `ApiResponse` envelope with pagination `meta` where applicable. OpenAPI tags are registered in `main.py` (v0.2.0).

### Supporting work
- **Services**: `project_service`, `passport_service`, `audit_service`, `analytics_service`
- **Migrations**: `002`–`005` (projects, skill_passports/nft_records, audits, analytics_events)
- **Seed script**: `apps/api/scripts/seed_demo.py`
- **Tests**: 13 tests across projects, passports, audits, analytics (+ auth/health)
- **ER diagram**: updated at `docs/diagrams/er_diagram.mmd`
- **CI**: Postgres + Redis service containers, `alembic upgrade head` before pytest

### Local verification (Docker required)

Docker Desktop is not running on your machine, so migrations and integration tests could not run here. Once it is up:

```powershell
# Start infra
cd "d:\Projects\Nexus-AI Ecosystem\infra\docker"
docker compose up -d

# Migrate
cd "d:\Projects\Nexus-AI Ecosystem\apps\api"
alembic upgrade head

# Seed demo data
python -m scripts.seed_demo

# Run tests
pytest -v
```

OpenAPI docs: `http://localhost:8000/docs` (after starting the API).

### Test status (without Docker)
- **7 passed** — health checks, auth-guard tests (401), invalid nonce validation  
- **6 failed/errored** — all due to Postgres/Redis connection refused

---

Phase 3 is ready for your review. **Do not start Phase 4 (Stitch UI screens)** until you approve.

When you are ready, I can **commit and 
<truncated 45215 bytes>
GER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);
```

---

## 5.8 Table: `fraud_reports`

```sql
CREATE TABLE fraud_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id    UUID REFERENCES users(id),
    target_wallet       VARCHAR(42) NOT NULL,
    fraud_score         NUMERIC(5,2) NOT NULL CHECK (fraud_score >= 0 AND fraud_score <= 100),
    risk_level          VARCHAR(20) NOT NULL
                        CHECK (risk_level IN ('low','medium','high','critical')),
    indicators_json     JSONB NOT NULL DEFAULT '[]',
    evidence_json       JSONB,
    ai_summary          TEXT,
    resolved            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5.9 Table: `analytics_events`

```sql
CREATE TABLE analytics_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    event_type      VARCHAR(100) NOT NULL,
    event_data      JSONB,
    wallet_address  VARCHAR(42),
    ip_hash         VARCHAR(64),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Event Types Reference
```
wallet_connected       | startup_created     | plan_generated
audit_submitted        | audit_completed     | passport_evaluated
nft_minted             | fraud_score_viewed  | dashboard_viewed
profile_updated        | export_pdf          | session_started
```

---

## 5.10 ER Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        varchar wallet_address UK
        varchar username UK
        varchar role
        boolean is_active
        timestamptz created_at
    }
   
<truncated 31584 bytes>

NOTE: The output was truncated because it was too long. Use a more targeted query or a smaller range to get the information you need.