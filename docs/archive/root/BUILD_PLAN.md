# Ultra-AI Build Plan

**Date**: 2026-08-23
**Basis**: Static inspection of repo at `/opt/data/Ultra-AI` + planning docs (TASKS-CHECKLIST.md, docs/ROADMAP_NEXT_PHASES.md, docs/IMPLEMENTATION_READINESS.md, docs/phases/, docs/DOCUMENTATION_INDEX.md).

## ✅ Execution Progress (updated 2026-08-23)

| Task | Status |
|---|---|
| Phase A: lockfile + green baseline | ✅ DONE — `package-lock.json` created; type-check 9/9; **407 tests passing**; build 10/10 |
| Phase B1: real `platform/backend/ai-core` | ✅ DONE — OpenAI/Anthropic/Mock providers with failover, Arabic intent keywords, wired into API `POST /ai/process` |
| Phase B2: gateway provider management | ✅ DONE — real HTTP server on :20129 (`/health`, `/api/providers` CRUD) replacing TODO stub |
| Phase B3: full stack boot | ✅ VERIFIED — embedded Postgres :5432 → prisma migrate → api :4000 → gateway :20129 → web :3000 (health checks + E2E AI call + provider CRUD via web proxy OK) |
| Local infra note | Docker daemon unavailable & no sudo → Postgres runs via `embedded-postgres` npm binaries from `/opt/data/pgtool` (`node start-pg.mjs`, db `ultra_ai_dev`); creds in `platform/backend/core-api/.env.local` |
| Docs consolidation spec | ✅ DONE — see `docs/CONSOLIDATED_ENGINEERING_SPEC.md` (63 docs mined: topology, full API surface, data models, feature matrix, 7 doc conflicts, MVP checklist) |
| MVP smoke tests | ✅ **8/8 PASS** — `infrastructure/automation/smoke-test.sh`: register, login→JWT(225ch), authed `/ai/process`, RBAC 401 on `/admin/dashboard`, `/zeroai/message`, `/metrics`, swagger (302→200), web→gateway proxy |
| Doc conflicts reconciled | ✅ API port standardized on **4000** (K8s manifests + Dockerfile.api updated from 5555); Postgres pinned to 15 in both compose & K8s |
| Bug fixes found via smoke tests | Registration FK failure → `DatabaseUserService.createUser` now upserts the `default-tenant` |

### Running services (this machine)
- Postgres (embedded): `node /opt/data/pgtool/start-pg.mjs` → :5432
- API: `cd platform/backend/core-api && set -a && . ./.env.local && set +a && npx tsx src/server.ts` → :4000
- Gateway: `cd platform/api/gateway && npx tsx src/server.ts` → :20129
- Web: `cd platform/frontend && npx next dev -p 3000` → :3000

---

## 1. Current State Assessment

### Repo shape
- Turborepo/npm-workspaces monorepo (`apps/*`, `packages/*`, `services/*` — **no `services/` dir exists**, root scripts reference it).
- Root: Node >=20 (host has v22 ✓), turbo ^1.12, TS 5.3, ESLint/Prettier/husky/commitlint configured.
- **No lockfile present** (`package-lock.json`/`pnpm-lock.yaml`/`yarn.lock` all missing) → first `npm install` will resolve fresh; feasible but version drift risk.

### Code volume per workspace (src LOC)
| Workspace | Files | Lines | Verdict |
|---|---|---|---|
| platform/backend/core-api | 60 | ~15,400 | **Real**: Fastify/Express server, Prisma schema exists, RBAC, GraphQL, 15+ services (auth, analytics, caching, monitoring, multi-tenancy, webhooks, search, security, notifications, file-storage, audit-logging, zeroai) |
| platform/backend/distributed | 11 | ~1,760 | Real-ish: P2P node, chunker, orchestrator, encryption, blockchain rewards |
| platform/api/gateway | 5 | ~970 | Partial: gateway class with 9router bridge + auth integration, but provider loading is a TODO stub |
| platform/frontend | 12 | ~1,790 | Thin Next.js app: pages for dashboard/gateway/control-center/zeroai + API proxy routes |
| platform/devtools/control-center | 6 | ~609 | Small/stub-ish |
| platform/platform/apps/desktop-ui-ui | 5 | ~255 | Stub |
| platform/services/memory-optimizer | 5 | ~268 | Stub |
| platform/services/voice-recognition | 5 | ~227 | Stub |
| platform/backend/ai-core | 8 | ~192 | **Stub**: exports classes (AICore, NLPProcessor, IntentRecognizer, TaskPlanner, ModelRouter) but only 192 lines total |

### Tests
24 test files exist (Jest): concentrated in `platform/backend/core-api` (16), `distributed` (5), `api-gateway` (2). Docs claim "104/104 passing" but nothing has been verified in this environment and there's no lockfile/CI config guaranteeing it.

### Documentation vs reality gap
Docs are extensive but **aspirational/inflated relative to code**:
- `TASKS-CHECKLIST.md`: Phases 1–4 marked done (imports, gateway, auth, provider UI, desktop UI); Phases 5–8 pending (OpenClaw integration, JARVIS integration, Electron desktop app, bug-fix/hardening).
- `docs/ROADMAP_NEXT_PHASES.md`: claims "all 12 core phases complete, 112/112 features" then proposes Phases 6–12 (analytics, advanced caching, multi-tenancy, fine-tuning, advanced crypto, i18n, developer ecosystem).
- `docs/phases/PHASE_18/19_*`: K8s manifests exist as YAML (13 files) — infrastructure artifacts, not app code.
- Multi-tenancy, caching, monitoring etc. exist as *service modules* in platform/backend/core-api, but the roadmap treats them as future phases — the docs contradict each other on what's done.
- `IMPLEMENTATION_READINESS.md` is largely a business/funding plan (hiring, budgets), not engineering tasks.
- Many small packages (ai-core, desktop-ui, voice-recognition, memory-optimizer) are essentially interface shells with tests or types, not implementations.

### Build feasibility
- `npm install` should work (standard deps, no exotic native modules spotted at root level), but expect peer-dep friction: express ^5 with @types/express ^5 alongside fastify ^4, jest/ts-jest versions, eslint 8 stack.
- No lockfile, no CI workflow directory confirmed at root, husky `prepare` may fail without git hooks path — minor.
- TypeScript compile health unknown; 18 api source files contain TODO/mock markers.

---

## 2. Prioritized Phased Build Plan

Guiding principle: make one vertical slice actually runnable end-to-end before adding breadth. The biggest risk is breadth-of-stubs; consolidate depth-first.

### Phase A — Make it build & prove the core (≈1 week)
1. Generate lockfile (`npm install`), fix dependency conflicts (express vs fastify duplication in @ultra-ai/api — pick Fastify), pin engines.
2. Run `turbo run type-check` and `turbo run test`; fix breakages until green baseline. Add CI (GitHub Actions: install → type-check → test → build).
3. Wire the real server path: `platform/backend/core-api` server boots against Postgres via Prisma (`db:migrate`), health endpoint responds.
4. Delete or quarantine dead weight: missing `services/*` workspace entry, unused README-template, contradictory status claims in docs (add honest STATUS.md).

### Phase B — Core AI vertical slice (≈2 weeks)
1. Implement `platform/backend/ai-core` for real: intent recognition → task planning → model routing, backed by at least OpenAI-compatible HTTP provider. This package is imported by api and is currently a shell (~190 lines).
2. Complete `platform/api/gateway` provider management (replace `loadProviders` TODO with DB-backed config), token accounting, failover between providers.
3. Expose end-to-end flow: web UI prompt → Next.js API route → gateway → ai-core/model → response stored via api. Verify manually + integration test.
4. Seed minimal data model in Prisma: users, providers, tasks, results.

### Phase C — Distributed processing hardening (≈2–3 weeks)
1. `platform/backend/distributed` has the most substantive non-api code; integrate it behind the api task queue instead of leaving it parallel. Chunking → node dispatch → aggregation → reward accounting, with Redis queue.
2. Load/perf smoke tests (k6 or autocannon) at modest concurrency targets from IMPLEMENTATION_READINESS (100 concurrent tasks, <500ms).
3. Security pass: JWT flows end-to-end, encryption-at-rest for chunks, rate limiting at the gateway.

### Phase D — Web/control-center UX (≈2 weeks)
1. Flesh out platform/frontend pages (dashboard, gateway, control-center, zeroai) into working admin: provider CRUD, task history, metrics view (prom-client metrics already emitted by api).
2. Decide fate of `control-center` package vs web `/control-center` route — merge to avoid duplication.
3. Auth UI (login/register/JWT refresh) wired to api auth service.

### Phase E — Deferred / documented-but-not-implemented features (backlog, in priority order)
Per TASKS-CHECKLIST pending items and ROADMAP phases:
1. Electron wrapper for desktop-ui (Phase 7 of checklist) — only after web UX solid.
2. Voice recognition & memory-optimizer: implement or explicitly descope; today they're placeholders.
3. Advanced analytics dashboard (Roadmap Phase 6) — much of the service layer already exists; needs UI + persistence polish.
4. Multi-tenancy enterprise hardening, SSO/SAML (Roadmap Phase 8) — service module exists; needs isolation testing.
5. Fine-tuning pipeline, advanced crypto (ZK/homomorphic), i18n, plugin marketplace (Phases 9–12): long-term backlog; do not start before Phase D completes.
6. External integrations named in checklist (OpenClaw, JARVIS, quant-mind, Kimi-K2.5): treat as optional adapters behind the gateway abstraction, not core dependencies.

### Dependency graph
```
ai-core ──► api-gateway ──► api (server/routes/services) ──► platform/frontend
                                 │
distributed ◄── Redis/Postgres ──┘
desktop-ui, voice-recognition, memory-optimizer ── depend on stable api contracts (defer)
k8s/docker-compose ── depends on images building cleanly (after Phase A)
```

### Scope estimates (single senior dev)
- Phase A: ~5–8 days · Phase B: ~8–10 days · Phase C: ~10–15 days · Phase D: ~10 days · Phase E: open-ended, prioritize per product need.

---

## 3. Top 3 Recommended First Tasks

1. **Lockfile + green baseline**: `npm install`, resolve the express/fastify conflict in `@ultra-ai/api`, get `turbo run type-check && turbo run test` passing, add CI.
2. **Real implementation of `platform/backend/ai-core`** (intent → planner → model router hitting an actual LLM provider) since everything upstream imports it and it's currently a ~192-line shell.
3. **Finish `platform/api/gateway` provider loading + boot the full stack locally** (Prisma migrate + api server + web dev server) to establish one working vertical slice.
