# Phase 2 — Repository Setup

This phase focuses on repository-level readiness for the MVP:

- verify local infrastructure prerequisites
- keep secrets in local environment files only
- ensure the monorepo continues to build and test
- document the expected local service topology

## Services expected locally

- PostgreSQL on port 5432
- Redis on port 6379
- ChromaDB on port 8001

## Verification commands

Run these from the repository root:

```bash
docker compose -f infra/docker/docker-compose.yml config --quiet
docker compose -f infra/docker/docker-compose.yml ps
python apps/api/scripts/verify_phase2.py
```

## Security notes

- Keep secrets in .env.local and .env files only.
- Never commit API keys, JWT secrets, private keys, or wallet credentials.
- The repository already ignores .env.local and related files.
