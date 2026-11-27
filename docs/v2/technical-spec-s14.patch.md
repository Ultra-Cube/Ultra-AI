<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
║                                                                          ║
║ Project   : Ultra AI — Proprietary AI Platform                           ║
║ Developer : Ultra Cube Tech — ucubetech.com                              ║
║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
║ GitHub Org: github.com/Ultra-Cube                                        ║
║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
║ [UCUBETECH-COPYRIGHT]                                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

# Proposed patch — `docs/v2/technical-spec.md` §14

Do **not** apply directly to the baseline spec until the owner approves the P4B contract-first direction. This file is the proposed replacement for the current §14 body.

## 14. Ultra Core bridge (readiness only; blockchain deferred)

**Principle:** Ultra AI stays the producer/readiness side. It emits signed, hash-chained `ultra.event.v1` batches through `platform/services/ultra-core-bridge`; Ultra Core is the external receiver. Ultra Core may publish signed `ultra-core.callback.v1` callbacks; Ultra AI verifies them in an inbound receiver. The platform never holds user private keys, wallets, tokens, mining/rewards, smart contracts, or transferable-value features.

**Rollout tiers**
- **T0 — evidence/provenance:** signed events, audit anchoring, trace proofs, registry/revocation handling. No value movement.
- **T1 — off-chain credits:** balance/ceiling/reservation callbacks may update budgets and console state only behind explicit approvals and kill-switch controls.
- **T2 — value/token layer:** BLOCKED by `G-4.2` until a written legal opinion exists.

**Contracts before code**
- `contracts/ultra-core/openapi.yaml` — OpenAPI 3.1 for outbound ingest/proofs/credits/registry/health and inbound `ultra-core.callback.v1` + SSE.
- `contracts/ultra-core/schemas/ultra.event.v1.json` — exact copy of the bridge event schema.
- `contracts/ultra-core/schemas/ultra-core.callback.v1.json` — callback schema.
- Error model, idempotency keys, ordering/cursor rules, clock-skew window, tier marks, and T2 blocked responses are part of the contract.

**Implementation order**
1. Mock Ultra Core implementing the contract, plus `ultra-core-mock` compose service.
2. `HttpExportTarget implements ExportTarget`: batching, `Idempotency-Key`, contiguous-prefix cursor, backoff, offline queue, TLS/mTLS options, env `ULTRA_CORE_BASE_URL` / `ULTRA_CORE_AUTH_*` / `ULTRA_CORE_ENABLED=false`.
3. `InboundReceiver`: Ed25519 signature verify, timestamp window, nonce/callback-id dedupe, JSON Schema validation, internal event bus, dead-letter store; never executes instructions contained in payloads.
4. Contract tests `npm run test:core-contract` against the mock before any real endpoint is enabled.

**Not built:** tokens, wallets, mining/rewards, smart contracts, chain nodes. Legacy `platform/backend/distributed` is re-scoped to device mesh first; no “private by chunking” claim. Any token/crypto feature requires a written legal opinion first (`G-4.2`).
