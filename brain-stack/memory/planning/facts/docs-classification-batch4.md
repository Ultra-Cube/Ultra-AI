# S2b Facts — Batch 4: external-integrations, monitoring, config, packages READMEs, skills/devops

## external-integrations/ (7 files)
- `README.md` + `INTEGRATION_PLAN.md` (Aug 8 2026): 4 repos imported from Fadhel-SH/GitHub to integrate into Ultra-AI platform:
  - **9router** — unified AI gateway, 40+ providers, auto-fallback, RTK -40% tokens (Priority 1, Critical)
  - **AI-agentic-_JARVIS** — agentic OSINT/intelligence platform (Python)
  - **AI-assistant_openclaw** — multi-channel personal assistant
  - **APP_WebUI-desktop** — desktop interface for Open WebUI
- `FADHEL-SH-REPOSITORIES.md`, `FADHEL-SH-COMPLETE-LIST.md`, `FADHEL-SH-COMPLETE-ANALYSIS.md`: catalog of ~124–125 Fadhel-SH repos across 12 categories, 8 imported as of Aug 8 2026. `AI-Tools_quant-mind` (quant finance knowledge extraction) added later as High priority.
- Verdict: VERIFICATION/aspirational — import inventory, not architecture authority. Integration status claims ("in progress") are stale; actual integration is governed by current platform work.

## infrastructure/monitoring/legacy-hermes/README.md
- Hermes = observability layer: self-contained Prometheus + Grafana + Alertmanager + node-exporter.
- Zero runtime coupling; scrapes existing metrics: `@ultra-ai/api` exposes `GET /metrics` (40+ prom-client metrics: HTTP latency/throughput/errors, auth, DB perf, cache hit/miss, AI processing + token usage, system) plus `/health` and `/health/detailed`.
- Verdict: VERIFIED pattern — adopt for v2 observability. Directly relevant to "runtime/operations" directory in reorg.

## config/brain/README.md
- Scaffold for self-hosted local inference "brain" (OpenAI-compatible endpoint, e.g. localhost:8000/v1) so Hermes/Ultra-AI can route to local models instead of hosted APIs.
- Status: SCAFFOLD ONLY — host has no GPU and ~1.3GB free RAM; files are templates for a future GPU host. `brain.config.yaml` defines a custom provider block.
- Verdict: ASPIRATIONAL scaffold — keep as template, do not implement until GPU host exists. Aligns with Ollama/local-first goal.

## packages/ READMEs (existing monorepo packages — pre-v2 codebase)
- `packages/ai-core`: NLP (Arabic/English), intent recognition, task planning, model router, response generation. Status: Under Development.
- `packages/distributed`: data chunking/encryption, P2P comms, task orchestration, result aggregation, node management. Under Development.
- `packages/api/src/rbac`: 4-level role hierarchy (USER level 1 …) for fine-grained permissions.
- `packages/api/src/services/agents/REGISTRY_SUMMARY.md`: agent registry with 32 specialized agents in three-tier hierarchy, created 2026-11-01, "Complete and Validated".
- `packages/api/src/services/caching`: L1 memory + L2 Redis multi-layer cache.
- `packages/api/src/services/monitoring`: Prometheus + Winston + distributed tracing + health checks.
- `platform/services/mock-adapters`: single Fastify process (port 4100, `MOCK_ADAPTERS_PORT`) serving imported sub-projects as live endpoints keyed by id: 9router, openclaw, jarvis, webui, quant-mind, kimi-k2.5, biome, godmode.
- Verdict: EXISTING-CODEBASE reference — describes current apps/packages/services implementation, largely superseded by v2 architecture (Hermes + adapters) but mock-adapters pattern is relevant for external-runtime integration.

## skills/devops/ (3 SKILL.md — project-authored, NOT third-party)
- `architecture-review`: orchestrates architecture decisions through ADR workflow; gathers context → delegates to chief-architect for options → architecture gates → ADR doc. Enforces ask-before-write.
- `kanban-orchestrator`: feature orchestration epic→implementation→done across three-tier agent hierarchy; quality gates at checkpoints.
- `kanban-worker`: implements single story by delegating to specialist agent (api-developer, frontend-dev, ml-engineer); code-review + quality gates before done. Called by kanban-orchestrator.
- Verdict: PROJECT skills — these are the original "agent studio" orchestration skills. Candidates for deepening/mapping onto v2 A00–A15 crew and ultra-ai-builder plugin during skill-deepening step.

## infrastructure/automation/preservation.sh
- Bash tool proving no existing file lost/changed: `manifest <git-ref> <out>`, `verify-tag`, `verify-additive` (only added files between base..head). Exit 0 OK / 1 violation / 2 usage.
- Verdict: VERIFIED tooling — this is the enforcement mechanism for the additions-only rule during S2/S3. Will move to an ops/scripts location in post-verification reorg.
