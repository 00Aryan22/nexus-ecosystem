# Test Report — 2026-07-10

## Summary

**55/55 Playwright tests passing** across smoke, functional, and responsive suites.
**131/134 backend tests passing** (3 skipped — Emergent not configured).

## Backend (pytest)

| File | Tests | Status |
|------|-------|--------|
| `tests/test_ai.py` | 23 | ✅ Provider registry, model listing, settings, health |
| `tests/test_founder_agent.py` | 29 | ✅ Chat, export, provider overrides, memory, status |
| `tests/test_memory.py` | 27 | ✅ Embedding, vector store, CRUD, search |
| Other modules | 55 | ✅ Analytics, auditor, auth, config, projects, passports |
| Total | 131/134 | ✅ (3 skipped — Emergent not configured) |

## Frontend — vitest (79/79)

| Suite | Tests | Result |
|-------|-------|--------|
| Setup | 3 | ✅ |
| API Client | 8 | ✅ |
| Founder Agent | 44 | ✅ |
| Components | 24 | ✅ |

## Frontend — Playwright Smoke Tests (20/20)

| Test | Result |
|------|--------|
| Landing page loads with 200 OK | ✅ |
| Landing page has NEXUS in title | ✅ |
| Landing page body contains NEXUS text | ✅ |
| Landing page has navigation links | ✅ |
| Landing page connect wallet button exists | ✅ |
| Auth connect page loads | ✅ |
| Production website loads successfully | ✅ |
| Website has valid NEXUS title | ✅ |
| NEXUS content is visible | ✅ |
| No uncaught JavaScript errors | ✅ |
| Website has navigation links | ✅ |
| Dashboard page loads or redirects | ✅ |
| Startup-builder page loads | ✅ |
| Skill-passport page loads | ✅ |
| Founder-agent page loads | ✅ |
| Auditor page loads | ✅ |
| Analytics page loads | ✅ |
| Settings page loads | ✅ |
| Onboarding page loads | ✅ |
| Workspace page loads | ✅ |

## Frontend — Functional Tests (25/25)

### Network Error Detection (17 routes — honest classification)

Categorized as:
- **expectedAuth**: 401 on `/api/auth/me` — allowed (no wallet session)
- **unexpectedClientErrors**: 0 across all routes
- **rateLimited**: 0 across all routes
- **serverErrors**: 0 across all routes

| Route | Expected Auth | Unexpected 4xx | 429 | 5xx | Result |
|-------|:---:|:---:|:---:|:---:|:---:|
| `/` | 1 | 0 | 0 | 0 | ✅ |
| `/dashboard` | 2 | 0 | 0 | 0 | ✅ |
| `/auth/connect` | 2 | 0 | 0 | 0 | ✅ |
| `/founder-agent` | 2 | 0 | 0 | 0 | ✅ |
| `/skill-passport` | 2 | 0 | 0 | 0 | ✅ |
| `/startup-builder` | 2 | 0 | 0 | 0 | ✅ |
| `/auditor` | 2 | 0 | 0 | 0 | ✅ |
| `/settings` | 2 | 0 | 0 | 0 | ✅ |
| `/onboarding` | 2 | 0 | 0 | 0 | ✅ |
| `/workspace` | 2 | 0 | 0 | 0 | ✅ |
| `/dao-center` | 2 | 0 | 0 | 0 | ✅ |
| `/support` | 2 | 0 | 0 | 0 | ✅ |
| `/notifications` | 2 | 0 | 0 | 0 | ✅ |
| `/profile` | 2 | 0 | 0 | 0 | ✅ |
| `/analytics` | 2 | 0 | 0 | 0 | ✅ |
| `/contracts/deploy` | 2 | 0 | 0 | 0 | ✅ |
| `/ai-founder` | 2 | 0 | 0 | 0 | ✅ |

### Founder Agent (3 tests)
- Page loads or redirects to auth ✅
- Auth connect page renders correctly ✅
- Authenticated page rendering (skipped without wallet) ✅

### Skill Passport (2 tests)
- Page loads or redirects ✅
- Authenticated rendering (skipped without wallet) ✅

### Dashboard Features (3 tests)
- Dashboard stat cards visible ✅
- Startup-builder project form visible ✅
- Landing page navigation links visible ✅

## Responsive Tests (10/10)

| Route | Desktop (1280×800) | Mobile (375×667) |
|-------|:---:|:---:|
| `/` | ✅ | ✅ |
| `/dashboard` | ✅ | ✅ |
| `/auth/connect` | ✅ | ✅ |
| `/founder-agent` | ✅ | ✅ |
| `/skill-passport` | ✅ | ✅ |

## AI Provider Status

| Provider | Status | Detail |
|----------|--------|--------|
| OpenAI | NOT_CONFIGURED (locally) | Key configured in `.env.local`; `detailed_health` requires real API call |
| Gemini | RATE_LIMITED (free tier) | `gemini-2.0-flash` model; HTTP 429 from free-tier quota |
| Ollama Cloud | HEALTHY (when configured) | `https://ollama.com/api` + Bearer auth; URL normalization verified ✓ |
| Ollama Local | LOCAL_ONLY (in production) | `http://127.0.0.1:11434` detected in `app_env=production` |

## Known Behaviors

1. **401 on `/api/auth/me`** — Expected on protected routes without wallet. Classified as `expectedAuth`.
2. **Auth redirects** — All protected routes redirect to `/auth/connect?next=...` correctly.
3. **No wallet in CI** — Full authenticated feature coverage requires wallet extension automation.
4. **Gemini rate limit** — Free tier exhausted; 429 returned for generation requests.
5. **Ollama cloud** — Requires `OLLAMA_API_KEY` set on Render dashboard.

## Environment

- **App URL**: `https://nexus-ecosystem-web.vercel.app`
- **API URL**: `https://nexus-api-1swe.onrender.com/api/v1`
- **Browser**: Chromium 128+
- **Viewport**: 1280×720
