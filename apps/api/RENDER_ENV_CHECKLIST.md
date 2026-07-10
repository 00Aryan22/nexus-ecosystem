# Render Environment Variable Checklist

## How to set

After connecting the GitHub repo to Render:
1. Go to Render Dashboard → nexus-api → Environment
2. Set each variable below
3. Deploy

---

## Required — App will not start without these

| Variable | Value / Source | Secret | Notes |
|----------|---------------|--------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:<password>@db.oinwkcxefniumshicvuj.supabase.co:5432/postgres` | YES | Supabase PostgreSQL. Password in `.env.local` or Supabase dashboard. |
| `JWT_SECRET_KEY` | Generate fresh: `python -c "import secrets; print(secrets.token_urlsafe(48))"` | YES | Min 32 chars, validated on startup. |
| `CORS_ORIGINS` | `https://nexus-ecosystem-web.vercel.app` | No | Comma-separated. Include preview URLs if needed. |
| `SIWE_DOMAIN` | `nexus-ecosystem-web.vercel.app` | No | Must match the frontend domain exactly. |
| `SIWE_URI` | `https://nexus-ecosystem-web.vercel.app` | No | Must match the frontend origin exactly. |
| `COOKIE_SECURE` | `true` | No | Required for HTTPS on Render. |

## Required for production features

| Variable | Value / Source | Secret | Notes |
|----------|---------------|--------|-------|
| `APP_ENV` | `production` | No | Controls log level and behavior. |
| `GEMINI_API_KEY` | From Google AI Studio | YES | Required for AI Founder Agent. |
| `OPENAI_API_KEY` | From OpenAI dashboard | YES | Fallback AI provider. |
| `POLYGON_AMOY_RPC_URL` | From Alchemy dashboard | YES | For blockchain operations. |
| `PINATA_JWT` | From Pinata dashboard | YES | For IPFS / NFT metadata. |

## Optional — Safe defaults exist

| Variable | Default | Notes |
|----------|---------|-------|
| `REDIS_URL` | — | InMemoryRedis fallback used if absent (no rate-limit persistence). |
| `EMERGENT_API_KEY` | — | Optional AI provider. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Not needed in production. |
| `DEPLOYER_PRIVATE_KEY` | — | Only needed for on-chain contract deployment. |
| `ALCHEMY_API_KEY` | — | Alternative RPC provider. |
| `STITCH_API_KEY` | — | Google Stitch MCP integration. |
| `PASSPORT_CONTRACT_ADDRESS` | `0x9812A27c5950ECf7c4A4EF3dFdB02CDa6BbeF21A` | On-chain skill passport. |

## Cookie settings

| Variable | Production Value | Purpose |
|----------|-----------------|---------|
| `COOKIE_SECURE` | `true` | Cookies only sent over HTTPS |
| `COOKIE_SAMESITE` | `lax` | CSRF protection |
| `COOKIE_ACCESS_NAME` | `nexus_access_token` | JWT access token |
| `COOKIE_REFRESH_NAME` | `nexus_refresh_token` | JWT refresh token |
| `COOKIE_CSRF_NAME` | `nexus_csrf_token` | CSRF token |
| `JWT_ALGORITHM` | `HS256` | JWT signing |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Short-lived access |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Session duration |
| `SIWE_NONCE_TTL_SECONDS` | `300` | Nonce expiry |
| `SIWE_CHAIN_ID` | `80002` | Polygon Amoy |
