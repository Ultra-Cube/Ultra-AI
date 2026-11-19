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

# @ultra-ai/memory-bridge (P1A-03)

Memory Bank ↔ Hermes memory bridge.

## Design

- **Memory Bank is the source of truth.** Records are stored once via a
  `BankAdapter` (payload + hash); the index holds only pointers, summaries,
  and metadata.
- **Pointers, not payloads.** `MemoryPointer` (`store` + `bankId` + optional
  sha256 hash) identifies bank content; Hermes receives materialized
  copies on demand and writes back through `rememberFromHermes`.
- **FTS index.** `FtsMemoryStore` provides dependency-free full-text search
  (tokenized inverted index, scope/kind filters, dump/load snapshots).
  `PgvectorStore` is the contract for an optional Postgres+pgvector backend
  with kNN `vectorSearch`.
- **Graceful degradation.** If the bank is unreachable, `recallForHermes`
  returns pointer-only records so Hermes can retry later.

## API

```ts
const bank = new MyBankAdapter(); // implements BankAdapter
const bridge = new MemoryBridge({ store: new FtsMemoryStore(), bank });

const pointer = await bridge.remember({
  scope: "project", kind: "decision",
  title: "Deploy freeze on Fridays",
  payload: { rule: "no deploys friday" },
});

const forHermes = await bridge.recallForHermes("deploy freeze");
await bridge.rememberFromHermes({ scope: "agent", kind: "episode", title: "...", payload });
```

## Tests

`npm test` — 7 tests covering tokenization/hashing, FTS search, scope/kind
filters, bank round-trip materialization, offline degradation, Hermes write
mirroring, and index snapshot round-trip.
