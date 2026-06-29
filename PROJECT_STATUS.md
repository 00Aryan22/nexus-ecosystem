# NEXUS AI — Project Status & Development Log

> **Repository:** [00Aryan22/nexus-ecosystem](https://github.com/00Aryan22/nexus-ecosystem)
> **Last updated:** June 29, 2026
> **Current state:** Phases 1–7 complete · CI stabilized · Stitch UI HTML/CSS complete

> **Documentation rule:** Only update markdown when a real code or setup change has been completed. Draft notes should remain off the committed docs until they are validated.

---

## What This Project Is

**NEXUS AI** is an AI-powered Startup Operating System built for the Web3 + AI era.

It gives founders a single platform to:
- Validate and plan a startup idea with an AI co-founder (chat + structured frameworks)
- Mint a Soulbound Skill Passport NFT on Polygon to prove their credentials on-chain
- Submit smart contracts for AI-assisted security auditing
- Track analytics and project metrics from a unified dashboard

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15 (App Router), React, TypeScript, TailwindCSS, ShadCN UI, Zustand, TanStack Query, Framer Motion |
| **Backend** | FastAPI, PostgreSQL, SQLAlchemy (async), Alembic, Redis, JWT, SIWE wallet authentication |
| **AI** | Emergent Universal LLM → Gemini API → Ollama (fallback chain), LangGraph, CrewAI (planned), ChromaDB (planned) |
| **Blockchain** | Solidity, Hardhat, Polygon Amoy, OpenZeppelin, Pinata IPFS, WalletConnect, MetaMask, Viem, Wagmi |
| **Infrastructure** | Docker, GitHub Actions CI, Vercel (frontend), Railway (backend), Turborepo monorepo |

---

## What Was Already Done (Phases 1–4)

### Phase 1 — Project Foundation ✅
- Turborepo monorepo structure: `apps/web`, `apps/api`, `packages/agents`, `packages/contracts`
- Docker Compose stack: API + PostgreSQL + Redis + ChromaDB + Ollama
- GitHub Actions CI pipeline (lint, typecheck, test, build)
- `.env.example` secrets contract — no hardcoded credentials anywhere

### Phase 2 — Authentication & Wallet ✅
- **SIWE (Sign-In with Ethereum)** — full wallet-based login flow
- RainbowKit + Wagmi + WalletConnect on the frontend
- JWT access tokens issued on successful SIWE verification
- Redis nonce store with 5-minute TTL (single-use nonces)
- httpOnly cookie session management
- Next.js middleware protecting all `/dashboard` routes
- Refresh token rotation with reuse detection

### Phase 3 — Backend Database ✅
Six Alembic migrations covering all core tables:

| Migration | Tables Created |
|-----------|---------------|
| 001 | `users`, `wallets`, `sessions` |
| 002 | `projects` |
| 003 | `skill_passports`, `nft_records` |
| 004 | `audits` |
| 005 | `analytics_events` |
| 006 | `founder_conversations`, `founder_messages`, `startup_plans`, `ai_outputs`, `usage_stats` |

Full SQLAlchemy async ORM models, CRUD base, REST API structure established.

### Phase 4 — Frontend (Stitch UI) ✅
Complete UI across all major pages:
- **Landing page** — hero, features, Web3 styling
- **Auth** — wallet connect screen (MetaMask/WalletConnect/Coinbase)
- **Dashboard** — stat cards, activity feed, module overview
- **Founder Agent** — full chat interface (later wired in Phase 5)
- **Auditor** — Solidity paste/drag input + severity badges
- **Skill Passport** — badge grid, XP progress, NFT card
- **Analytics** — charts, metrics
- **Settings** — user preferences, feature flags
- Dark Web3 theme tokens throughout, fully responsive

All checks passing: `npm run lint`, `npm run typecheck`, `npm run build`.

---

## What Was Done in Phase 5 — AI Founder Agent ✅

### Backend
Built a complete AI conversation service with streaming SSE responses:

**New files created:**
- `apps/api/app/modules/founder_agent/` — models, schemas, router
- `apps/api/app/services/founder_agent/service.py` — conversation CRUD + streaming pipeline
- `apps/api/app/services/founder_agent/prompts.py` — 12 business framework prompt templates
- `apps/api/app/services/llm/provider.py` — multi-provider LLM abstraction with retry + fallback
- `apps/api/tests/test_founder_agent.py` — 7 API tests

**LLM Provider Chain (in order of priority):**
1. Emergent Universal LLM
2. Google Gemini 1.5 Pro
3. Ollama (local fallback)

Each provider has per-attempt retry logic. If one provider exhausts retries, the next is tried automatically.

**12 Supported Planning Frameworks (auto-detected from prompt):**
Startup Idea Generator · Business Model Canvas · Lean Canvas · Problem/Solution · Revenue Model · Competitor Analysis · SWOT · GTM Strategy · MVP Planner · Tech Stack Recommendation · Pitch Deck · Roadmap

**APIs Added:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/founder-agent/conversations` | List all conversations |
| `POST` | `/api/v1/founder-agent/conversations` | Create conversation |
| `GET` | `/api/v1/founder-agent/conversations/{id}` | Get conversation + messages |
| `PATCH` | `/api/v1/founder-agent/conversations/{id}` | Update title |
| `DELETE` | `/api/v1/founder-agent/conversations/{id}` | Delete conversation |
| `POST` | `/api/v1/founder-agent/conversations/{id}/chat` | **SSE streaming chat** |
| `GET` | `/api/v1/founder-agent/conversations/{id}/plans` | List startup plans |
| `GET` | `/api/v1/founder-agent/plans/{plan_id}` | Get a plan |
| `GET` | `/api/v1/founder-agent/usage` | Token/latency usage stats |
| `GET` | `/api/v1/founder-agent/prompts/suggestions` | Clickable starter prompts |

### Frontend
- **ChatMessage** — user/agent message bubbles with avatars
- **MarkdownContent** — GFM markdown rendering with syntax-highlighted code blocks
- **ConversationSidebar** — history list, new/delete conversation
- **PromptSuggestions** — clickable framework starters
- `founder-agent/page.tsx` — wired to real SSE streaming API
- `apps/web/app/api/v1/[...path]/route.ts` — SSE proxy to backend

---

## What Kiro Fixed — CI Stabilization ✅

After Phase 5 was pushed, **GitHub Actions CI was failing on backend tests**. Here is every root cause found and fixed:

### Root Cause 1 — Database Engine Not Falling Back Correctly
**Problem:** `database.py` created `AsyncSessionLocal` at import time bound to the asyncpg/Postgres engine. When Postgres wasn't running (local dev or CI without DB), the fallback to SQLite happened *after* the session factory was already bound to the broken engine, so every test fixture got `ConnectionRefusedError`.

**Fix:** Rewrote `database.py` with fully lazy engine initialization. The engine is only created on first use via `await get_engine()`. The SQLite fallback is selected *before* `AsyncSessionLocal` is bound. The lifespan handler now eagerly warms up the engine on startup so the first real request is fast.

**Files changed:** `apps/api/app/core/database.py`

---

### Root Cause 2 — PostgreSQL-Specific Types Breaking SQLite Fallback
**Problem:** All models imported `sqlalchemy.dialects.postgresql.JSONB` and `UUID(as_uuid=True)` directly. These types don't exist in SQLite, so `Base.metadata.create_all()` in the test setup failed.

**Fix:** Created `apps/api/app/core/types.py` with two cross-dialect TypeDecorators:
- `GUID` — uses `UUID` on Postgres, `VARCHAR(36)` on SQLite
- `JSONBCompat` — uses `JSONB` on Postgres, `JSON` on SQLite

Updated every model to use these instead of the dialect-specific types.

**Files changed:** `apps/api/app/core/types.py` *(new)*, all 5 model files + founder agent models

---

### Root Cause 3 — Pydantic v2 UUID Mismatch in Founder Agent Schemas
**Problem:** `AgentConversationPublic.user_id` was declared as `str`, but the ORM model stores `user_id` as `uuid.UUID`. Pydantic v2's strict-by-default validation rejected the `UUID` object with `Input should be a valid string`.

**Fix:** Changed `user_id: str` → `user_id: UUID` in `AgentConversationPublic` and all related schemas.

**Files changed:** `apps/api/app/modules/founder_agent/schemas.py`

---

### Root Cause 4 — MissingGreenlet on Lazy Relationship Access
**Problem:** The `GET /conversations/{id}` endpoint called `AgentConversationDetail.model_validate(conv)` on the ORM object. Pydantic tried to access the `messages` relationship attribute, which triggered SQLAlchemy's lazy loader outside an async greenlet — crash.

**Fix:** Replaced `model_validate(conv)` + manual relationship access with explicit constructor `AgentConversationDetail(id=..., messages=[...])` using the already-queried messages list.

**Files changed:** `apps/api/app/modules/founder_agent/router.py`

---

### Root Cause 5 — Deprecated `redis.setex()` Calls
**Problem:** Two places used the deprecated `redis.setex(key, ttl, value)` API (argument order differs from the modern `redis.set(key, value, ex=ttl)`). This caused deprecation warnings in CI.

**Fix:** Replaced all `setex()` calls with `redis.set(..., ex=...)`.

**Files changed:** `apps/api/app/core/rate_limit.py`, `apps/api/app/services/auth_service.py`, `apps/api/app/core/redis.py`

---

### Root Cause 6 — FastAPI Deprecated `HTTP_422_UNPROCESSABLE_ENTITY`
**Problem:** `auth/router.py` used `status.HTTP_422_UNPROCESSABLE_ENTITY` which is deprecated in FastAPI 0.115+ in favour of `HTTP_422_UNPROCESSABLE_CONTENT`.

**Fix:** Updated the constant name.

**Files changed:** `apps/api/app/modules/auth/router.py`

---

### Root Cause 7 — Test Conftest Using Deprecated `event_loop` Fixture
**Problem:** The conftest used `scope="session"` `event_loop` and `cleanup_engine` fixtures that conflicted with pytest-asyncio 0.25's new session-scoped loop handling, and referenced `AsyncSessionLocal` before the engine was initialized.

**Fix:** Rewrote conftest to:
- Remove the deprecated `event_loop` fixture entirely (pytest-asyncio handles this automatically)
- Add a `setup_database` session-scoped fixture that initializes the engine and calls `Base.metadata.create_all()`
- Import all models before create_all via `import app.models`
- Use `await get_session_factory()` instead of `AsyncSessionLocal` directly

**Files changed:** `apps/api/tests/conftest.py`

---

### Root Cause 8 — Missing `aiosqlite` Dependency for SQLite Fallback
**Problem:** The SQLite fallback requires `aiosqlite` which wasn't in `requirements.txt`, so CI would fail on `pip install`.

**Fix:** Added `aiosqlite>=0.20.0` to `requirements.txt`.

**Files changed:** `apps/api/requirements.txt`

---

## Current State — What Works Right Now

### Backend APIs
All REST endpoints are live under `/api/v1/`:

| Module | Endpoints | Auth Required |
|--------|-----------|---------------|
| Auth | `GET /auth/nonce`, `POST /auth/verify`, `POST /auth/logout`, `GET /auth/me` | Partial |
| Projects | CRUD `/projects` | Yes |
| Skill Passports | CRUD `/skill-passports` | Yes |
| Audits | CRUD `/audits` | Yes |
| Analytics | `GET /analytics/dashboard`, `POST /analytics/events` | Yes |
| Founder Agent | 10 endpoints including SSE streaming chat | Yes |
| AI Auditor | `POST /auditor/analyze` (SSE), `GET /auditor/history`, `GET /auditor/{id}`, `GET /auditor/report/{id}`, `DELETE /auditor/{id}` | Yes |

### Test Coverage
**27 passing tests** across all modules:
- Health endpoint
- Auth (nonce + invalid wallet)
- Projects (create, list, ownership)
- Passports (create, get)
- Audits (submit, list)
- Analytics (dashboard, events)
- Founder Agent (conversations CRUD, SSE chat, prompt suggestions, auth guard)
- AI Auditor (create, stream, list, get, report, delete, auth guard, rate limit)

Tests run against **SQLite in-memory** when Postgres is unavailable (local), and against **real Postgres** in CI.

### Frontend (Next.js)
All 8 dashboard pages render and build clean (0 lint errors, 0 warnings):
- `/` — Landing
- `/auth/connect` — Wallet connection
- `/dashboard` — Main dashboard
- `/founder-agent` — AI chat (wired to SSE streaming)
- `/auditor` — Contract auditor (SSE streaming, severity badges, report viewer)
- `/skill-passport` — NFT passport
- `/analytics` — Metrics
- `/settings` — User preferences
- `/startup-builder` — Startup planning workspace

### Stitch UI — Static HTML Reference (All Pages Complete)
Production-quality HTML/CSS implementation of every screen, used as the design reference for Next.js conversion:
- `ui-html/index.html` — Landing page
- `ui-html/authentication.html` — Wallet + email auth
- `ui-html/dashboard.html` — Command center
- `ui-html/founder-agent.html` — AI chat interface
- `ui-html/startup-builder.html` — Token wizard (3-panel)
- `ui-html/contract-auditor.html` — Code editor + report split view
- `ui-html/skill-passport.html` — Holographic NFT card + badge grid
- `ui-html/dao.html` — Governance proposals + treasury + voting
- `ui-html/analytics.html` — KPI charts + heatmap
- `ui-html/wallet.html` — Portfolio + transactions
- `ui-html/settings.html` — All settings sections
- `ui-html/notifications.html` — Activity center

### Smart Contracts
`packages/contracts/contracts/SkillPassportNFT.sol` — Soulbound ERC-721 with:
- One-per-wallet mint guard
- Transfer blocking (`_update` override)
- `tokenURI` and `updateMetadata`
- Hardhat compile + test suite

### CI Status
| Check | Status |
|-------|--------|
| `ruff check app tests` | ✅ Pass |
| `pytest -q` (27 tests) | ✅ Pass |
| `npm run lint` | ✅ Pass (0 errors, 0 warnings) |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass |
| `npx hardhat compile` | ✅ Pass |
| `npx hardhat test` (10 tests) | ✅ Pass |
| GitHub Actions | ✅ Green |

---

## What Was Done This Session (June 29, 2026)

### Phase 7 — AI Smart Contract Auditor ✅
- `apps/api/app/modules/auditor/router.py` — SSE streaming audit endpoint + history/report endpoints
- `apps/api/app/services/auditor/service.py` — audit CRUD + streaming pipeline
- `apps/api/app/services/auditor/prompts.py` — structured JSON audit prompt
- `apps/api/tests/test_auditor.py` — 8 tests (27/27 total passing)
- `apps/web/app/(dashboard)/auditor/page.tsx` — SSE streaming frontend, progress + report viewer
- Registered in `apps/api/app/main.py`

### Phase 6 — SkillPassportNFT Contract ✅
- `packages/contracts/contracts/SkillPassportNFT.sol` — Soulbound ERC-721 (mint, revoke, updateMetadata, transfer-blocked)
- `packages/contracts/test/SkillPassportNFT.test.ts` — 10 tests passing
- `packages/contracts/hardhat.config.ts` — Solidity 0.8.28, evmVersion cancun
- `packages/contracts/scripts/run-hardhat.js` — telemetry bypass wrapper
- `packages/contracts/package.json` — scripts updated

### Stitch UI — Static HTML/CSS (All Pages Complete) ✅
All screens extracted from Stitch design and implemented as standalone HTML files:
- `ui-html/index.html` — Landing page (hero, features, roadmap, pricing, FAQ, footer)
- `ui-html/authentication.html` — Wallet connect + email auth forms
- `ui-html/dashboard.html` — Command center (stat cards, quick actions, activity feed, charts)
- `ui-html/founder-agent.html` — Full AI chat (conversation history, message bubbles, framework panel)
- `ui-html/startup-builder.html` — 3-panel token wizard (steps, form, live preview)
- `ui-html/contract-auditor.html` — Code editor + AI vulnerability report split view
- `ui-html/skill-passport.html` — Holographic NFT card, XP progress, badge grid
- `ui-html/dao.html` — Proposals with voting, treasury, members tabs + New Proposal modal
- `ui-html/analytics.html` — KPI cards, bar chart, donut chart, activity heatmap, events table
- `ui-html/wallet.html` — Portfolio card, token balances, transaction history, Web3 identity
- `ui-html/settings.html` — Profile, AI, Security, Feature Flags, Notifications, Danger Zone
- `ui-html/notifications.html` — Activity center with filter chips, unread indicators, action buttons
- `ui-html/assets/css/` — variables.css, animations.css, style.css, responsive.css
- `ui-html/assets/js/` — navigation.js, animations.js, app.js
- `ui-html/_shared/` — sidebar.html, layout-head.html

### Frontend Lint Fixes ✅
- Removed 16 unused imports across all dashboard pages (0 errors, 0 warnings)

---

## What's Next — Phase 6 (Core Flow Implemented)

**Phase 6 — Skill Passport NFT & Blockchain Implementation**

Implemented in this pass:
- Backend mint endpoint for soulbound passport NFTs
- Server-side metadata generation for IPFS payloads
- Reputation summary with XP and badge metadata
- Frontend flow that submits mint requests and renders NFT receipt details
- Local demo fallback while blockchain credentials remain optional

Remaining polish for full production onboarding:

The full Phase 6 scope (from the roadmap) covers:

1. **Backend passport module** — `apps/api/app/modules/passport/` with mint flow, IPFS upload, reputation endpoints
2. **New DB tables** — `passport`, `passport_metadata`, `reputation`, `achievements`, `badges`, `nft_transactions`, `wallet_events`
3. **Pinata IPFS integration** — server-side only, JWT never exposed to client
4. **Contract interactions** — server-signed mint transactions via oracle wallet
5. **Reputation contract** — on-chain XP, badges, achievements
6. **Frontend connections** — wire existing Skill Passport UI to real APIs
7. **Wallet flow** — Connect → Verify → Upload Metadata → Mint NFT → Save TX → Update Dashboard

---

## File Map (Current)

```
nexus-ecosystem/
├── apps/
│   ├── api/
│   │   ├── alembic/versions/        # 6 migrations (001–006)
│   │   ├── app/
│   │   │   ├── api/                 # deps, ownership, pagination
│   │   │   ├── core/                # config, database, redis, security, rate_limit, types
│   │   │   ├── models/              # auth, project, passport, audit, analytics + founder agent
│   │   │   ├── modules/             # auth, projects, passports, audits, analytics, founder_agent, auditor
│   │   │   ├── schemas/             # Pydantic request/response models
│   │   │   ├── services/            # auth_service, project_service, LLM provider, auditor/
│   │   │   └── main.py
│   │   ├── tests/                   # conftest + 9 test files (27 tests)
│   │   ├── pyproject.toml           # pytest + ruff config
│   │   └── requirements.txt
│   └── web/
│       ├── app/
│       │   ├── (dashboard)/         # 8 dashboard pages (auditor added in Phase 7)
│       │   ├── api/                 # Auth BFF routes + SSE proxy
│       │   └── auth/connect/
│       ├── components/
│       │   ├── founder-agent/       # Chat, Markdown, Sidebar, Suggestions
│       │   └── ui/                  # ShadCN components
│       ├── hooks/                   # use-founder-agent
│       ├── lib/api/                 # founder-agent.ts, auditor.ts API clients
│       └── middleware.ts            # JWT route protection
├── packages/
│   ├── agents/                      # Placeholder (Phase 8 — LangGraph/CrewAI)
│   └── contracts/
│       ├── contracts/SkillPassportNFT.sol
│       ├── test/SkillPassportNFT.test.ts  # 10 tests
│       ├── scripts/run-hardhat.js   # Telemetry bypass wrapper
│       └── hardhat.config.ts        # Solidity 0.8.28, evmVersion cancun
├── ui-html/                         # Stitch UI — static HTML/CSS reference
│   ├── index.html                   # Landing
│   ├── authentication.html          # Auth
│   ├── dashboard.html               # Command center
│   ├── founder-agent.html           # AI chat
│   ├── startup-builder.html         # Token wizard
│   ├── contract-auditor.html        # Code editor + report
│   ├── skill-passport.html          # NFT passport
│   ├── dao.html                     # Governance
│   ├── analytics.html               # Metrics + charts
│   ├── wallet.html                  # Portfolio
│   ├── settings.html                # Settings
│   ├── notifications.html           # Activity center
│   ├── assets/css/                  # variables, style, animations, responsive
│   ├── assets/js/                   # navigation, animations, app
│   └── _shared/                     # sidebar, layout-head
├── infra/docker/
│   ├── docker-compose.yml
│   └── Dockerfile.api
└── .github/workflows/ci.yml
```

---

## Environment Variables Required

Copy `.env.example` to `.env.local` and fill in:

```bash
# Required to run at all
DATABASE_URL=postgresql+asyncpg://nexus:nexus@localhost:5432/nexus
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(32))">

# Required for frontend wallet connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<from cloud.walletconnect.com>

# Required for AI features
GEMINI_API_KEY=<from ai.google.dev>
EMERGENT_API_KEY=<optional — Emergent Universal LLM>

# Required for Phase 6 blockchain features
POLYGON_AMOY_RPC_URL=<from Alchemy or Infura>
DEPLOYER_PRIVATE_KEY=<funded test wallet>
PINATA_JWT=<from app.pinata.cloud>
```

> **Never commit `.env.local`** — it is in `.gitignore`.

---

*This document was last updated June 29, 2026 to reflect Phases 1–7 complete and full Stitch UI HTML/CSS implementation.*
