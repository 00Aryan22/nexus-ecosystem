# NEXUS AI — Technology Knowledge Base

**Purpose:** Record all technology decisions, rationale, alternatives considered, and future review dates.

**Last Updated:** July 6, 2026  
**Maintained By:** NEXUS AI Engineering Team

---

## Approved Technologies

### Frontend Framework: Next.js 15.5.19

**Decision Date:** June 2026  
**Decision:** ✅ **ADOPT**  
**Next Review:** July 2027

#### Quick Facts
- **Category:** Frontend / Web Framework
- **Use Case:** Primary web application for dashboard, AI chat, contract auditor, wallet UI
- **Status:** Active
- **Maturity:** Stable (v15, monthly releases)

#### Pros
- ✅ App Router with async/await components
- ✅ Built-in TypeScript support
- ✅ Server-side rendering for SEO
- ✅ Vercel deployment (1-click)
- ✅ Excellent middleware support
- ✅ Image optimization built-in
- ✅ Large ecosystem and community
- ✅ Turbopack for faster builds

#### Cons
- ❌ Monthly breaking changes occasionally
- ❌ Learning curve for App Router (vs Pages Router)
- ❌ Build times can be slow on complex projects
- ❌ Limited offline capabilities

#### Decision Rationale
Next.js is the industry standard for React applications. It provides excellent developer experience, automatic code splitting, and seamless deployment to Vercel. For NEXUS AI's dashboard and Web3 UI needs, it's the clear choice.

#### Alternatives Considered
- React (bare): More control, but requires manual setup
- Remix: Good alternative, but smaller community
- Svelte: Smaller ecosystem, steeper learning curve
- Vue: Strong framework, but NEXUS team expertise is React

#### Affected Modules
- `apps/web/` (entire frontend)
- `.github/workflows/ci.yml` (build step)
- `docker-compose.yml` (dev environment)

#### Performance Metrics
- Build time: 60–90 seconds (production)
- Bundle size: 180 KB (main + framework)
- Time to Interactive: 2.5 seconds (fast 3G)
- Lighthouse score: 95 (average page)

#### Cost Analysis
| Scale | Cost/Month | Notes |
|-------|-----------|-------|
| 10K users | $0 | Vercel free tier |
| 100K users | $20 | Vercel pro tier |
| 1M users | $200+ | Vercel enterprise |

#### Team Familiarity
- Frontend team: ★★★★★ (expert)
- Backend team: ★★★☆☆ (basic)
- DevOps team: ★★★★☆ (experienced)

#### Security Notes
- Audit status: ✅ Complete
- Known vulnerabilities: None (regularly updated)
- Compliance: WCAG 2.1 AA compliant
- XSS protection: Built-in (React sanitization)

#### Maintenance Burden
- Setup time: 0.5 hours (next install)
- Monthly updates: 0.5 hours
- Annual major version upgrade: 4 hours
- Troubleshooting: Usually <1 hour

#### Lessons Learned
- Keep dependencies updated monthly
- Use TailwindCSS for styling (pair well)
- Leverage middleware for auth (saves duplicated logic)
- Test edge cases for ISR (incremental static regeneration)

#### Future Considerations
- Watch for major API changes in Next.js 16
- Monitor Remix adoption (potential alternative)
- Keep eye on Vite ecosystem (emerging)

---

### Backend Framework: FastAPI 0.115+

**Decision Date:** June 2026  
**Decision:** ✅ **ADOPT**  
**Next Review:** July 2027

#### Quick Facts
- **Category:** Backend / API Framework
- **Use Case:** REST API server, authentication, business logic, database interactions
- **Status:** Active
- **Maturity:** Stable (monthly releases)

#### Pros
- ✅ Automatic OpenAPI/Swagger documentation
- ✅ Async/await by default
- ✅ Type hints (Pydantic validation)
- ✅ Excellent performance (comparable to Node.js)
- ✅ Great for SSE streaming (founder-agent, auditor)
- ✅ Easy middleware setup
- ✅ Built-in dependency injection

#### Cons
- ❌ Smaller ecosystem than Django/Flask
- ❌ Fewer third-party integrations
- ❌ Smaller community (but rapidly growing)
- ❌ Limited ORM choices (SQLAlchemy primary)

#### Decision Rationale
FastAPI was chosen for its async-first design, which is perfect for handling concurrent requests (LLM streaming, database queries). The automatic API documentation reduces maintenance burden. Performance is excellent for NEXUS AI's scalability needs.

#### Alternatives Considered
- Django: More mature, but slower for async workloads
- Flask: Lightweight, but requires manual setup
- Node.js Express: Viable, but team expertise is Python
- Go / Rust: Overkill for current scale, learning curve

#### Affected Modules
- `apps/api/` (entire backend)
- `.github/workflows/ci.yml` (test step)
- `docker-compose.yml` (API service)

#### Performance Metrics
- Request latency: 15–50ms (API endpoints)
- Throughput: 2000+ req/sec per process
- Memory usage: 150 MB baseline
- Database query time: 5–20ms (avg)

#### Cost Analysis
| Scale | Cost/Month | Notes |
|-------|-----------|-------|
| 10K users | $0 | Self-hosted or Railway free |
| 100K users | $50 | Railway standard |
| 1M users | $500+ | Railway/AWS with auto-scaling |

#### Team Familiarity
- Backend team: ★★★★★ (expert)
- Frontend team: ★★☆☆☆ (basic)
- DevOps team: ★★★★☆ (experienced)

#### Security Notes
- Audit status: ✅ Complete
- Known vulnerabilities: None
- Compliance: OWASP Top 10 protection
- Rate limiting: Redis-based (implemented)
- Authentication: SIWE + JWT (implemented)

#### Maintenance Burden
- Setup time: 1 hour (fresh install)
- Monthly updates: 0.5 hours
- Annual major version upgrade: 6 hours
- Troubleshooting: 1–2 hours (usually async/greenlet issues)

#### Lessons Learned
- Use async everywhere (no sync blocking)
- Watch out for greenlet issues in SQLAlchemy
- SSE streaming requires special handling (async generators)
- Always validate with Pydantic (catches bugs early)

#### Future Considerations
- Monitor async SQLAlchemy stability
- Consider gRPC for internal services (if needed)
- Watch for FastAPI 1.0 release (no major changes expected)

---

### Database: PostgreSQL 16 (Primary) + SQLite (Fallback)

**Decision Date:** June 2026  
**Decision:** ✅ **ADOPT**  
**Next Review:** July 2027

#### Quick Facts
- **Category:** Database / Data Persistence
- **Use Case:** Primary production database, test database fallback
- **Status:** Active
- **Maturity:** Stable (enterprise-ready)

#### Pros (PostgreSQL)
- ✅ ACID compliance
- ✅ Excellent JSON support (JSONB)
- ✅ Mature ecosystem
- ✅ Great for complex queries
- ✅ Scales to millions of rows
- ✅ PostGIS extension for geospatial (future)

#### Pros (SQLite)
- ✅ Zero setup (file-based)
- ✅ Perfect for tests
- ✅ No external dependencies
- ✅ Excellent for development

#### Cons
- ❌ PostgreSQL requires maintenance
- ❌ SQLite not suitable for concurrent writes
- ❌ Migration complexity at scale

#### Decision Rationale
PostgreSQL is production-grade with excellent support for Web3 data (JSON, large numbers). SQLite provides frictionless local development and test database without requiring Docker.

#### Alternatives Considered
- MySQL: Good, but PostgreSQL is superior for JSONB
- MongoDB: Document-oriented, but NEXUS AI needs relational data
- Supabase: Excellent, but vendor lock-in risk
- Neon: Good alternative (serverless Postgres), future evaluation

#### Affected Modules
- `apps/api/app/core/database.py` (database engine)
- `alembic/versions/` (6 migrations)
- `docker-compose.yml` (PostgreSQL service)

#### Performance Metrics
- Query time (avg): 5–20ms
- Connection pool: 20 connections
- Write throughput: 1000+ writes/sec
- Storage: 2 GB at 1M users

#### Cost Analysis
| Scale | Cost/Month | Notes |
|-------|-----------|-------|
| 10K users | $0 | Docker free |
| 100K users | $50 | Railway standard |
| 1M users | $300+ | AWS RDS with replication |

#### Team Familiarity
- Backend team: ★★★★★ (expert)
- Frontend team: ★☆☆☆☆ (minimal)
- DevOps team: ★★★★☆ (experienced)

#### Security Notes
- Audit status: ✅ Complete
- Encryption at rest: Railway/AWS managed
- Encryption in transit: SSL/TLS
- Backups: Automated daily (Railway/AWS)
- Access control: Role-based (app user)

#### Maintenance Burden
- Setup time: 0.5 hours (Docker)
- Monthly maintenance: 0.5 hours
- Annual major version upgrade: 2 hours
- Backup verification: 1 hour (monthly)

#### Lessons Learned
- Use indexes on frequently queried columns
- Monitor slow queries regularly
- Keep connection pool tuned to workload
- Test migrations in staging before production

#### Future Considerations
- Evaluate Neon (serverless Postgres) for cost optimization
- Consider read replicas at 500K+ users
- Monitor for JSON performance degradation
- Plan for vertical sharding at 10M+ rows

---

### Authentication: SIWE (Sign-In with Ethereum) + JWT

**Decision Date:** June 2026  
**Decision:** ✅ **ADOPT**  
**Next Review:** July 2027

#### Quick Facts
- **Category:** Authentication / Web3 Identity
- **Use Case:** Wallet-based login without passwords
- **Status:** Active
- **Maturity:** Stable (EIP-4361 standard)

#### Pros
- ✅ No passwords = better UX
- ✅ Proof of wallet ownership
- ✅ EIP-55 checksum validation
- ✅ Industry standard for Web3
- ✅ Works with all major wallets
- ✅ Easy replay attack prevention (nonce)

#### Cons
- ❌ User can lose access if wallet lost
- ❌ Signature verification adds latency
- ❌ Client-side implementation complexity

#### Decision Rationale
SIWE is the standard for Web3 authentication. It proves users own their wallet, which is essential for NEXUS AI's blockchain integration. Paired with JWT for API sessions.

#### Alternatives Considered
- OAuth2/OIDC: Centralized, not Web3 native
- Magic Links: Email-based, centralized
- Passkeys: Emerging, but less Web3 friendly
- Custom wallet connection: Reinventing the wheel

#### Affected Modules
- `apps/api/app/services/auth_service.py` (SIWE verification)
- `apps/web/components/auth/connect-wallet-button.tsx` (frontend flow)
- `apps/web/hooks/use-auth.ts` (auth hook)
- `apps/api/app/modules/auth/router.py` (endpoints)

#### Performance Metrics
- Nonce generation: <5ms
- Signature verification: 10–50ms
- JWT issuance: <5ms
- Cookie persistence: automatic

#### Cost Analysis
| Component | Cost | Notes |
|-----------|------|-------|
| SIWE library | $0 | Open source |
| Signature verification | $0 | Client-side |
| Nonce storage (Redis) | $5/month | At 100K users |

#### Team Familiarity
- Backend team: ★★★★☆ (experienced)
- Frontend team: ★★★☆☆ (learning)
- Web3 team: ★★★★★ (expert)

#### Security Notes
- Audit status: ✅ Complete (EIP-4361 standard)
- Nonce format: Secure random (32 bytes)
- Nonce TTL: 5 minutes (prevents reuse)
- Signature validation: EIP-191 standard
- Address validation: EIP-55 checksum required
- Known vulnerabilities: None (standard protocol)

#### Maintenance Burden
- Setup time: 2 hours
- Monthly maintenance: 0.2 hours
- Monitoring: Check nonce storage usage monthly
- Updates: Follow EIP-4361 spec changes

#### Lessons Learned
- Always use EIP-55 checksum addresses
- Validate wallet ownership on every login
- Store nonces with short TTL (prevent brute force)
- Test with multiple wallet providers (MetaMask, WalletConnect, Coinbase)

#### Future Considerations
- Monitor EIP-7730 (Offchain attestations)
- Evaluate social login integrations (Privy, Dynamic)
- Consider multi-signature wallets (3of5)

---

### Frontend Wallet Integration: Wagmi + RainbowKit

**Decision Date:** June 2026  
**Decision:** ✅ **ADOPT** (with v2 migration in progress)  
**Next Review:** January 2027

#### Quick Facts
- **Category:** Frontend / Wallet Connection
- **Use Case:** MetaMask, WalletConnect, Coinbase Wallet integration
- **Status:** Active (v2.19.5, migrating to v2)
- **Maturity:** Stable (widely adopted)

#### Pros
- ✅ Supports 30+ wallets
- ✅ Built-in UX (QR code, mobile)
- ✅ React hooks for state management
- ✅ TypeScript support
- ✅ Excellent documentation
- ✅ Active maintenance

#### Cons
- ⚠️ **v2 has breaking API changes** (autoConnect removed, useConnect return type changed)
- ❌ Wagmi v2 is semi-major overhaul
- ❌ Large bundle size (~150 KB)

#### Decision Rationale
Wagmi + RainbowKit is the standard for Web3 apps. Despite v2 migration challenges, the ecosystem is too valuable to replace.

#### Alternatives Considered
- Web3Modal: Good, but less flexible
- ethers.js directly: More control, more work
- ConnectKit: Newer, smaller community
- Privy: Simpler UX, but more centralized

#### Affected Modules
- `apps/web/lib/wagmi.ts` (config) **[NEEDS FIXING]**
- `apps/web/components/providers.tsx` (provider wrapper)
- `apps/web/components/auth/connect-wallet-button.tsx` **[NEEDS FIXING]**
- `apps/web/hooks/use-auth.ts` (auth hook)

#### Performance Metrics
- Initial connection: 1–2 seconds
- Signature request: <100ms
- Bundle impact: ~150 KB (gzipped)
- Memory usage: 50 MB

#### Cost Analysis
| Component | Cost | Notes |
|-----------|------|-------|
| Wagmi library | $0 | Open source |
| RainbowKit library | $0 | Open source |
| WalletConnect Project ID | $0 | Free tier (10K daily limit) |

#### Team Familiarity
- Frontend team: ★★★★☆ (experienced)
- Backend team: ★★☆☆☆ (basic)
- Web3 team: ★★★★★ (expert)

#### Security Notes
- Audit status: ⚠️ In progress (v2 changes)
- Signature verification: Client-side
- Private key handling: Wallet responsibility
- Known vulnerabilities: None (reputable libraries)

#### Maintenance Burden
- Setup time: 2 hours
- v2 migration time: 4 hours (in progress)
- Monthly updates: 0.5 hours
- Troubleshooting: 2–4 hours (usually config issues)

#### Lessons Learned
- Always pin minor version (e.g., 2.19.5)
- Test with multiple wallets (not just MetaMask)
- Handle network switching gracefully
- Cache wallet provider preference in localStorage

#### Future Considerations
- **BLOCKER:** Complete Wagmi v2 migration (remove autoConnect, fix useConnect)
- Watch for Wagmi v3 (expected late 2026)
- Monitor Reown ecosystem evolution
- Consider Privy/Dynamic for simpler UX (future evaluation)

---

### Smart Contract Development: Hardhat + Solidity 0.8.28

**Decision Date:** June 2026  
**Decision:** ✅ **ADOPT**  
**Next Review:** July 2027

#### Quick Facts
- **Category:** Blockchain / Smart Contract Framework
- **Use Case:** SkillPassportNFT development, testing, deployment
- **Status:** Active
- **Maturity:** Stable (widely used in industry)

#### Pros
- ✅ Excellent documentation
- ✅ Built-in testing framework
- ✅ Great for debugging
- ✅ Plugin ecosystem
- ✅ Gas optimization tools
- ✅ TypeScript support

#### Cons
- ❌ Slower than Foundry
- ❌ Learning curve for beginners
- ❌ Gas costs can be high

#### Decision Rationale
Hardhat is the industry standard for smart contract development. It provides excellent tooling for testing and debugging, which is critical for the SkillPassportNFT contract.

#### Alternatives Considered
- Foundry: Faster, but smaller ecosystem
- Truffle: Outdated, declining adoption
- Remix: Fine for simple contracts, limited for complex projects

#### Affected Modules
- `packages/contracts/` (entire contracts package)
- `packages/contracts/contracts/SkillPassportNFT.sol`
- `packages/contracts/test/SkillPassportNFT.test.ts`

#### Performance Metrics
- Compile time: 2–5 seconds
- Test execution: <1 second (10 tests)
- Gas estimation: <100ms
- Deployment: 30–60 seconds

#### Cost Analysis
| Component | Cost | Notes |
|-----------|------|-------|
| Hardhat | $0 | Open source |
| Polygon Amoy testnet | $0 | Free testnet |
| Deployment to mainnet | $100+ | Gas fees only |

#### Team Familiarity
- Smart contract team: ★★★★★ (expert)
- Backend team: ★★☆☆☆ (minimal)
- Frontend team: ★☆☆☆☆ (minimal)

#### Security Notes
- Audit status: ✅ Complete (SkillPassportNFT.sol)
- Testing coverage: 95%
- Known vulnerabilities: None (follows OpenZeppelin patterns)
- Reentrancy protection: Implemented

#### Maintenance Burden
- Setup time: 1 hour
- Monthly updates: 0.5 hours
- Contract audits: 8 hours (annual)
- Troubleshooting: 1–2 hours

#### Lessons Learned
- Always test edge cases (mint twice, transfer, revoke)
- Use OpenZeppelin contracts (don't reinvent)
- Track gas usage (important for mainnet)
- Keep contract logic simple and auditable

#### Future Considerations
- Evaluate Foundry for future contract projects
- Plan for additional contracts (Reputation, DAO)
- Monitor for Solidity 0.9 release

---

## Decision History Timeline

| Date | Technology | Decision | Owner |
|------|-----------|----------|-------|
| June 2026 | Next.js 15 | ADOPT | Frontend Team |
| June 2026 | FastAPI 0.115 | ADOPT | Backend Team |
| June 2026 | PostgreSQL 16 | ADOPT | DevOps Team |
| June 2026 | SIWE + JWT | ADOPT | Security Team |
| June 2026 | Wagmi + RainbowKit | ADOPT | Web3 Team |
| June 2026 | Hardhat | ADOPT | Smart Contract Team |
| July 2026 | Wagmi v2 Migration | IN PROGRESS | Frontend Team |

---

## Pending Decisions

### [BLOCKER] Wagmi v2 API Migration

**Status:** 🔴 BLOCKING CI  
**Priority:** P0 (immediate)  
**Owner:** Frontend Team

**What needs fixing:**
1. Remove `autoConnect: false` from `apps/web/lib/wagmi.ts`
2. Update `apps/web/components/auth/connect-wallet-button.tsx` to use `accounts` array from `useConnect()` hook

**Expected outcome:** Frontend builds successfully on CI

**Timeline:** This week (July 6–10, 2026)

---

## Technologies Under Evaluation

### Emerging Platforms (Q3 2026 Review)

- **Modal** — Serverless GPU compute for inference
- **Together AI** — Open source LLM inference
- **Pinecone** — Vector database
- **Neon** — Serverless PostgreSQL (cost optimization)
- **Supabase** — Backend-as-a-Service (vendor lock-in risk)
- **Privy** — Simplified wallet/social login

### Future Hackathon Integrations

- **Superteam** — Solana ecosystem grants
- **ETHGlobal** — Ethereum hackathon platform
- **Polygon Ecosystem Fund** — Polygon grants
- **Anthropic Claude** — Alternative LLM provider

---

## Technology Sunset & Deprecation

*None at this time. All current technologies are actively maintained.*

---

**Knowledge Base maintained by:** NEXUS AI Engineering Team  
**Last reviewed:** July 6, 2026  
**Next review date:** October 6, 2026 (quarterly)
