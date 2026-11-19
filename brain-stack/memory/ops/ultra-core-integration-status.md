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

# Ultra-Core Integration — Status & Evidence Report (P4B-14)

Date: 2026-11-19 · Branch: `release/planning-study` · Status: **mock-validated, live calls prohibited**

## Scope

Ultra AI is the **producer/readiness** side of the Ultra-Core boundary:
signed, hash-chained `ultra.event.v1` outbox → idempotent batch export →
`ultra-core-ingest`; inbound signed `ultra-core.callback.v1` via SSE →
`InboundReceiver` → dead-letter + typed handlers. Ultra-Core is a **separate
platform** (receiver + publisher). Contract: `contracts/ultra-core/`
(`openapi.yaml` + 4 JSON Schemas), status `0.1.0-draft`.

## What exists and is verified

| Component | Path | Evidence |
|---|---|---|
| Event types / batch / target port | `platform/services/ultra-core-bridge/src/types.ts` | `tsc --noEmit` clean |
| Ed25519 signer + canonical JSON + ULID | `src/signer.ts` | `verifyChain()` tamper tests pass |
| Hash-chained append-only outbox (+JSONL persist) | `src/outbox.ts` | chain-break tests pass |
| Batched exporter, per-target cursors, retry | `src/exporter.ts` | retry-after-503 test passes |
| HTTP export target (real wire client) | `src/http-target.ts` | contract tests vs mock pass |
| Typed OpenAPI client (caps/reservations/registry/proofs, read-only default) | `src/core-client.ts` | 5 client tests; `ULTRA_CORE_READ_ONLY` blocks `/v1/credits/*` mutations |
| Mock Ultra-Core server (all OpenAPI paths, idempotency, prev_hash check, failure injection, SSE) | `src/mock-server.ts` | 17 contract tests |
| Inbound callback receiver (shape+sig+clock-skew+dedupe+T2 block+dead-letter) | `src/inbound-receiver.ts` | 10 tests |
| Typed callback handlers (anchor.confirmed, credits.balance_changed, governance.policy_changed, registry.item_revoked, approval.decided) | `src/callback-handlers.ts` | 4 tests |
| Ops surface: Prometheus metrics, redacting JSON logger, `ULTRA_CORE_ENABLED` kill switch | `src/ops.ts` + `http-target.ts` | 7 tests |
| E2E demo vs mock: usage.model_call → ingest → anchor → anchor.confirmed (SSE) → proof | `src/e2e-demo.test.ts` | passes locally |
| Env template | `.env.example` | documents all vars |
| Compose service `ultra-core-mock` :4100 | `infrastructure/docker/docker-compose.yml` | `docker compose config` valid |

Test totals: **60/60 jest tests passing** in `ultra-core-bridge`
(8 suites); `tsc --noEmit` and ESLint clean (4 pre-existing `any` warnings
in `ops.test.ts` mocks only).

## What Ultra-Core must implement (for the Ultra-Core team)

Exactly the surface in `contracts/ultra-core/openapi.yaml`:

1. `POST /v1/keys` — register producer Ed25519 public keys (`key_id`).
2. `POST /v1/ingest/batches` — accept `ExportBatch`; honour
   `Idempotency-Key == batch_id` (replay returns recorded result);
   verify per-event Ed25519 `sig` against registered keys; enforce
   per-instance `prev_hash` chaining; return `200`/`207` with
   `accepted[]`/`rejected[]` or `4xx/5xx` per error table.
3. `GET /v1/instances/{i}/head`, `GET /v1/proofs/{i}/{event_id}` —
   anchored head + inclusion proofs.
4. `GET /v1/events` — SSE stream of signed `ultra-core.callback.v1`
   envelopes (schema, callback_id, ts, nonce?, type, subject, payload,
   tier?, sig Ed25519 over canonical payload-minus-sig).
5. T1 credits (`/v1/credits/*`) — only behind explicit `approval_ref`;
   T2 value layer **MUST stay unimplemented** until G-4.2 legal opinion.
6. `GET /v1/registry/items` — revocable skill/key registry feed.

Callback `payload` is **data only** — receivers must not execute it.

## Gates still closed

- **G-4.1/R2 (P4B-15)**: first *real* Ultra-Core call requires owner
  Question Card answer + live endpoint/credentials. Everything above is
  mock-validated only.
- **G-4.2**: T2 (on-chain/value/tokens) blocked pending written legal
  opinion; `InboundReceiver` hard-rejects T2-tier callbacks; mock exposes
  no T2 routes.
- **T1 enablement**: credit mutations require `approval_ref` and are
  refused client-side under `ULTRA_CORE_READ_ONLY=true`.

## Known gaps / next

- DONE: real Merkle inclusion proofs (src/merkle.ts) — mock emits genuine
  proofs; CoreClient.verifyProof() does client-side leaf->root verify.
- DONE: T1 credits E2E vs mock (balance -> approval-gated reservation ->
  list; read-only guard). Settlement flow still open.
- DONE: per-agent spending-cap hook (withSpendingCap) + Gate-OS
  reachability doc + ops.ts metrics/redacting logger/kill switch.
- OPEN: settlement flow; clock-skew contract test; QC-P4B-15 owner
  answer before first live call; G-4.2 legal opinion before T2.
