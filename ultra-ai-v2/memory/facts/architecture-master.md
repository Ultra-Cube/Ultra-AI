# Facts — docs/MASTER_ARCHITECTURE.md (authoritative, 2026-10-31)

source: docs/MASTER_ARCHITECTURE.md | status: VERIFIED-GROUND-TRUTH (written from code read; supersedes conflicting docs per §8)

## Platform reality (as of doc date)
- Turborepo/npm-workspaces monorepo. Four ambitions ranked by realness:
  1. Working AI API + gateway (Fastify, auth/RBAC, model catalog, provider failover) — REAL, tested
  2. ZeroAI local-first assistant surface — real, demo-grade, NO auth
  3. Distributed processing network (P2P chunking/orchestration/rewards) — substantive code, NOT wired into API task path
  4. Blockchain reward layer — off-chain math only, NO deployed contract (aspirational)
- Monitoring layer = "Hermes" (Prometheus+Grafana+Alertmanager in monitoring/hermes + in-app page apps/web/app/hermes)
- scripts/ultra-stack.sh boots full system; ports: API 4000, Gateway 20129, Web 3000, Grafana 3001, Prometheus 9090
- 409 tests pass, 20/20 turbo tasks green (api 306, distributed 55, api-gateway 45, ai-core 3)

## Six-layer model
1 Experience: apps/web (Next.js 14, 5 pages), packages/desktop-ui (Electron stub)
2 Edge/ZeroAI: dual simple/operator mode, JSON state file, no auth; packages/voice-recognition (stub)
3 Intelligence: packages/ai-core (NLP/intent/planner/model-router), models.ts canonical catalog, providers OpenAI/Anthropic/Mock
4 Platform API: packages/api (Fastify+Prisma+RBAC, 44 src files), packages/api-gateway, packages/shared
5 Distributed/Rewards: packages/distributed (chunker, P2P, orchestrator, rewards — unwired); packages/memory-optimizer (stub)
6 Data & Ops: Postgres15+Prisma, Redis, monitoring/hermes, k8s/+Dockerfiles+ultra-stack.sh

## Model catalog (single source: packages/ai-core/src/models.ts)
- OpenAI: gpt-5, gpt-5-mini, gpt-4.1, gpt-4.1-mini, gpt-4o, gpt-4o-mini
- Anthropic: claude-opus-4.1, claude-sonnet-4.5, claude-haiku-4.5 (friendly ids → dated API ids via resolveAnthropicModel)
- Ollama local: llama3.1, mistral, codellama
- Default: gpt-5-mini; task affinity maps summarize/translate/analyze/generate/respond

## External integrations (adapters, not core deps)
OpenClaw (routing/control for ZeroAI, bridge scripts) | n8n (workflow backbone, proxy endpoints) | Ollama (local inference) | Grafana/Prometheus (Hermes, real) | Gata-OS (mock only) | JARVIS/QuantMind/Kimi (catalog entries)

## Reconciled plan (3-phase canonical — collapses 12/17/30-phase schemes)
- Phase 1 Core Infra: ZeroAI→Postgres + auth; gateway routing modes (quality/cost/latency/hybrid); CI pipeline
- Phase 2 Distributed: wire packages/distributed behind API task path; Redis task queue; node health/failover; perf targets <500ms p95, 1000+ concurrent
- Phase 3 Advanced: OWASP/security pass, GDPR/CCPA residency, Electron desktop, blockchain contract or formal descope

## Conflict resolutions (§8)
- "100% complete" claims FALSE — real vs stub vs unwired as listed above
- Phase count → 3-phase model canonical
- Test totals → 409 verified
- API port → 4000 (not 5555); Postgres → 15; web path → apps/web (not packages/web)
- Blockchain → off-chain only; PROJECT_PHASES_AND_STATUS.md superseded by this doc
