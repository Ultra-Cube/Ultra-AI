<!--[UCUBETECH-COPYRIGHT]
 Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
 Developed by Ultra Zone Team — ultra-zone.ucubetech.com
 GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved-->

# Contradictions Ledger

Each row: topic, source A, source B, resolution (ADR id or pending card).

| # | Topic | Source A | Source B | Resolution |
|---|-------|----------|----------|------------|
| C-01 | "Hermes" meaning | Repo: `infrastructure/monitoring/legacy-hermes` Prometheus/Grafana stack + `/hermes` page | Owner intent: Hermes Agent by Nous Research (MIT) as platform brain | PENDING — card G-0.4 (rename monitoring stack to Sentinel vs keep) |
| C-02 | Repo default branch | Super prompt assumes `master` | Actual: `main` @ c863ef8 | RESOLVED — deviation logged; use `main` |
| C-03 | Version claims | `package.json` = 0.1.0, README claims 1.0.0 | No LICENSE, no package-lock | PENDING — Phase 0 honest-baseline fixes (lockfile, LICENSE Apache-2.0, README rewrite) after baseline tag |
| C-04 | Control plane | Legacy WSL/ZeroAI docs: OpenClaw is the edge control plane, never bypassed | v2 intent: Hermes Agent as brain/router | PENDING — card G-1.9 |
| C-05 | Port collisions | n8n uses 5678; JARVIS also 5678 (`wsl-ai-stack/scripts/setup-n8n.sh`, `docs/UPSTREAM_INTEGRATION_INVENTORY.md`) | Port plan needs single assignment | PENDING — assign unique ports in platform contracts (P1) |
| C-06 | Other port conflicts | 4000 vs 5555 still referenced in `k8s-deploy.sh:199`; 20128/20129; 3000 shared by web vs AionUi/OpenHands | Single source of truth needed | PENDING — port registry in `contracts/` (P1) |
| C-07 | Completion claims | Docs claim "100% complete" phases | Verified tests: only ai-core 3 + api-gateway 45 + distributed 55 = 103 pass; `@ultra-ai/api` unverifiable without Prisma engine | RESOLVED — status vocabulary enforced; treat claims as IDEAL until VERIFIED |
| C-08 | Mermaid diagram validity | 117 legacy Mermaid blocks | 116 parse, 1 invalid (`.github/copilot-instructions.md` block #1 is an arrow-chain, not a diagram) | RESOLVED — keep original untouched, re-express in `brain-stack/memory/diagrams/v2/` (S2) |
| C-09 | Skales license | `external-integrations/skales/` vendored under BSL 1.1 — non-commercial until 2030-04-19 | Product is open-source/commercial-ambiguous | RESOLVED — never ship Skales in product builds; license row must be APPROVED first (license gate) |
| C-10 | Ultra Core interface | Owner says it is the blockchain platform to connect/export to | No public spec found (web search 2026-11-09) | PENDING — card G-4.1: build neutral signed-event outbox first; wait for owner spec |
| C-11 | Ultra Core outbox location | P4/P4B plan text mentions `platform/packages/ultra-core-bridge` (A13) | Actual code lives at `platform/services/ultra-core-bridge`; `platform/packages/` has no bridge package | RESOLVED for planning — canonical path is `platform/services/ultra-core-bridge`; update P4B tasks to match code |
| C-12 | Duplicate signed outbox | `platform/services/ultra-core-bridge` exports `ultra.event.v1` via `ExportTarget` | `platform/backend/outbox` also implements signed `ultra.event.v1` hash-chained events/store/cursors | PENDING — owner card: choose canonical outbox before P4B-05 exporter work |
| C-13 | P4 status drift | `ULTRA_AI_TODO.md` P4-02/03/04 are IDEA | `README.md` marks S4-P4 Ultra Core bridge DONE and `platform/services/ultra-core-bridge` exists with tests | RESOLVED for docs — treat bridge as implemented-readiness; P4B remains contract/mock work |
