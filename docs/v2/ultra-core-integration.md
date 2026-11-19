# Ultra Core integration environment (P4B)

Status: WORKING (mock-validated) — contract-first design implemented in `platform/services/ultra-core-bridge` + `contracts/ultra-core/`; no live Ultra-Core calls (QC-P4B-15 pending).
Scope: T0 evidence/provenance, T1 off-chain credits behind approvals, T2 BLOCKED by G-4.2.
Sources: `brain-stack/workflows/ULTRA_AI_TODO.md` P4B; `docs/v2/technical-spec.md` §14; `ultra-ai-blockchain-prompt.md` Appendix A.

## Diagram index

- A1 — System context: `brain-stack/memory/diagrams/blockchain_ultra-core-integration__1.mmd`
- A2 — Event lifecycle (outbound): `brain-stack/memory/diagrams/blockchain_ultra-core-integration__2.mmd`
- A3 — Ingest sequence (idempotent ExportTarget over HTTP — PROPOSED binding): `brain-stack/memory/diagrams/blockchain_ultra-core-integration__3.mmd`
- A4 — Metered task with credits and human approval (Tier 1): `brain-stack/memory/diagrams/blockchain_ultra-core-integration__4.mmd`
- A5 — Trust boundaries and key custody: `brain-stack/memory/diagrams/blockchain_ultra-core-integration__5.mmd`
- A6 — Rollout tiers and legal gate: `brain-stack/memory/diagrams/blockchain_ultra-core-integration__6.mmd`
- A7 — Ultra-Core ingest data model (SPEC): `brain-stack/memory/diagrams/blockchain_ultra-core-integration__7.mmd`
- A8 — Ultra AI side: modules to build for sending and receiving: `brain-stack/memory/diagrams/blockchain_ultra-core-integration__8.mmd`

Note: diagrams are SPEC. Items marked PROPOSED need an ADR before implementation. `provenance.approval` is PROPOSED.

## A1. System context

```mermaid
flowchart LR
  subgraph UA["Ultra AI platform"]
    BRAIN["Hermes brain, memory, skills"]
    GW["Model gateway"]
    AGN["Agents network and approvals"]
    UI["Console and ZeroAI adaptive UI"]
    OUT["Signed event outbox<br/>ultra-core-bridge"]
    INB["Inbound receiver<br/>webhooks and event stream"]
  end
  subgraph UC["Ultra-Core"]
    ING["Ingest API<br/>ExportTarget"]
    VER["Verifier<br/>signature and hash chain"]
    IDR["Identity registry"]
    LED["Credits ledger<br/>off-chain first"]
    REG["Provenance registry"]
    ANC["Anchor service<br/>Merkle roots"]
    GOV["Governance"]
    EVS["Event publisher"]
  end
  CH["Own ledger or self-hosted chain nodes"]
  BRAIN --> OUT
  GW --> OUT
  AGN --> OUT
  OUT -->|"ultra.event.v1 batches"| ING
  ING --> VER
  VER --> IDR
  VER --> LED
  VER --> REG
  VER --> ANC
  ANC --> CH
  GOV --> LED
  LED --> EVS
  REG --> EVS
  ANC --> EVS
  GOV --> EVS
  EVS -->|"signed callbacks"| INB
  INB --> AGN
  INB --> UI
```

## A2. Event lifecycle (outbound)

```mermaid
flowchart TB
  A["Action in Ultra AI<br/>model call, tool call, skill publish, memory snapshot"] --> B["Build event<br/>schema ultra.event.v1, ULID, ts, subject, payload"]
  B --> C["Canonical JSON"]
  C --> D["Sign Ed25519<br/>instance key, key_id"]
  D --> E["Append to outbox<br/>prev_hash links to previous event"]
  E --> F["Exporter drains in batches<br/>per-target cursor"]
  F --> G["Ultra-Core ingest"]
  G --> H{"Valid?"}
  H -->|"yes"| I["Stored, deduped by event id"]
  H -->|"no"| J["Rejected with reason<br/>retried or quarantined"]
  I --> K["Batch Merkle root"]
  K --> L["Anchored<br/>receipt returned by callback"]
```

## A3. Ingest sequence (idempotent ExportTarget over HTTP — PROPOSED binding)

```mermaid
sequenceDiagram
  autonumber
  participant EX as EventExporter (Ultra AI)
  participant API as Ingest API (Ultra-Core)
  participant VER as Verifier
  participant LOG as Event log
  participant ANC as Anchor service
  EX->>API: POST /v1/ingest/batches (Idempotency-Key, events)
  API->>VER: authenticate instance, resolve key_id
  VER->>VER: verify Ed25519 signature per event
  VER->>VER: verify prev_hash continuity per instance
  alt all valid
    VER->>LOG: append, dedupe by event id
    API-->>EX: 200 accepted ids
  else some rejected
    API-->>EX: 207 accepted ids plus rejected with reasons
    Note over EX: cursor advances only past the contiguous accepted prefix
  else transient failure
    API-->>EX: 503
    Note over EX: retry with backoff and the same Idempotency-Key
  end
  LOG->>ANC: periodic batch Merkle root
  ANC-->>EX: callback anchor.confirmed with proof reference
```

## A4. Metered task with credits and human approval (Tier 1)

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant C as Console
  participant AG as Agent
  participant GW as Model gateway
  participant OB as Outbox
  participant CR as Ultra-Core credits ledger
  U->>C: set spending cap for agent
  C->>CR: PUT /v1/credits/caps (signed by user session)
  AG->>CR: POST /v1/credits/reservations (estimate, task id)
  alt within cap
    CR-->>AG: reservation granted
  else over cap
    CR-->>C: approval required
    C->>U: approval request
    U-->>C: approve or deny
    C->>CR: decision recorded
  end
  AG->>GW: run model call
  GW->>OB: usage.model_call event (signed)
  OB->>CR: delivered through ingest
  CR->>CR: settle reservation against actual usage
  CR-->>C: callback credits.balance_changed
  C-->>U: updated balance and trace link
```

## A5. Trust boundaries and key custody

```mermaid
flowchart LR
  subgraph UAZ["Ultra AI zone: holds NO chain keys"]
    AGS["Agents and skills"]
    SIG["Event signer<br/>instance Ed25519 key in OS keychain or vault"]
    OBX["Outbox"]
    AGS --> OBX
    SIG --> OBX
  end
  subgraph GATE["Control gate"]
    POL["Policy and allow-list"]
    HUM["Human approval for any value movement"]
    KILL["Kill switch and spending caps"]
  end
  subgraph UCZ["Ultra-Core zone: only place with chain keys"]
    API["Authenticated API<br/>scoped JWT or mTLS"]
    CUS["Key custody and signing service"]
    LDG["Ledger and chain adapters"]
  end
  OBX -->|"events only"| API
  API --> POL
  POL --> HUM
  HUM --> CUS
  KILL --> API
  CUS --> LDG
  AGS -. "no path" .-x CUS
```

## A6. Rollout tiers and legal gate

```mermaid
stateDiagram-v2
  [*] --> T0
  state "T0 Evidence layer: identity, event ingest, anchoring, provenance registry" as T0
  state "T1 Off-chain credits: non-transferable metering, caps, approvals" as T1
  state "T2 Value layer: transferable tokens, marketplace payments, rewards" as T2
  T0 --> T1: owner confirms interface G-4.1
  T1 --> T2: written legal opinion G-4.2
  T2 --> [*]
```

## A7. Ultra-Core ingest data model (SPEC)

```mermaid
erDiagram
  INSTANCE ||--o{ EVENT_LOG : emits
  INSTANCE ||--o{ AGENT_IDENTITY : hosts
  AGENT_IDENTITY ||--o{ CREDIT_ACCOUNT : owns
  CREDIT_ACCOUNT ||--o{ CREDIT_ENTRY : records
  ANCHOR_BATCH ||--o{ EVENT_LOG : includes
  REGISTRY_ITEM ||--o{ EVENT_LOG : referenced_by
  INSTANCE {
    string id PK
    string key_id
    string public_key
    string status
  }
  AGENT_IDENTITY {
    string id PK
    string instance_id FK
    string scopes
    string status
  }
  EVENT_LOG {
    string id PK
    string instance_id FK
    string type
    string prev_hash
    string hash
    string anchor_batch_id FK
    datetime ts
  }
  ANCHOR_BATCH {
    string id PK
    string merkle_root
    string chain_ref
    datetime anchored_at
  }
  CREDIT_ACCOUNT {
    string id PK
    string agent_id FK
    decimal cap
    decimal balance
  }
  CREDIT_ENTRY {
    string id PK
    string account_id FK
    string event_id FK
    decimal amount
    string kind
  }
  REGISTRY_ITEM {
    string id PK
    string kind
    string content_hash
    string signer_key_id
    string version
  }
```

## A8. Ultra AI side: modules to build for sending and receiving

```mermaid
flowchart TB
  subgraph BR["platform/services/ultra-core-bridge"]
    TY["types.ts<br/>UltraEvent, ExportTarget"]
    SGN["signer.ts"]
    OBX["outbox.ts"]
    EXP["exporter.ts"]
    MOCK["mock-target.ts"]
    HTTP["http-target.ts NEW<br/>HttpExportTarget"]
    INBR["inbound-receiver NEW<br/>verify, dedupe, dispatch"]
    CLI["core-client NEW<br/>caps, reservations, registry, proofs"]
  end
  MS["mock Ultra-Core server NEW<br/>implements the OpenAPI contract"]
  CT["contract tests NEW<br/>run against mock and later real"]
  OA["contracts/ultra-core/openapi.yaml NEW<br/>outbound and inbound"]
  OA --> HTTP
  OA --> INBR
  OA --> CLI
  OA --> MS
  EXP --> HTTP
  HTTP -->|"batches"| MS
  MS -->|"signed callbacks"| INBR
  CT --> MS
  CT --> HTTP
  CT --> INBR
```

## A9. Event type to Ultra-Core capability map

| Event type (ultra.event.v1) | Emitted by | Ultra-Core capability | Tier |
|---|---|---|---|
| `usage.model_call` | model gateway | metering, credit settlement, audit anchoring | T0 anchor, T1 settle |
| `usage.tool_call` | agents network | audit anchoring, spending caps | T0 |
| `contribution.compute` | device mesh (re-scoped) | contribution record only; rewards disabled | T0 record, T2 reward |
| `provenance.skill_published` | skill registry | signed provenance registry | T0 |
| `provenance.memory_snapshot` | Memory Bank | content-hash anchoring | T0 |
| `provenance.approval` (PROPOSED) | approvals inbox | human-approval evidence | T0 |
| Inbound `credits.balance_changed` | Ultra-Core | update console and agent budgets | T1 |
| Inbound `anchor.confirmed` | Ultra-Core | attach proof to traces | T0 |
| Inbound `governance.policy_changed` | Ultra-Core | update gateway policy parameters, with timelock | T1 |
| Inbound `registry.item_revoked` | Ultra-Core | disable revoked skill or key | T0 |
