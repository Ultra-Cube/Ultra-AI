<!--[UCUBETECH-COPYRIGHT]
 Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
 Developed by Ultra Zone Team — ultra-zone.ucubetech.com
 GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved-->

# Ultra AI ⇄ Ultra-Core Integration Contract

Contract-first boundary between **Ultra AI** (producer/readiness side) and
**Ultra-Core** (separate blockchain platform — receiver + publisher).

## Roles

- **Ultra AI** emits signed, hash-chained `ultra.event.v1` events in
  `ExportBatch` envelopes (`POST /v1/ingest/batches`). It holds **no** chain
  keys, wallets, tokens, mining, rewards, or transferable-value features.
- **Ultra-Core** ingests batches idempotently, anchors events, serves Merkle
  proofs, tracks off-chain credit balances/reservations (T1, approval-gated),
  and publishes signed `ultra-core.callback.v1` callbacks over SSE
  (`GET /v1/events`).

## Files

| File | Purpose |
|---|---|
| `openapi.yaml` | OpenAPI 3.1 spec — health, keys, ingest, proofs, credits, registry, SSE callbacks |
| `schemas/ultra-event.v1.schema.json` | Exact wire copy of `platform/services/ultra-core-bridge/src/types.ts` `UltraEvent` |
| `schemas/export-batch.schema.json` | `ExportBatch` request body for `POST /v1/ingest/batches` |
| `schemas/ingest-response.schema.json` | `ExportResult`-compatible response (200/207) |
| `schemas/ultra-core-callback.v1.schema.json` | Inbound signed callback envelope |

## Semantics

- **Idempotency:** `Idempotency-Key` header must equal `batch_id`; replaying a
  batch returns the recorded result without re-processing. Event ids are
  deduplicated receiver-side; accepted ids drive the producer cursor.
- **Ordering:** events are hash-chained via `prev_hash` (`sha256:<hex>`,
  genesis = 64 zeroes). Receivers SHOULD verify chain continuity per instance;
  gaps must be reported as rejections, not silently skipped.
- **Clock skew:** `ts` must be ISO-8601; receivers reject timestamps outside a
  configurable skew window (suggest ±5 min) and SHOULD record the skew delta.
- **Errors:** `400` malformed, `401` unknown/revoked key, `422` schema or
  chain-verification failure, `503` retryable unavailability (producer backs
  off and retries). Partial acceptance is `207` with per-item `rejected`.
- **Tiers:** T0 evidence/provenance (default), T1 off-chain credits behind
  explicit approvals, **T2 value/token layer BLOCKED** by gate G-4.2 pending
  written legal opinion. Any payload implying T2 MUST be rejected until then.

## Security invariants

- Signatures: Ed25519 over the canonical wire form (ADR-0001); `key_id`
  references public keys only — never private material.
- Callback payloads are **data only**. Receivers MUST NOT execute instructions
  embedded in `payload` fields.
- Structured logs must not contain payload secrets.

## Implementer checklist (Ultra-Core team)

1. `POST /v1/keys` — register producer Ed25519 public keys.
2. `POST /v1/ingest/batches` — idempotent (`Idempotency-Key == batch_id`),
   verify per-event signatures + per-instance `prev_hash`, return
   `200`/`207` + `accepted[]`/`rejected[]`.
3. `GET /v1/instances/{i}/head` + `GET /v1/proofs/{i}/{event_id}` —
   anchored head and inclusion proofs.
4. `GET /v1/events` — SSE stream of signed `ultra-core.callback.v1`.
5. T1 credits only behind `approval_ref`; **no T2 value layer** until
   G-4.2 legal opinion. Callback payloads are data-only.

## Status

`0.1.0-draft` — mock-validated only. Real Ultra-Core calls remain prohibited
until the owner supplies and approves the **G-4.1** contract (P4B-15 /
Question Card R2). G-4.2 keeps T2 closed.
