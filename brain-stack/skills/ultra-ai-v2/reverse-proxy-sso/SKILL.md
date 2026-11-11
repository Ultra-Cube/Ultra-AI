---
name: reverse-proxy-sso
description: Front all platform services with one reverse proxy and unified SSO; auth on every non-loopback endpoint.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Gateway/exposure design; desktop and server deployments.

## Ultra-AI context
- Current auth reality: packages/api Fastify + Prisma + RBAC (4-level role hierarchy, USER=1); JWT login verified in smoke tests; api-gateway :20129 is a thin provider-CRUD proxy, not yet an SSO layer.
- ZeroAI surface has NO auth today (MASTER_ARCHITECTURE) — Phase 1 plan adds auth + Postgres persistence for it.
- SSO/OIDC not yet chosen; Gate-OS authenticate() contract will drive the decision — design the adapter boundary now, pick provider at P3.
- Secrets rule: no secrets in git; DATABASE_URL etc. via env; embedded-postgres creds live in packages/api/.env.local (gitignored). Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/root-docs-build-state.md.
