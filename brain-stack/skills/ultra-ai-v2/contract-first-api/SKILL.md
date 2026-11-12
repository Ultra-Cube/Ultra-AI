---
name: contract-first-api
description: Define OpenAPI 3.1 / JSON Schema contracts in contracts/ before implementation; handoffs between agents go through contracts, never shared private code.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Any new public API, inter-package boundary, or agent handoff.

## Procedure
1. Write contract first in contracts/<domain>/ (OpenAPI 3.1 or JSON Schema).
2. Contract tests for every public API.
3. Agents integrate via contract only; version breaking changes.
4. Gate-OS contract: OpenAPI 3.1 + JSON Schema, owner = Gate-OS maintainers (G-3.1 pending).

## Verification
- Contract exists and validates before code merges.
- Contract tests pass in CI.

## Failure modes
- Code before contract; private shared code between packages; unversioned breaking changes.

## References
- ULTRA_AI_V2_TECHNICAL_SPEC.md; crew dispatch rules (super prompt section 4)

## Ultra-AI context
- Existing REST surface to extend, not replace: auth/*, ai/*, zeroai/* (6 endpoints: GET /zeroai/{state,memory,workflows}, POST /zeroai/message, POST /zeroai/workflows, POST /zeroai/workflows/:id/run), n8n/workflows CRUD+execute, network/*, user/* — system-architecture.md.
- Canonical ports: API 4000, Gateway 20129, Web 3000, Grafana 3001, Prometheus 9090 (MASTER_ARCHITECTURE.md; K8s+Dockerfile fixed from stale 5555).
- Gate-OS contract is a stable boundary: authenticate, syncUserPreferences, syncWorkspaces, pushNotifications, requestSystemResources — Gate-OS stays unchanged this scope.
- Ultra Core bridge: neutral signed-event outbox abstraction ONLY — no public Ultra Core spec exists (F10); do not fabricate its interface. Facts: brain-stack/memory/planning/facts/architecture-master.md, brain-stack/memory/planning/facts/system-arch-and-zeroai-stack.md.
