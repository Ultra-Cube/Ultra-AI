# Facts — Root docs, BUILD_PLAN, README (S2b batch)

## README.md (root) — ASPIRATIONAL/MARKETING, partially stale
- Claims v1.0.0, MIT license, "10/10 quality" — conflicts with ADR-0002 (Apache-2.0, v0.2.0-planning tag).
- ZeroAI positioned as local WSL assistant layer; Ultra AI = networked platform behind it.
- Features: smart adaptive UI, multi-model AI gateway, developer tools library, "Gata-OS" integration (typo for Gate-OS), distributed OS via blockchain + CS digital currency rewards.
- Distributed processing model: request chunking → user device network → parallel processing → reassembly. CS currency, wallets, circular economy.
- Tech stack claims: React/Next.js/TS/WASM, TensorFlow/PyTorch/LangChain, Blockchain/IPFS/WebRTC, Postgres/Mongo/Redis/S3, Docker/K8s/AWS.
- Functional requirements list mostly unchecked ([ ]) — aspirational.
- Deployment plan phases Q1 2025–Q2 2026 — stale dates.
- CONTRADICTION: blockchain/currency presented as core in README vs owner decision: blockchain deferred to advanced phases, prepare-only.
- CONTRADICTION: MIT license claim vs Apache-2.0 decision.

## BUILD_PLAN.md (2026-08-23) — VERIFIED LIVE STATE (highest-value ops doc)
- Static inspection of repo + planning docs; records real execution state.
- Phase A done: package-lock.json created; type-check 9/9; **407 tests passing**; build 10/10.
- Phase B1: real packages/ai-core — OpenAI/Anthropic/Mock providers w/ failover, Arabic intent keywords, wired to API POST /ai/process.
- Phase B2: api-gateway real HTTP server :20129 (/health, /api/providers CRUD), replaces TODO stub.
- Phase B3 verified: embedded Postgres :5432 → prisma migrate → api :4000 → gateway :20129 → web :3000; E2E AI call + provider CRUD via web proxy OK.
- Local infra: Docker daemon unavailable & no sudo → Postgres via embedded-postgres npm binaries (/opt/data/pgtool, db ultra_ai_dev); creds in packages/api/.env.local.
- Smoke tests 8/8 PASS (infrastructure/automation/smoke-test.sh): register, login→JWT, authed /ai/process, RBAC 401 on /admin/dashboard, /zeroai/message, /metrics, swagger, web→gateway proxy.
- Bug fix: DatabaseUserService.createUser now upserts default-tenant (FK failure fixed).
- Docs consolidation: docs/CONSOLIDATED_ENGINEERING_SPEC.md mined 63 docs → topology, API surface, data models, feature matrix, 7 doc conflicts, MVP checklist.
- Doc conflicts reconciled: API port standardized on 4000 (K8s manifests + Dockerfile.api updated from 5555); Postgres pinned to 15.
- Repo shape findings: no services/ dir despite root scripts referencing it; ai-core was 192-line shell (now implemented); docs inflated vs code.
- Services run commands documented (pgtool start-pg.mjs, api tsx server.ts, gateway, next dev).
- Estimate doc: phases A–E with dependency graph ai-core→api-gateway→api→apps/web; distributed behind Redis/Postgres.

## Implications for v2 plan
- BUILD_PLAN proves monorepo apps/packages skeleton actually runs (api, gateway, web) — P1 platform core has a working base, not greenfield.
- api-core now has real providers + Arabic intent — relevant for Hermes adapter layer design.
- embedded-postgres path is the working dev DB; docker-compose Postgres is secondary.
- Root README must be treated as legacy/aspirational; v2 planning docs supersede it.
