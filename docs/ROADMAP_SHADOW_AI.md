# Shadow AI — Roadmap & Phase Plan

**Goal:** Build Shadow AI into a production-grade AI Operating System as fast as possible while maintaining quality.

**Guideline:** Spend ~10–15% of effort on planning (design, docs, UX) before coding; follow vertical-slice development and freeze features until V1.

---

## Phase 0 — Lock the Foundation (2–4 days)

Finish everything before coding.

- Finalize PRD, TRD, App Flow, UI/UX, Backend Schema, Implementation Plan
- Generate remaining architecture documents with Claude
- Finalize technology stack
- Decide the MVP (V1.0) scope
- Freeze feature additions until V1 is complete
- Create complete repository structure
- Create ER diagrams and architecture diagrams
- Create the Figma/Stitch UI

Deliverable: A complete blueprint.

---

## Phase 1 — UI/UX First (3–5 days)

Before writing backend code:

- Generate every screen in Stitch AI
- Polish in Figma if needed
- Export design assets
- Define colors, typography, components, icons, animations, skeleton loaders, responsive layouts

Create all screens:
- Login, Setup Wizard, User Dashboard, Admin Dashboard, Super Admin Dashboard
- Chat, Memory, Documents, Research, Knowledge Base
- Voice, Settings, Analytics, MCP Hub, Marketplace

Deliverable: Complete UI design system.

---

## Phase 2 — Repository Setup (1 day)

Create the monorepo and configure Git, Docker, GitHub Actions, pre-commit hooks, linters, formatting, CI.

Example structure:
```
shadow-ai/
├── apps/
│   ├── flutter/
│   ├── backend/
│   ├── admin/
│   └── docs/
├── packages/
├── docker/
├── infra/
├── scripts/
└── tools/
```

---

## Phase 3 — Infrastructure (2–3 days)

Run and verify:
- PostgreSQL, Redis, Qdrant, MinIO, Ollama, Open WebUI
- Verify Docker, GPU, CUDA, embeddings, local models

---

## Phase 4 — Authentication (3–4 days)

Implement only authentication:
- Login, Register, OAuth, JWT, Refresh Tokens, RBAC, Persistent Sessions
- Test thoroughly before moving on.

---

## Phase 5 — AI Core (5–7 days)

Build:
- Model Router, Provider Manager, Circuit Breakers, Quota Manager, Feature Flags, Streaming Chat

Only after this works should you continue.

---

## Phase 6 — Documents + Memory (4–6 days)

Implement:
- Upload, RAG, Embeddings, Qdrant, Memory Engine, Semantic Search

---

## Phase 7 — Agents (7–10 days)

Build one agent at a time:
1. Research Agent
2. Coding Agent
3. Learning Agent
4. File Agent
5. Writing Agent
6. Productivity Agent

Then add the Orchestrator.

---

## Phase 8 — Voice (3–4 days)

Integrate:
- Whisper, Piper, Wake Word, Voice UI

---

## Phase 9 — Ambient AI (3–5 days)

Desktop:
- Tray, Floating Orb, Overlay, Global Shortcuts
Android:
- Bubble, Quick Actions, Notification Assistant

---

## Phase 10 — MCP & Plugins (4–5 days)

Build:
- MCP Registry, Plugin System, Marketplace, Permissions, Tool Management

---

## Phase 11 — Admin (3–5 days)

Implement:
- Monitoring, Logs, GPU/VRAM, Provider Status, Users, Feature Flags, Analytics, Security

---

## Phase 12 — Production (4–6 days)

Add:
- CI/CD, Monitoring, Error Tracking, Backups, Docker, Cloud Deployment

---

## Daily AI Workflow — Tools by Purpose

- Claude Code: Build features, architecture, refactoring
- Stitch AI: Generate UI
- ChatGPT: Review architecture, find bugs, optimize, explain errors
- Blackbox AI: Search examples, find implementations
- Gemini: Generate large code sections, documentation

---

## Suggested 8-Week Schedule (High-Level)

Week 1: Documentation + UI + Architecture
Week 2: Repository + Infrastructure + Auth
Week 3: AI Chat + Model Router + Memory
Week 4: Documents + RAG + Search
Week 5: Agents
Week 6: Voice + Ambient AI
Week 7: Admin + MCP + Plugins
Week 8: Testing + Optimization + Deployment

---

## Golden Rules

1. Freeze the MVP.  
2. Implement vertical slices (UI → API → DB → Tests).  
3. Commit frequently with meaningful messages.  
4. Test continuously.  
5. Keep docs updated.  
6. Avoid premature optimization.

---

## Priority Order (Recommended)

1. Finalize architecture and documentation.  
2. Complete the UI/UX in Stitch/Figma.  
3. Set up repository, Docker, DBs, CI.  
4. Build authentication and persistent sessions.  
5. Build streaming AI chat and model router.  
6. Add documents, RAG, memory.  
7. Add agents and orchestration.  
8. Add voice and ambient assistant.  
9. Build admin and monitoring.  
10. Test, optimize, deploy, document.

---

**Deliverable:** Use this roadmap as the canonical project plan and track progress in the repo TODO list.

*Generated & saved: July 6, 2026*
