# Ultra AI Platform — Consolidated Engineering Specification

Consolidated from all 63 markdown files under `docs/` (architecture/, ui/, security/, operations/, phases/, planning/, reports/, business/, ux-design/). Sources are cited inline as `[doc]`. Where docs conflict, the conflict is called out explicitly.

---

## 1. Runtime Topology

### 1.1 Services (monorepo, Turborepo workspaces)

| Service | Package | Stack | Default Port | Notes |
|---|---|---|---|---|
| Web UI | `@ultra-ai/web` (`packages/web`, also referenced as `platform/frontend`) | Next.js 14+, Tailwind, TS | **3000** | ZeroAI control surface at `/zeroai`; role selector landing page |
| API server | `@ultra-ai/api` (`platform/backend/core-api`) | Fastify + TS + Prisma | **5555** in Docker/K8s docs; **4000** in dev/test guides (`LOCAL_RUN_GUIDE`, `API_ENDPOINT_TESTING_GUIDE`, Phase 10/11 examples use 4000) | Swagger at `/api-docs`, Prometheus at `/metrics` |
| AI core engine | `@ultra-ai/ai-core` | Node/TS; TF.js, Transformers.js/LangChain, PyTorch via Python bridge | library (in-process) | NLP, intent recognition, task planning |
| Distributed/P2P | `@ultra-ai/distributed` | Node/TS custom mesh | worker pods | chunker, orchestrator, p2p-node, encryption, reward-system |

### 1.2 Local ZeroAI edge stack (WSL)
- Speech-to-text: `wsl-ai-stack/scripts/transcribe-audio.py`
- Voice bridge: `wsl-ai-stack/scripts/voice-bridge.sh`
- Memory store: `platform/backend/core-api/src/services/zeroai/zeroai-store.ts` (durable JSON state file per ai-os-blueprint)
- Control surface: `platform/frontend/app/zeroai/page.tsx`
- Workflow API: `platform/backend/core-api/src/routes/workflows.routes.ts`
- Routing policy: **OpenClaw** bridge; local model = **Ollama** (AirLLM later); automation backbone = **n8n**; optional local UI shells: Open WebUI or LocalAI.

### 1.3 Infra dependencies

| Component | Version(s) cited | Ports | Connection strings |
|---|---|---|---|
| PostgreSQL | docker-compose: **16**; K8s/dev tooling: **15 / 15.5** | 5432 | `postgresql://ultra_ai_user:<pw>@localhost:5432/ultra_ai_db` |
| MongoDB | **7** | 27017 | `mongodb://ultra_ai_user:<pw>@localhost:27017/ultra_ai_db` |
| Redis | **7** (7.2 in .tool-versions) | 6379 | `redis://:<password>@localhost:6379` |
| IPFS | node | gateway 8080, API 5001 | distributed storage/blockchain data |
| Adminer | — | 8081 | DB UI |
| Redis Commander | — | 8082 | cache UI |
| Ollama / n8n / OpenClaw | local stack, no ports specified in docs | — | ZeroAI edge runtime |
| Ethereum | Ganache (dev mock), Sepolia/Goerli (staging), mainnet (prod) | — | CS token ERC-20 rewards contract |

### 1.4 Environment variables (as documented)
Core: `DATABASE_URL`, `REDIS_URL`, `MONGO*`, `PORT` (5555), `NODE_ENV`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL=http://localhost:5555`.
Feature flags: `ENABLE_GRAPHQL`, `ENABLE_WEBHOOKS`, `ENABLE_ANALYTICS`.
Multi-tenancy: `DEFAULT_MAX_USERS=5`, `DEFAULT_MAX_STORAGE=1073741824`, `BASE_DOMAIN=ultra-ai.com`, `ENABLE_CUSTOM_DOMAINS=true`.
Analytics: `REDIS_HOST`, `REDIS_PORT`, `ANALYTICS_RETENTION_DAYS=90`, `ANALYTICS_DETAILED_LOGGING=true`.
Misc: `OS_INTEGRATION_TYPE` (mock default), `NODE_OPTIONS=--max-old-space-size=...`. `.env.example` claims ~45 variables total.

### 1.5 Kubernetes topology (Phase 19, namespace `ultra-ai`)
- 13 manifests under `k8s/` (namespace/RBAC/quota, configmap 100+ vars, secrets, storage 3 StorageClasses + 6 PVCs, Postgres StatefulSet 50Gi, Redis master + 3 Sentinels 20Gi, MongoDB 3-node RS 100Gi, API Deployment ×3 (500m–2000m CPU, 512Mi–2Gi), Web Deployment ×2 (250m–1000m, 256Mi–1Gi), 8 services, ingress + cert-manager + NetworkPolicies, HPA/VPA/LimitRange, kustomization).
- HPA: API 3→20 @70% CPU; Web 2→10 @75% CPU. Pods run non-root UID 1001.
- Ingress subdomains: api/app/graphql/admin/health/metrics `.ultra-ai.local`.
- Deploy: `./k8s-deploy.sh full|config|databases|apps|verify|delete` or `kubectl apply -k k8s/`.

### 1.6 Docker Compose
8 services (postgres, mongodb, redis, ipfs, api, web, adminer, redis-commander) on `ultra-ai-network` bridge; entrypoint waits for PG/Redis, runs `prisma migrate deploy`, generates client, seeds. Managed by `docker-manage.sh {build,start,stop,restart,logs,status,cleanup}`.

---

## 2. Complete API Surface

### 2.1 Implemented / documented against the running API (base `http://localhost:4000` dev, `:5555` containerized)

Health & observability
- `GET /health` — basic health
- `GET /health/detailed` — component status (database, redis, api) with response times
- `GET /metrics` — 40+ Prometheus metrics (http_*, errors_*, auth_*, database_*, cache_*, ai_*, system_*, health_check_status)
- `GET /api-docs` — OpenAPI 3.1 Swagger UI

Auth
- `POST /auth/register` — email + password (12+ chars, mixed case/number/special), bcrypt, returns JWT (24h expiry)
- `POST /auth/login`
- `POST /auth/refresh`

User / workspace profiles
- `GET /user/workspace-profile` (protected), `PUT /user/workspace-profile`

AI
- `POST /ai/process` — intent-based processing (input ≤10,000 chars)
- `POST /ai/advanced-process` — multi-provider routing w/ failover
- `GET /ai/models` — list models (OpenAI gpt-4o/gpt-4o-mini, Anthropic claude-3-*, Ollama local)
- `GET /ai/gateway/health` — provider health

RBAC admin (role hierarchy SUPER_ADMIN > ADMIN > MODERATOR > USER)
- `GET /admin/dashboard` (ADMIN+), `GET /admin/users` (ADMIN+, paginated), `GET /admin/stats` (MODERATOR+) — includes cache stats

Compliance (GDPR/CCPA)
- `POST /compliance/consent`, `GET /compliance/consent/:userId`
- `POST /compliance/data-export`, `POST /compliance/data-delete`, `GET /compliance/access-log`, `GET /compliance/status`

Multi-tenancy (Phase 10)
- `POST /tenants`, `GET /tenants` (SUPER_ADMIN), `GET /tenants/:id`, `PATCH /tenants/:id`, `POST /tenants/:id/suspend`, `POST /tenants/:id/activate`, `DELETE /tenants/:id`
- Tenant resolution order: `X-Tenant-Slug` header → custom domain → subdomain → path param

Analytics (Phase 11, tenant-scoped)
- `POST /analytics/events` — track custom event
- `GET /analytics/events` — filter by type/name/user/date, paginated
- `GET /analytics/dashboard` — totals, active users 24h, error rate, avg response time, top events/pages, growth, system health
- `GET /analytics/activities?userId=&limit=` — before/after audit trail
- `GET /analytics/report?format=json|csv&...` — export
- `GET /analytics/events/count-by-type`
- `DELETE /analytics/cleanup?daysToKeep=90` (ADMIN)

ZeroAI control surface (AI OS blueprint)
- `GET /zeroai/state`, `GET /zeroai/memory`, `GET /zeroai/workflows`
- `POST /zeroai/message`
- `POST /zeroai/workflows`, `POST /zeroai/workflows/{id}/run`

n8n workflows proxy (system-architecture endpoint list)
- `GET /n8n/workflows`, `GET /n8n/workflows/{id}`, `POST /n8n/workflows`, `PUT /n8n/workflows/{id}`, `DELETE /n8n/workflows/{id}`, `POST /n8n/workflows/{id}/execute`

### 2.2 Proposed / aspirational only (API_DOCUMENTATION.md — v1 public API design, not tied to code)
- REST `/api/v1/*`: auth login/refresh/logout; tasks create/get/list/cancel; `POST /api/v1/ai/process`, `GET /api/v1/ai/models`, `POST /api/v1/ai/stream`; network status/join/rewards; users profile/stats.
- GraphQL schema: Query (me, tasks, task, networkStatus, nodeStats, rewardBalance, availableModels, processingHistory), Mutation (createTask, cancelTask, joinNetwork, claimRewards, processRequest), Subscription (taskUpdates, networkEvents, rewardUpdates).
- WebSocket events, SDKs (@ultra-ai/sdk JS, ultra_ai Python, Go), developer portal docs.ultra-ai.com.
- System-architecture also lists unversioned proposals: `POST /ai/chat`, `POST /ai/tasks`, `GET /ai/tasks/{id}`, `POST /ai/models/custom`, network join/rewards, user profile/preferences/activity.

---

## 3. Data Models (Prisma / docs)

- **User**: id (cuid), email (unique per tenant), passwordHash (bcrypt), role enum USER/MODERATOR/ADMIN/SUPER_ADMIN, required `tenantId` relation. Indexes email/role/tenantId.
- **Tenant** (Phase 10): id, name, slug (unique), domain (unique, nullable), status enum ACTIVE/SUSPENDED/TRIAL/CANCELLED (default TRIAL), plan enum FREE/STARTER/PROFESSIONAL/ENTERPRISE (default FREE), maxUsers (default 5), maxStorage (default 1GB), settings JsonB (theme/features/integrations/notifications), timestamps; has many Users.
- **AnalyticsEvent**: tenantId, userId?, eventType enum (PAGE_VIEW, API_CALL, USER_ACTION, ERROR, AUTH…), eventName, severity INFO/WARNING/ERROR/CRITICAL, path/method/statusCode/durationMs, metadata Json, userAgent/ipAddress, success, errorMessage/errorStack, timestamp.
- **UserActivity**: tenantId, userId, action, resource/resourceId, before/after Json snapshots, ip/userAgent, timestamp.
- **AnalyticsMetric**: tenantId, metricType COUNTER/GAUGE/HISTOGRAM/SUMMARY, metricName, value, count, dimension1-3, timestamp, windowStart/windowEnd.
- **SystemMetric**: metricName, value, unit, host, service, tags Json, timestamp.
- **Blockchain domain** (distributed pkg): TaskRecord {taskId bytes32, contributors[], contributions[], totalReward, timestamp, distributed}; nodeReputations/nodeEarnings maps; Solidity `UltraAIRewards` contract (OpenZeppelin ReentrancyGuard/AccessControl/Pausable, ORACLE_ROLE, ERC-20 CS token).
- **TS interfaces** (docs): AdaptiveWorkspaceProfile (userId, role video-designer|developer|researcher|marketer|custom, preferredTools, layout{sections,pinnedWidgets,density}, adaptation{enabled,lastUpdatedAt,confidence}, manualOverrides); ModelGatewayPolicy (providers openai|anthropic|local|custom, routingMode quality-first|cost-first|latency-first|hybrid, fallbackOrder, healthCheckIntervalMs, rateLimitBudgetPerUser); ChunkingStrategy (semantic|random|functional, min/maxChunkSize, overlapPercentage, redundancyFactor); ProcessingNode/NodeCapabilities/ContributionMetrics.
- Plan limits: FREE 5 users/1GB/100 req-h; STARTER 25/10GB/1000; PROFESSIONAL 100/100GB/10k + custom domain; ENTERPRISE unlimited.

---

## 4. Feature Matrix

### Implemented per code-referencing docs (IMPLEMENTATION_SUMMARY, FEATURES_IMPLEMENTED, PHASES_6_9_SUMMARY, Phase 10/11 guides)
| Feature | Status | Claimed by |
|---|---|---|
| JWT auth (register/login/refresh, 24h tokens, bcrypt) | implemented | IMPLEMENTATION_SUMMARY Ph1d, FEATURES_IMPLEMENTED |
| Workspace recommender + profile persistence | implemented | Ph1b/Ph1c |
| AI Core (NLP, 4 intents: search/tool/analytics/collaboration, AR/EN) | implemented | Ph1a |
| Multi-provider model gateway (OpenAI/Anthropic/Ollama, failover, health checks) | implemented | Ph2a |
| P2P distribution, task chunking, orchestration | implemented | Ph2b |
| AES-256-GCM encryption, key rotation, tamper detection | implemented | Ph2c |
| Rate limiting (100 req/15min/IP), input validation, security headers, audit logging | implemented | Ph3 |
| GDPR/CCPA endpoints | implemented | Ph3 |
| Blockchain reward system (reputation 0-100, streak bonuses, leaderboards, Solidity ABI — off-chain calc, on-chain "ready") | implemented (calculation layer); on-chain integration is stub/ready-only | Ph4 |
| RBAC 4-level hierarchy | implemented | Ph6 |
| Swagger/OpenAPI 3.1 | implemented | Ph7 |
| Prometheus metrics + Winston structured logging + correlation IDs | implemented | Ph8 |
| L1 in-memory + L2 Redis caching | implemented | Ph9 |
| Multi-tenancy (isolation, plans, scoped Prisma) | implemented | Ph10 |
| Analytics service + middleware + 7 endpoints | implemented | Ph11 |
| Docker (Dockerfile.api/web, compose 8 services, entrypoint, manage script) | implemented | Ph18 |
| K8s manifests + deploy script | implemented (YAML validated only) | Ph19 |
| ZeroAI control surface (dual Simple/Professional UI, memory store, workflow builder/run, trace + health cards, graceful fallback when local model down) | implemented (demo-grade, no auth) | LOCAL_RUN_GUIDE, ai-os-blueprint, README |

### Proposed (design only)
- Public `/api/v1` REST + GraphQL + subscriptions + SDKs [API_DOCUMENTATION]
- Distributed mesh hardening: SecureChunker (noise injection, padding, shuffle), ResilientOrchestrator (redundancy, consensus ≥0.66, blacklisting), sharding coordinator [planning/CRITICAL_ISSUES — all "In Progress/Planned"]
- WebRTC P2P transport, STUN/TURN NAT traversal, signaling server [DEVELOPMENT_ROADMAP Phase 2]
- Real smart-contract deployment/audits, staking, governance, IPFS pinning service [DEVELOPMENT_ROADMAP Phase 3]
- MFA/OAuth/SSO/SAML/SCIM, Elasticsearch search, Kong/Nginx edge gateway, Kafka/streaming analytics, custom-model fine-tuning, post-quantum crypto, i18n/localization, marketplace [ROADMAP_NEXT_PHASES, REMAINING_TASKS Tier 3-4]
- Gata-OS integration (hypothetical; mock gateway proposed) [CRITICAL_ISSUES #3]

### Stubs / partial
- Blockchain on-chain calls (ABI present, no deployed contracts/tests vs chain).
- Voice pipeline (scripts exist; STT quality/validation explicitly listed as a gap).
- ZeroAI demo mode: no authentication ("No login is required for the local demo"), durable state is a JSON file, not Postgres.
- E2E/load/security test suites (Cypress/k6/OWASP) listed as TODO [REMAINING_TASKS].

### Doc-vs-doc conflicts (gaps)
1. **API port**: dev guides say **4000** (`LOCAL_RUN_GUIDE`, testing guide, tenant/analytics curl examples); Docker/K8s say **5555**. Likely PORT env-dependent but never reconciled.
2. **Postgres version**: compose says 16; K8s/tool-versions say 15/15.5.
3. **Package layout**: IMPLEMENTATION_SUMMARY uses `packages/web/...`; system-architecture references `platform/frontend/app/zeroai/page.tsx` — both appear in docs; actual repo layout must be verified.
4. **Test counts drift**: 104 (early) → 191 (post Ph6-9) → 230 (post Ph11) all claimed "100%".
5. **"100% complete" claims** (FEATURES_IMPLEMENTED, COMPLETION_REPORT) contradict planning docs listing TIER-1 critical items as open (production DB backups, env management, security validation, load testing) and CRITICAL_ISSUES marking core distributed-security work "In Progress".
6. **Old numbering vs new three-phase plan**: DEVELOPMENT_ROADMAP contains two concatenated documents (July 2026 3-phase model atop March 2026 phase 0-5 plan); docs acknowledge this drift [planning/CRITICAL_ISSUES].
7. Referenced-but-missing docs: `KUBERNETES_SETUP.md`, `CI_CD_SETUP.md`, `MONITORING_SETUP.md`, `SECURITY_HARDENING.md`, `USER_GUIDE.md`, `PROJECT_PHASES_AND_STATUS.md`, `api-design.md`, `integration-patterns.md`.

---

## 5. Cross-Cutting Specs

- **Security framework** [security-framework.md]: defense-in-depth (app/processing/network/infra/blockchain layers); zero-trust; TLS 1.3; AES-256-GCM + ChaCha20-Poly1305 storage; ed25519 node auth w/ internal CA, 30-day rotation, reputation + staking gates; hierarchical key management; quantum-resistant roadmap (CRYSTALS-Kyber/Dilithium); smart-contract audit tooling (slither/mythril/echidna); threat matrix (data breach critical, node compromise high).
- **Performance targets**: API <200ms p95 (<100ms cached), task <30s standard, node latency <100ms, 99.9% uptime, 1000+ concurrent tasks, load-test goals 1000+ TPS / p99<200ms / err<0.1%.
- **DR**: RTO <30min, RPO <5min; daily backups 30-day retention, cross-region replication; monthly cost estimate $1,320.
- **Legal/compliance**: GDPR consent/export/delete (30-day SLA), CCPA 90-day retention, data residency, AML/KYC flagged for CS token [LEGAL_COMPLIANCE_FRAMEWORK, CRITICAL_ISSUES].
- **Governance/process**: conventional commits, trunk+develop branching, semver; business/UX docs (personas, journeys, GTM) exist but contain no implementable spec.

## 6. Minimum Viable Platform Checklist (boot web + api + gateway/ai-core end-to-end locally)

1. **Infra up**: `docker-compose up -d postgres redis` (Mongo/IPFS not needed for MVP path). Copy `.env.example` → `.env`: set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT=4000` (or 5555 — pick one and fix docs).
2. **Database**: `npx prisma migrate deploy` (+ optional seed) in `platform/backend/core-api`.
3. **API**: install deps; `npm run dev --workspace=@ultra-ai/api`. Verify `GET /health/detailed` shows database+redis healthy; `/metrics` and `/api-docs` respond.
4. **Model provider**: point model-gateway at one reachable provider — Ollama local (no key) or set OPENAI/ANTHROPIC key; verify `GET /ai/models` and `GET /ai/gateway/health`.
5. **Web**: `npm run dev --workspace=@ultra-ai/web` with `NEXT_PUBLIC_API_URL` matching the chosen API port; verify `/` role selector and `/zeroai` control surface loads Simple + Professional views.
6. **ZeroAI loop**: `POST /zeroai/message` returns either routed model response or the documented local-fallback response; workflow builder can create + run a workflow; trace/memory/health panels populate from the JSON state store.
7. **Smoke tests**: register/login (`/auth/register`, `/auth/login`), `POST /ai/process`, confirm RBAC 403 on `/admin/dashboard` for USER role.

Explicitly out of MVP scope: MongoDB, IPFS, blockchain/rewards, multi-tenancy, analytics dashboard, n8n/OpenClaw voice bridge (optional enhancement once base loop works), K8s.

---
*Generated from full recursive read of `/opt/data/Ultra-AI/docs/**/*.md`.*
