# Supabase setup for Nexus AI

This document captures recommended steps to configure Supabase for local development and CI. It does not store secrets — follow the guidance to place secrets into `.env.local` files or CI secrets.

## Prerequisites

- Install the Supabase CLI: https://supabase.com/docs/guides/cli
- Node.js (for `npx supabase` if not installed globally)

## Quick CLI setup (recommended)

Run these commands locally (they require interactive login):

```bash
# 1. Login to Supabase (interactive)
supabase login

# 2. Initialize supabase config in the repo (creates .supabase/)
supabase init

# 3. Link the local repo to your Supabase project
supabase link --project-ref oinwkcxefniumshicvuj
```

If you prefer `npx`:

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref oinwkcxefniumshicvuj
```

## Environment variables

Set the following in `apps/web/.env.local` (frontend-safe):

```
NEXT_PUBLIC_SUPABASE_URL=https://oinwkcxefniumshicvuj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_j9wXIHgf6v2fhcqmnRONqA_nlj72iOG
```

Set the following on the server-side (`.env.local` at repo root or in your deployment secrets):

```
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
# Optional: if you want the backend to use the hosted Postgres directly (example placeholder)
DATABASE_URL=postgresql://postgres:<YOUR-PASSWORD>@db.oinwkcxefniumshicvuj.supabase.co:5432/postgres
```

> Never commit files containing `SUPABASE_SERVICE_ROLE_KEY` or direct DB passwords.

## Using the Supabase CLI for local development

- `supabase start` runs a local Supabase stack (Docker), if you prefer a local Postgres/Realtime instance.
- `supabase db remote set` can configure remote DB connections.

## Non-interactive CI setup

In CI (GitHub Actions), add the following secrets to the repository settings:

- `NEXT_PUBLIC_SUPABASE_URL` (if needed)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `DATABASE_URL` (if you want CI tests to use the hosted Postgres)

## Troubleshooting

- If `supabase link` fails, ensure you are logged in and have access to the project `oinwkcxefniumshicvuj`.
- For direct DB access use the `DATABASE_URL` pattern shown above and replace `<YOUR-PASSWORD>` with the service password from the Supabase project dashboard.

