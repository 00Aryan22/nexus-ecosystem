# NEXUS AI Ecosystem

**AI-powered Web3 operating system for founders** — blockchain reputation, NFT skill passports, AI startup building, smart contract auditing, and DAO governance.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](package.json)
[![Python](https://img.shields.io/badge/python-%3E%3D3.11-brightgreen)](apps/api/pyproject.toml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](apps/web)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](apps/api)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636)](packages/contracts)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy-8247E5)](packages/contracts)

**Repository:** [github.com/00Aryan22/nexus-ecosystem](https://github.com/00Aryan22/nexus-ecosystem)

---

## Project Overview

NEXUS AI is a full-stack dApp that combines AI agents with blockchain infrastructure to help founders:
- **Mint Skill Passport NFTs** — soulbound reputation tokens proving expertise
- **Chat with an AI Founder Agent** — get startup advice with memory and context
- **Audit Smart Contracts** — AI-powered security analysis with gas optimization
- **Build & Register Startups** — on-chain startup profiles
- **Manage Knowledge** — RAG-powered vector search across documents
- **Deploy & Verify Contracts** — developer infrastructure tools

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                  │
│  Dashboard │ Founder Chat │ Auditor │ Passport │ Settings │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / SSE / WebSocket
┌──────────────────────┴──────────────────────────────────┐
│                   API Gateway (FastAPI)                   │
│  Auth │ Projects │ Passports │ Auditor │ AI │ Analytics   │
└────┬─────────┬──────────┬──────────┬───────────────────┘
     │         │          │          │
┌────┴──┐ ┌───┴───┐ ┌───┴────┐ ┌───┴────────────┐
│Postgres│ │ Redis │ │ChromaDB│ │  LLM Providers  │
│Supabase│ │ Cache │ │Vector  │ │Gemini│Ollama│AI │
└────────┘ └───────┘ │ Store  │ └────────────────┘
                     └────────┘
┌─────────────────────────────────────────────────────────┐
│              Smart Contracts (Polygon Amoy)               │
│   SkillPassportNFT (ERC-721 Soulbound)                    │
│   StartupRegistry (On-Chain Startup Profiles)             │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, TanStack Query |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy (async), Alembic, Redis, ChromaDB |
| **AI** | OpenAI, Google Gemini, Ollama (local), RAG with vector embeddings, LLM Router |
| **Blockchain** | Solidity 0.8.28, Hardhat, OpenZeppelin, Polygon Amoy, WalletConnect, RainbowKit, wagmi |
| **Storage** | PostgreSQL (Supabase), IPFS (Pinata), ChromaDB (vectors) |
| **Auth** | SIWE (Sign-In with Ethereum), JWT, session management |
| **DevOps** | Docker Compose, Turborepo, GitHub Actions, Vercel |

---

## Prerequisites

- **Node.js** >= 22
- **Python** >= 3.11
- **Docker Desktop** (for local PostgreSQL, Redis, ChromaDB)
- **MetaMask** browser extension

---

## Installation

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/00Aryan22/nexus-ecosystem.git
cd nexus-ecosystem
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
```

Edit both `.env.local` files with your secrets. See [Environment Variables](#environment-variables) below.

### 3. Start Infrastructure

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts PostgreSQL (port 5432), Redis (port 6379), and ChromaDB (port 8000).

### 4. Backend

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate  |  macOS/Linux: source .venv/bin/activate
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

### 6. Smart Contracts (optional)

```bash
cd packages/contracts
npm run compile
npm test
```

---

## Environment Variables

### Root `.env.local` (server-side)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase or local) |
| `JWT_SECRET_KEY` | Yes | Secret for signing JWT tokens |
| `JWT_ALGORITHM` | No | JWT algorithm (default: HS256) |
| `JWT_EXPIRATION_MINUTES` | No | Token expiry (default: 60) |
| `REDIS_URL` | No | Redis connection string (default: localhost:6379) |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `ALCHEMY_API_KEY` | No | Alchemy API key |
| `ALCHEMY_POLYGON_AMOY_RPC_URL` | No | Polygon Amoy RPC endpoint |
| `PINATA_API_KEY` | No | Pinata API key |
| `PINATA_API_SECRET` | No | Pinata API secret |
| `PINATA_JWT` | No | Pinata JWT for IPFS pinning |
| `STITCH_URL` | No | Stitch API endpoint |

### Frontend `apps/web/.env.local` (browser-safe)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect Cloud project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_ALCHEMY_POLYGON_AMOY_RPC_URL` | No | Public read-only RPC endpoint |
| `NEXT_PUBLIC_PINATA_GATEWAY` | No | IPFS gateway URL |

> **Never commit `.env.local` files.** They contain sensitive credentials.

---

## Docker

The infrastructure stack runs via Docker Compose:

```yaml
# infra/docker/docker-compose.yml
services:
  postgres:   # PostgreSQL 16 (port 5432)
  redis:      # Redis 7 (port 6379)
  chromadb:   # ChromaDB (port 8000)
```

Start: `docker compose -f infra/docker/docker-compose.yml up -d`  
Stop:  `docker compose -f infra/docker/docker-compose.yml down`

A production Dockerfile for the API is available at `infra/docker/Dockerfile.api` (Python 3.12-slim, uvicorn).

---

## Supabase

This project uses Supabase for managed PostgreSQL and authentication.

### Local Development
1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
3. Apply migrations: `supabase db push`

### Database Migrations
Alembic manages schema migrations (9 migrations from `001` through `009`):

```bash
cd apps/api
alembic upgrade head
```

---

## Vercel

The frontend deploys to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link --project YOUR_PROJECT_NAME

# Deploy to production
vercel --prod
```

Environment variables must be configured in the Vercel dashboard under Settings > Environment Variables.

---

## Ollama (Local AI)

For fully local AI inference:

```bash
# Install Ollama: https://ollama.com
ollama pull llama3.2:3b
ollama pull nomic-embed-text

# Set in .env.local
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Smart Contracts

### Contracts

| Contract | Network | Description |
|----------|---------|-------------|
| `SkillPassportNFT.sol` | Polygon Amoy | ERC-721 soulbound NFT with roles (ADMIN, ISSUER), mint/revoke/update |
| `StartupRegistry.sol` | Polygon Amoy | On-chain startup registration with founder profiles |

### Compile & Test

```bash
cd packages/contracts
npm run compile      # Compile Solidity
npm test            # Run Hardhat tests (17/17 passing)
```

### Deploy

```bash
cd packages/contracts
npx hardhat run scripts/deploy.ts --network amoy
```

---

## Deployment

### Prerequisites

- Supabase project (managed PostgreSQL)
- Vercel account (for frontend hosting)
- Alchemy or Infura RPC URL for Polygon Amoy
- WalletConnect Cloud project ID

### Steps

1. **Database**: Run Alembic migrations against Supabase
2. **Backend**: Deploy FastAPI to your preferred host (Railway, Render, or VPS)
3. **Frontend**: Deploy Next.js to Vercel
4. **Contracts**: Deploy Solidity contracts to Polygon Amoy

---

## Demo Instructions

### 1. Connect Wallet
- Open the app at http://localhost:3000
- Click "Connect Wallet" → MetaMask → Sign the SIWE message

### 2. Mint Skill Passport
- Navigate to **Skill Passport**
- Create a passport with your expertise details
- Click "Mint" → confirm MetaMask transaction

### 3. Chat with Founder Agent
- Navigate to **Founder Agent**
- Ask startup-related questions
- The agent uses AI + your knowledge base + memory

### 4. Audit a Contract
- Navigate to **Auditor**
- Paste Solidity code or enter a contract address
- View AI-generated security analysis and gas optimization

### 5. Register a Startup
- Navigate to **Startup Builder**
- Fill in your startup details
- Deploy the on-chain registration transaction

---

## Folder Structure

```
nexus-ecosystem/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── core/           # Config, database, security
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   ├── schemas/        # Pydantic schemas
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── ai/         # Context builder, AI service
│   │   │   │   ├── auditor/    # Contract audit + gas optimization
│   │   │   │   ├── founder_agent/ # Agent prompts & service
│   │   │   │   └── llm/        # LLM provider registry + router
│   │   │   └── modules/        # Route handlers (11 modules)
│   │   ├── alembic/            # Database migrations (9)
│   │   └── tests/              # Pytest suite (132 tests)
│   └── web/                    # Next.js 15 frontend
│       ├── app/                # App Router (32 pages)
│       ├── components/         # React components
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # API client, utilities
│       └── store/              # Zustand state management
├── packages/
│   └── contracts/              # Solidity + Hardhat
│       ├── contracts/          # Smart contracts (2)
│       ├── scripts/            # Deploy scripts
│       └── test/               # Hardhat tests (17)
├── infra/
│   └── docker/                 # Docker Compose + Dockerfiles
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── tools/                      # Developer tools
├── supabase/                   # Supabase config
└── .github/                    # GitHub Actions CI
```

---

## Validation

| Check | Status |
|-------|--------|
| Ruff lint (Python) | ✅ Pass |
| Pytest (backend) | ✅ 121/132 pass |
| Next.js build | ✅ 32 pages, 0 errors |
| Solidity tests | ✅ 17/17 pass |
| TypeScript typecheck | ✅ Pass |

---

## License

Proprietary — NEXUS AI Team
