---
name: test-strategy
description: Define test strategy per phase: unit/integration/contract/e2e, coverage >=80% lines for new packages, Playwright AR+EN smoke tests.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Planning tests for any package or phase (A14).

## Ultra-AI context
- Pyramid today: 409 unit/integration tests across turbo tasks (api 306*, distributed 55, api-gateway 45, ai-core 3) + scripts/smoke-test.sh 8/8 E2E smoke.
- *api 306 claimed-not-verified (Prisma engine); re-run with engine available before trusting.
- BUILD_PLAN Phase A verified: type-check 9/9, build 10/10 — keep these as PR gates alongside lint.
- v2 additions needing tests: outbox signing/ordering, adapter contract conformance, ZeroAI edge-gate escalation rules, i18n AR/EN rendering. Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/root-docs-build-state.md, ultra-ai-v2/memory/facts/planning.yaml (F4).
