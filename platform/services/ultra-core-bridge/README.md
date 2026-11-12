# @ultra-ai/ultra-core-bridge

Ultra Core bridge **readiness** package (spec §14, gate G-4.1). Ultra Core is a
separate project whose interface has **not yet been supplied** — this package
implements only the platform side: a signed, hash-chained `ultra.event.v1`
outbox plus an idempotent `ExportTarget` port and a mock connector for contract
tests.

## What it provides

| Module | Purpose |
|---|---|
| `types.ts` | `UltraEvent` (`schema: "ultra.event.v1"`), `ExportBatch`, `ExportResult`, `ExportTarget` port, `OutboxRecord`, `ChainVerification` |
| `signer.ts` | Ed25519 event signing (`node:crypto`), ULID generation, canonical JSON, `sha256` event hashing |
| `outbox.ts` | `EventOutbox` — append-only, hash-chained, tamper-evident log; optional JSONL persistence + reload |
| `exporter.ts` | `EventExporter` — drains pending events to targets in batches with per-target cursors and retry |
| `mock-target.ts` | `MockExportTarget` — records batches, dedupes by event id, simulates failures/rejections |

## Event shape

```json
{
  "schema": "ultra.event.v1",
  "id": "01J…ULID",
  "ts": "2026-11-12T…Z",
  "type": "usage.model_call",
  "subject": { "instance": "…", "agent": "…", "session": "…" },
  "payload": { },
  "prev_hash": "sha256:…",
  "sig": { "alg": "Ed25519", "key_id": "…", "value": "base64…" }
}
```

- `type` must match `usage.*`, `contribution.*`, or `provenance.*`.
- `prev_hash` chains to the previous event's `sha256` hash (`GENESIS_HASH` first).
- `sig` covers the canonical form of every field except `sig` itself.
- `verifyChain()` detects tampering: bad schema, broken `prev_hash` links,
  invalid signatures, and hash mismatches.

## ExportTarget contract (what Ultra Core must implement)

```ts
interface ExportTarget {
  readonly id: string;
  send(batch: ExportBatch): Promise<ExportResult>;
}
```

- **Idempotent**: re-sending the same `event.id` must not duplicate.
- Return `accepted` ids; the exporter advances its cursor only past the
  contiguous accepted prefix, so rejections and failures are retried safely.

## Usage

```ts
import { createEventSigner, EventOutbox, EventExporter, MockExportTarget } from '@ultra-ai/ultra-core-bridge';

const signer = createEventSigner({ keyId: 'instance-key-1' });
const outbox = new EventOutbox({ instanceId: 'desktop-01', signer, persistPath: './outbox.jsonl' });
const target = new MockExportTarget({ id: 'mock-ultra-core' });
const exporter = new EventExporter({ records: () => outbox.list(), targets: [target], batchSize: 100 });

outbox.append('usage.model_call', { agent: 'a1' }, { model: 'mock', tokens: 42 });
await exporter.flush();
console.log(outbox.verifyChain()); // { ok: true }
```

## Explicitly out of scope

Tokens, wallets, mining/rewards, smart contracts, chain nodes, private-key
custody — per the project decision, blockchain/cryptocurrency functionality is
deferred to later phases. Ed25519 keys here sign *events* only.

## Scripts

`npm test` · `npm run lint` · `npm run type-check` · `npm run build`
