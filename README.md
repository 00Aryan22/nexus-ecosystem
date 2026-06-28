# NEXUS AI (nexus-ecosystem)

AI-powered Web3 operating system for founders — blockchain reputation, NFT skill passports, AI startup building, contract auditing, and DAO governance.

**Repository:** [github.com/00Aryan22/nexus-ecosystem](https://github.com/00Aryan22/nexus-ecosystem)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | FastAPI, PostgreSQL, SQLAlchemy, Redis |
| AI | Gemini, Ollama, CrewAI, LangGraph, ChromaDB |
| Blockchain | Solidity, Hardhat, Polygon Amoy, IPFS, WalletConnect |
| DevOps | Docker Compose, GitHub Actions, Vercel |

## Monorepo Structure

```
apps/web/          Next.js frontend
apps/api/          FastAPI backend
packages/contracts Hardhat + Solidity
packages/agents/   AI crews (Phase 5)
infra/docker/      Docker Compose & Dockerfiles
docs/              Blueprint, Stitch tokens, diagrams
```

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/00Aryan22/nexus-ecosystem.git
cd nexus-ecosystem
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
# Fill in secrets in .env.local (never commit this file)

cp apps/web/.env.example apps/web/.env.local
# Set NEXT_PUBLIC_* values
```

### 3. Start infrastructure

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

### 4. Backend

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 5. Frontend

```bash
cd apps/web
npm run dev
```

App: http://localhost:3000

### 6. Contracts (optional)

```bash
cd packages/contracts
npm run compile
npm test
```

## Ethereum Build Camp Demo

This repository is now positioned as an event-ready demo for the Ethereum Build Camp experience:

- AI founder workflows for startup ideation and planning
- Skill passport verification and NFT minting flow
- Instant Solidity audit summaries for rapid product demos
- Supabase-backed persistence and wallet-connected frontend flow

Optional third-party integrations such as Gemini, Pinata, and blockchain RPC providers can be enabled through the environment file when you want richer live demo behavior.

### Optional Integrations (environment variables)

To enable Alchemy and Pinata integrations for richer demo behavior, add the following to your root `.env.local` (server-side only):

- `ALCHEMY_API_KEY` — Alchemy dashboard API key (server use)
- `ALCHEMY_POLYGON_AMOY_RPC_URL` — Alchemy Polygon Amoy RPC endpoint (or use `POLYGON_AMOY_RPC_URL`)
- `PINATA_API_KEY`, `PINATA_API_SECRET` — Pinata keypair (server use)
- `PINATA_JWT` — Pinata JWT (server-only; used for pinning metadata)

For frontend-only read access (safe public values), copy these into `apps/web/.env.local` if desired:

- `NEXT_PUBLIC_ALCHEMY_POLYGON_AMOY_RPC_URL` — public read-only RPC endpoint
- `NEXT_PUBLIC_PINATA_GATEWAY` — Pinata gateway URL (default: `https://gateway.pinata.cloud/ipfs`)

Keep all private keys and JWTs in server `.env.local` and never commit them.

## Development Phases

| Phase | Status |
|-------|--------|
| 1 — Project Foundation | In progress |
| 2 — Authentication + Wallet | Pending |
| 3 — Database | Pending |
| 4 — Frontend UI (Stitch) | Pending |
| 5 — AI Founder Agent | Pending |
| 6 — Skill Passport NFT | Implemented (core mint flow, metadata, reputation, frontend integration) |
| 7 — Smart Contract Auditor | Pending |
| 8 — Analytics Dashboard | Pending |
| 9 — Testing | In progress |
| 10 — Deployment | Pending |

## Security

- All secrets live in `.env.local` only (gitignored).
- Never commit API keys, private keys, or JWT secrets.
- See `.env.example` for the full variable list.

## License

Proprietary — NEXUS AI Team
