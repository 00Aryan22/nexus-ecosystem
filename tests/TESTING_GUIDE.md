# Testing Guide

## Prerequisites

- Node.js 18+
- Backend running locally or deployed (adjust `BASE_URL` in `playwright.config.ts`)
- No wallet/browser extension needed for smoke and network-error tests

## Setup

```bash
npm install
npx playwright install chromium
```

## Test Structure

```
tests/
├── pages/              # Page Object Models
│   ├── LandingPage.ts
│   ├── DashboardPage.ts
│   ├── FounderAgentPage.ts
│   └── SkillPassportPage.ts
├── fixtures/           # Playwright test fixtures
│   └── base-fixture.ts
├── helpers/            # Test utilities
│   └── network-monitor.ts
├── smoke/              # Quick health-check tests
│   ├── landing.spec.ts
│   └── dashboard.spec.ts
├── functional/         # Detailed feature tests
│   ├── network-errors.spec.ts
│   ├── dashboard-features.spec.ts
│   ├── founder-agent.spec.ts
│   └── skill-passport.spec.ts
├── responsive.spec.ts  # Mobile/tablet/desktop viewports
├── demo/               # Demo video recording
│   └── demo-runner.spec.ts
└── TESTING_GUIDE.md
```

## Running Tests

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Smoke tests only (chromium, headless) |
| `npm run test:headed` | Smoke tests in headed/browser mode |
| `npm run test:mobile` | Functional tests on mobile viewport |
| `npm run test:cross-browser` | Smoke tests on chromium + firefox + webkit |
| `npm run test:demo` | Demo video recording (1920x1080, video:on) |
| `npm run test:report` | Smoke tests with HTML report |
| `npm run test:full` | All tests (smoke + functional + responsive) |

## Test Coverage

### Smoke Tests (15 tests)
- Landing page: hero title, CTA buttons, feature cards, footer
- Dashboard: redirect handling, auth page, sidebar navigation

### Functional Tests (25 tests)
- Network error detection across 13 routes: `/`, `/dashboard`, `/auth/connect`, `/founder-agent`, `/skill-passport`, `/startup-builder`, `/auditor`, `/settings`, `/onboarding`, `/workspace`, `/dao-center`, `/support`, `/notifications`, `/profile`, `/analytics`, `/contracts/deploy`, `/ai-founder`
- Founder agent: page load, auth redirect, auth connect page, authenticated rendering
- Skill passport: page load, auth redirect, authenticated rendering
- Dashboard features: stat cards, project form, landing page navigation

## Authentication Note

Protected routes (`/dashboard`, `/founder-agent`, `/skill-passport`, etc.) redirect to `/auth/connect?next=...` when no wallet is connected. This is expected behavior:

- Network error tests verify only that no 500+ errors occur (401 is acceptable)
- Feature tests gracefully skip when redirected, marking the test as informative
- Full feature coverage requires wallet extension automation (out of scope for CI)

## Test Results (2026-07-10)

| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| Smoke | 15 | 15 | 0 |
| Functional | 25 | 25 | 0 |
| **Total** | **40** | **40** | **0** |
