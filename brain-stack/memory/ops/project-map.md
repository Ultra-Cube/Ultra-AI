# Ultra-AI Project Map (post-WP-0b canonical layout)

> First file to read when navigating the repo. Reflects the owner-supplied path map implemented in WP-0/WP-0b. Historical pre-migration paths appear only in `docs/archive/` and `docs/planning/layout-map.yaml` (as move records).

## Top-level

```
Ultra-AI/
├── brain-stack/          # AI brain: memory, skills, agents, plugin — ALL AI assets live here
├── platform/             # All product code (npm workspaces live under here)
├── control/              # Config, policies, compliance, templates, workflows, operations
├── distribution/         # Release assets + brand identity
├── environments/         # Per-environment configs (dev/staging/prod/testing)
├── infrastructure/       # Automation, terraform, monitoring, Test/
├── docs/                 # Documentation (v2, archive, guides, planning)
└── root files            # package.json, turbo.json, tsconfig, README, AGENTS.md, CLAUDE.md, .devin/, .cursor/, .github/
```

## brain-stack/ — the AI brain

| Dir | Contents |
|---|---|
| `memory/planning/` | Planning-phase memory: facts/, decisions/+ledger.md, glossary.md, contradictions.md, timeline.md, sources.jsonl, coverage.md |
| `memory/ops/` | **Live ops memory** — `project-map.md` (this file), README. Append-only ops events |
| `memory/diagrams/` | 116 Mermaid diagrams + `graphs/registry.json` |
| `skills/ultra-ai-v2/` | 33 authored SKILL.md packs (canonical) |
| `skills/legacy/` | Imported legacy skills (devops/{architecture-review,kanban-orchestrator,kanban-worker}) |
| `agents/` | A00–A15 crew definitions (a00-orchestrator.md …) |
| `commands/` | /ultra-status /ultra-gate /ultra-verify /ultra-release |
| `hooks/` | hooks.json preservation-guard (pre-commit/pre-push) |
| `prompts/` | ultra-ai-master-build.md, ultra-ai-build-prompt.md |
| `workflows/` | ULTRA_AI_TODO.md task board |
| `models/` | Model configs (local-inference from config/brain) |
| `mcp/` | MCP server configs (placeholder → fill) |
| `rules/` | AI rules (placeholder → fill) |
| `plugin/ultra-ai-builder/` | Plugin manifest: plugin.json, AGENTS.md |

## platform/ — all code

| Dir | Package(s) |
|---|---|
| `frontend/` | apps/web → Next.js web app (@ultra-ai/web) |
| `api/gateway/` | @ultra-ai/api-gateway |
| `api/contracts/` | Gate-OS /v1 contract — openapi.yaml + README (S4-P3 done; WP-11 note superseded) |
| `backend/core-api/` | @ultra-ai/api |
| `backend/hermes-runtime/` | @ultra-ai/hermes-runtime (S4-P1 — sessions/tasks, adapter contracts, memory, skills, ReAct reasoner) |
| `backend/ai-core/` | @ultra-ai/ai-core |
| `backend/distributed/` | PARKED device-mesh |
| `backend/blockchain/` | **DEFERRED** — owner parked chain/token/wallet |
| `shared/` | @ultra-ai/shared |
| `devtools/control-center/` | @ultra-ai/control-center |
| `devtools/desktop-bridge/` | @ultra-ai/desktop-bridge (S4-P2 — JSON-RPC 2.0 over WebSocket control plane) |
| `apps/desktop-ui/` | @ultra-ai/desktop-ui |
| `services/{voice-recognition,memory-optimizer,mock-adapters,auth-service}/` | service packages (auth-service placeholder) |
| `services/gate-os-bridge/` | @ultra-ai/gate-os-bridge (S4-P3 — /v1 readiness surface, Gate-OS untouched) |
| `services/ultra-core-bridge/` | @ultra-ai/ultra-core-bridge (S4-P4 — signed hash-chained ultra.event.v1 outbox + ExportTarget port; readiness only) |
| `database/` | DB schemas/configs (prisma move pending) |
| `testing/{e2e,integration,performance}/` | test trees (placeholders; sources were empty) |
| `enterprise/{dashboard,multi-tenant,white-label,expansion}/` | enterprise tier (expansion = former global/) |

## control/

- `config/docker/` — docker-compose.yml, Dockerfile.api/web, docker-entrypoint.sh
- `config/{env,monitoring,security,database,nginx}/` — placeholders
- `policies/{dao-governance,access-control,token-policies,voting-mechanisms}/` — placeholders (blockchain-gated G-4.2)
- `compliance/{kyc-aml,audit-trails,regulatory-reports,risk-assessment,licensing}/` — placeholders + licensing/legal-docs
- `templates/{terraform,cloudformation,kubernetes,helm-charts}/` — k8s manifests live in `templates/kubernetes/`
- `workflows/{github-actions,deployment-pipelines,testing-workflows,security-scans}/` — placeholders
- `operations/{incident-response,maintenance-procedures,backup-strategies,disaster-recovery}/` — placeholders

## infrastructure/

- `automation/` — preservation.sh (manifest/verify-moves/verify-additive/verify-tag), docker-manage.sh, k8s-deploy.sh, setup.sh, smoke-test.sh, ultra-stack.sh, fetch-repositories.py, import-critical-repos.sh, shoot*.mjs, verify-dom.mjs, verify-ui2.mjs, gen-moves.mjs
- `docker/` — postgres init.sql etc.
- `terraform/` — IaC
- `infrastructure/monitoring/` — `stack/hermes/` (Prometheus+Grafana+Alertmanager compose, relocated from legacy-hermes in WP-2b); `stack/sentinel/` WP-2 app watchdog (sentinel.mjs, Node>=20, port 9200, /status + /health + /metrics); `dashboards/` Grafana provisioning+dashboard; `alerts/` rules+channels+templates; `metrics/`, `health-checks/`, `logs/` placeholder dirs
- `Test/` — test environment (master-test.js, test.config.js, suites, reports, alerts)

## distribution/

- `assets/branding/` — full brand identity system (logos/colors/fonts/templates/social-media/patterns/icons + brand docs)
- `assets/releases/` — release bundles + baseline sha256 manifests

## environments/

- `manage-environment.sh` + `development/ staging/ production/ testing/` each with configs/tools/scripts/temp per env
- Root `.env.example` → `environments/development.env.example` (only *.example tracked)

## docs/

- `v2/` — master-plan, technical-spec, legal-licensing, release-notes, doc-conversion-map.csv, llms.txt
- `archive/root/` — pre-migration root docs (historical, paths NOT rewritten)
- `guides/` — QUICK-START, USER-GUIDE
- `planning/layout-map.yaml` — authoritative move map + placeholders + owner decisions

## Agent tooling (stays at root)

- `.devin/` — skills (~2,269 packs), agents/, mcp_config*.json
- `.cursor/rules/*.mdc`, `.github/` (workflows read from root only), `.claude/`, `.cortex/`, `.kombai/`, `.husky/`

## Deferred / pending (do NOT assume exists)

- blockchain/token/wallet/chain — PARKED (platform/backend/blockchain placeholder only)
- `monitoring/sentinel` — DONE WP-2 (`infrastructure/monitoring/stack/sentinel/`); dashboards/metrics/health-checks/alerts/logs expansion still pending
- prisma schema → `platform/database/prisma/` — DONE (moved from `platform/backend/core-api/prisma`; core-api `package.json` has `prisma.schema` pointer; validate+generate+386 jest tests green)
- external-integrations/, wsl-ai-stack/ — await owner-run manifest-local
- Gate-OS /v1 contract — platform/api/contracts (WP-11)

## Verification commands

```bash
npm run lint && npm run type-check && npm test   # all green post-WP-0b
bash infrastructure/automation/preservation.sh verify-moves baseline/pre-planning-20261111 <moves.tsv>
git log --oneline  # WP-0 steps cbcfc9c..96d0423 + WP-0b commit
```
- platform/services/zeroai-edge — ZeroAI local-first execution contract (memory→policy→local model/tool/workflow→escalate; confirmation gate; locality visibility)
- platform/devtools/desktop-bridge — exposes `zeroai.run`, `zeroai.trail.get`, `zeroai.trail.list`, `zeroai.routes` over JSON-RPC 2.0/WebSocket (:19477), adapting Hermes runtime memory/tools/providers into zeroai-edge ports
- platform/backend/core-api — `src/services/zeroai/edge-bridge-client.ts` (JSON-RPC-over-WS client) + `/zeroai/edge/{status,routes,run,trails}` routes with offline-safe 503 semantics and interaction/memory traces
- platform/frontend — `app/components/EdgePanel.tsx` on `/zeroai` page: bridge status, routes, trails, execution locality
- distribution/scripts/package-desktop.mjs — Linux/Windows desktop tarballs (launchers, manifests, SHA256 sums); package-release.mjs — 14 package tarballs
- platform/database/prisma — Prisma schema + migrations (relocated from core-api)
- ZeroAI local model lanes: zeroai-edge/src/local-model.ts (ollama /api/generate, OpenAI-compatible /chat/completions), env-configured via ZEROAI_LOCAL_MODEL(+_BASE_URL,_MODEL_NAME,_API_KEY); desktop-bridge accepts explicit localModel override. Next: functional 3D Control Center under platform/devtools/control-center.
