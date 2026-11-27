<!--
╔══════════════════════════════════════════════════════════════════════════╗
║   Ultra AI — Proprietary AI Platform                                     ║
║   Copyright (c) Ultra Cube Tech — ucubetech.com                          ║
║   Ultra Zone Team — ultra-zone.ucubetech.com                             ║
║   [UCUBETECH-COPYRIGHT]                                                  ║
╚══════════════════════════════════════════════════════════════════════════╝
-->
# T2 Value Layer — Design (NOT ENABLED)

**Status:** DESIGN ONLY — G-4.2 gate remains CLOSED pending written legal
opinion. Owner direction (2026-11-19): design T2 fully, do not activate any
on-chain/value code path. This document defines the target architecture so
implementation can start immediately once the legal gate clears.

## Scope

T2 is the value tier of the Ultra-Core contract (`contracts/ultra-core/`):
on-chain settlement of credits, tokenized rewards, and any transferable
value function. T0 (evidence/anchoring) and T1 (off-chain credits behind
approvals) are already mock-validated; T2 extends the same contract surface.

## Design principles (inherited)

- Contract-first: every T2 function lands in `contracts/ultra-core/openapi.yaml`
  (or a `contracts/ultra-core/t2/` extension package) BEFORE implementation.
- Approval-gated: every value movement requires `approval_ref` tracing to a
  recorded owner/studio approval (same rule as T1 reservations).
- Kill switch: `ULTRA_CORE_T2_ENABLED=false` default; even when implemented,
  T2 routes stay dark until legal + owner sign-off.
- Read-only by default: `ULTRA_CORE_READ_ONLY=true` refuses all T2 mutations
  client-side (already enforced for `/v1/credits/*`; extended to `/v1/value/*`).
- No silent value: every T2 operation emits a signed `ultra.event.v1` so the
  evidence chain covers value movements too.

## Proposed contract surface (draft, not in openapi.yaml yet)

| Endpoint | Purpose | Gate |
|---|---|---|
| `POST /v1/value/accounts` | Register a settlement account (chain address + custody ref) | approval_ref |
| `GET /v1/value/balances` | Read token/credit balances per account | T2 tier flag |
| `POST /v1/value/transfers` | Peer/platform transfer with memo + approval_ref | approval_ref + timelock |
| `POST /v1/value/rewards/issue` | Issue rewards to agents/customers | governance.policy_changed |
| `POST /v1/value/settle` | Settle a T1 reservation on-chain | settlement proof |
| `GET /v1/value/receipts/{id}` | Fetch on-chain receipt / tx hash | — |

All responses reuse the contract `Error` model; all writes are idempotent
(`Idempotency-Key` header, same as ingest).

## Component mapping

- `ultra-core-bridge`: new `value-client.ts` (typed, readOnly-aware),
  `value-receipts.ts` (receipt verification), outbox event types
  `value.transfer`, `value.reward_issued`, `value.settled`.
- `InboundReceiver`: accept `value.settled` / `value.rejected` callbacks;
  T2-tier callbacks currently dead-letter by design — the gate flips only
  after legal sign-off (single-line tier check behind a config flag).
- Ultra-Core side (their repo): chain adapters, custody, token contracts —
  Ultra-AI only consumes the contract.
- UI: `/credits` or `/value` surface showing balances/receipts; every
  mutation behind an explicit confirmation dialog (same pattern as the
  integrations API console `requiresConfirm`).

## Gates before ANY activation

1. G-4.2: written legal opinion (jurisdiction, custody, token classification,
   rewards taxation) — OWNER ACTION REQUIRED.
2. Contract extension merged into `openapi.yaml` + JSON Schemas reviewed.
3. Mock T2 endpoints implemented (no chain) + contract tests.
4. Staging canary on Ultra-Core testnet per QC-P4B-15 pattern.
5. `ULTRA_CORE_T2_ENABLED` env + per-agent spending caps extended to value.

## Explicit non-goals (until gates clear)

- No wallets, private keys, or seed phrases in this repo.
- No token contracts, mining, or transferable crypto features.
- No UI that moves value; read-only balance views only after contract freeze.
