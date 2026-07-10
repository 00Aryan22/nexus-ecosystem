# Authentication Root Cause Report

## Production SIWE Failure — Confirmed Evidence

### The Failing Request

**Request:** `GET https://nexus-ecosystem-web.vercel.app/api/auth/nonce?wallet=0x30d541F55cC3b22d941028744bE2Ed735b1343b2`

**Response:** HTTP 500
```json
{"error":{"message":"Nonce proxy failed: fetch failed"}}
```

### Vercel Production Log (captured 2026-07-10)

```
[Auth Proxy] nonce error {
  wallet: '0x30d541F55cC3b22d941028744bE2Ed735b1343b2',
  error: [TypeError: fetch failed] {
    [cause]: Error: connect ECONNREFUSED 127.0.0.1:8000
  }
}
```

### Root Cause Chain

```
User clicks "Sign In with Wallet"
  ↓
Frontend calls fetch("/api/auth/nonce?wallet=0x...")
  ↓
Next.js BFF proxy route: apps/web/app/api/auth/nonce/route.ts
  ↓
fetch(API_BASE + "/auth/nonce?wallet=...")
  ↓
API_BASE = process.env.INTERNAL_API_URL
        ?? process.env.NEXT_PUBLIC_API_URL
        ?? "http://localhost:8000/api/v1"
  ↓
On Vercel: NEXT_PUBLIC_API_URL is NOT SET
  ↓
Falls back to "http://localhost:8000/api/v1"
  ↓
fetch("http://localhost:8000/api/v1/auth/nonce?wallet=0x...")
  ↓
127.0.0.1:8000 — NOTHING RUNNING on Vercel
  ↓
ECONNREFUSED
  ↓
500 response: "Nonce proxy failed: fetch failed"
  ↓
"Unable to sign in with the connected wallet. Please try again."
```

### Proof of deployed frontend API URL

Landing page footer shows:
```
API: http://localhost:8000/api/v1 · Chain 80002
```

### Resolution Path

1. Deploy FastAPI backend to a publicly reachable host (Railway, Render, Fly.io)
2. Set `NEXT_PUBLIC_API_URL` on Vercel to `https://<backend-url>/api/v1`
3. Rebuild and redeploy frontend
4. Verify nonce, verify, me endpoints work

### Files Involved

| File | Role |
|------|------|
| `apps/web/lib/constants.ts` | Defines `API_BASE` with fallback to localhost |
| `apps/web/app/api/auth/nonce/route.ts` | BFF proxy for nonce |
| `apps/web/app/api/auth/verify/route.ts` | BFF proxy for verify |
| `apps/web/app/api/auth/me/route.ts` | BFF proxy for me |
| `apps/api/app/modules/auth/router.py` | Backend auth endpoints |
| `apps/api/app/core/config.py` | Backend config (SIWE domain, CORS) |
