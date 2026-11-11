---
name: eval-harness
description: Build evaluation harness: reproducible benchmarks, LLM-as-judge where appropriate, regression detection, evidence files.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Model/agent quality gates; foundry evals; release checks.

## Ultra-AI context
- Verified baseline: 409 tests passing, 20/20 turbo tasks green (api 306, distributed 55, api-gateway 45, ai-core 3) per MASTER_ARCHITECTURE; BUILD_PLAN recorded 407 — drift of 2, re-verify before gating.
- F4 nuance: @ultra-ai/api's 306 tests were NOT independently verifiable without Prisma engine download — treat api test count as claimed, others as verified.
- Smoke suite: scripts/smoke-test.sh 8/8 PASS (register, JWT login, authed /ai/process, RBAC 401, /zeroai/message, /metrics, swagger, web→gateway proxy) — reuse as release gate.
- Stack: Vitest + turbo; run npm run test at root. Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/root-docs-build-state.md, ultra-ai-v2/memory/facts/planning.yaml (F4).
