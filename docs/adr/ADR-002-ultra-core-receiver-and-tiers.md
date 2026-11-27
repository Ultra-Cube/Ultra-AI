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

# ADR-002: Ultra-Core as event receiver/publisher; tiered rollout T0/T1/T2

- **Status**: accepted (owner gates G-4.1 interface approved, G-4.2 T2 construction approved but contract-blocked)
- **Date**: 2026-11-19
- **Deciders**: owner (Fadhel Sh)
- **Tags**: P4B, ultra-core, contract-first, blockchain-boundary

## Context

Ultra-Core is a separate platform (blockchain-adjacent). Ultra AI must
integrate without taking custody of chain keys, wallets, tokens, mining,
or transferable value — and without blocking on a live endpoint that does
not exist yet. Owner direction 2026-11-17 fixed the roles: Ultra-Core is
the **receiver** of signed `ultra.event.v1` batches and the **publisher**
of signed `ultra-core.callback.v1` callbacks; Ultra AI is the
producer/readiness side only.

## Decision

1. **Contract-first boundary** — `contracts/ultra-core/` (OpenAPI 3.1 +
   JSON Schemas, `0.1.0-draft`) is the agreed interface (G-4.1). All
   producer code (`platform/services/ultra-core-bridge`) targets the mock
   (`ultra-core-mock`, port 4100) until a live endpoint is supplied and
   QC-P4B-15 is answered.
2. **Tiered rollout**:
   - **T0** evidence/provenance — default; ingest, anchoring, proofs,
     `anchor.confirmed` callbacks.
   - **T1** off-chain credits — balances/reservations behind explicit
     `approval_ref`; client-side `ULTRA_CORE_READ_ONLY` kill switch.
   - **T2** value/token/on-chain — **contract-blocked** by G-4.2 pending
     written legal opinion; `InboundReceiver` hard-rejects T2-tier
     callbacks and no T2 routes exist in the mock.
3. **Safety invariants**: Ed25519 signatures over canonical JSON;
   `Idempotency-Key == batch_id`; per-instance `prev_hash` chaining;
   callback payloads are data-only (never executed); logs redact
   secrets; `ULTRA_CORE_ENABLED=false` holds all batches in the outbox.

## Consequences

- Real Ultra-Core calls, T1 enablement, and any value-bearing function
  remain prohibited until the owner answers QC-P4B-15 / supplies the live
  contract. Mock validation (60/60 tests) is the current ceiling of
  evidence.
- Ultra-Core team implements exactly the `openapi.yaml` surface (see
  implementer checklist in `contracts/ultra-core/README.md` and
  `brain-stack/memory/ops/ultra-core-integration-status.md`).

## References

- `contracts/ultra-core/openapi.yaml`, `contracts/ultra-core/README.md`
- `brain-stack/memory/planning/decisions/ledger.md` (G-4.1, G-4.2)
- `brain-stack/memory/planning/decisions/question-cards.md` (QC-P4B-15)
- `brain-stack/memory/ops/ultra-core-integration-status.md`
