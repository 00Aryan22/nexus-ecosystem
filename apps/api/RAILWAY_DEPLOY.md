# Railway Deployment Guide — NEXUS AI Backend

## Prerequisites
1. [Railway account](https://railway.com)
2. GitHub repository access
3. Environment variables from `.env.local`

## Steps

### 1. Deploy via Railway Dashboard
1. Go to [railway.com/new](https://railway.com/new)
2. Select **Deploy from GitHub repo**
3. Choose `00Aryan22/nexus-ecosystem`
4. Set **Root Directory** to `apps/api`
5. Railway auto-detects `apps/api/Dockerfile`

### 2. Add PostgreSQL Plugin
1. Click **+ New** → **Database** → **PostgreSQL**
2. Wait for provisioning (2-3 minutes)
3. Railway automatically sets `DATABASE_URL` env var

### 3. Run Migrations
After deploy, open a Railway shell:
```bash
alembic upgrade head
```

### 4. Set Environment Variables
In the Railway dashboard under **Variables**, set:

| Variable | Value |
|----------|-------|
| `APP_ENV` | `production` |
| `JWT_SECRET_KEY` | (from `.env.local`) |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `CORS_ORIGINS` | `http://localhost:3000,https://nexus-ecosystem-web.vercel.app` |
| `SIWE_DOMAIN` | `nexus-ecosystem-web.vercel.app` |
| `SIWE_URI` | `https://nexus-ecosystem-web.vercel.app` |
| `SIWE_CHAIN_ID` | `80002` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` |
| `REDIS_URL` | (Redis URL if using Redis plugin) |

### 5. After Deployment
Verify the API is healthy:
```bash
curl https://[your-railway-url]/health
```
Expected: `{"status":"ok","env":"production"}`

### 6. Update Vercel
Set `NEXT_PUBLIC_API_URL` on Vercel to your Railway URL + `/api/v1`:
```bash
vercel env add NEXT_PUBLIC_API_URL production --value "https://[your-railway-url]/api/v1"
```

### 7. Redeploy Frontend
```bash
vercel deploy --prod --cwd .
```
