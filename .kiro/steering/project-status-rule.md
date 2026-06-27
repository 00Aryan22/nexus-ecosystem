---
inclusion: always
---

# Rule: Always Update PROJECT_STATUS.md

**This rule applies to every single task in this project.**

## The Rule

After making ANY changes to the NEXUS AI project — no matter how small — you MUST update `PROJECT_STATUS.md` at the repo root before finishing.

## What to Update

When files are created or modified, update these sections in `PROJECT_STATUS.md`:

1. **What was done this session** — list every new file created, every file modified, every bug fixed, every feature added. Be specific.
2. **Current CI Status table** — reflect the actual current state of each check (ruff, pytest, lint, typecheck, build, hardhat compile, hardhat test, GitHub Actions).
3. **What This Project Can Do** — keep this section accurate. If a new API, page, contract, or feature was added, add it here.
4. **File Map** — if new directories or key files were added, update the tree.
5. **Environment Variables** — if new env vars are required, add them to the table.

## What NOT to Do

- Do NOT rewrite sections that did not change.
- Do NOT change the tone or structure of the document.
- Do NOT skip this step even for small fixes.
- Do NOT commit without updating this file first.

## File Location

```
d:\Projects\Nexus-AI Ecosystem\PROJECT_STATUS.md
```

## Why This Matters

`PROJECT_STATUS.md` is the single source of truth for what has been built, what works, and what comes next. It must always reflect the real state of the codebase so any developer (or agent) can pick up exactly where work left off.
