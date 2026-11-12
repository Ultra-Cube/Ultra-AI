---
name: signed-event-outbox
description: Neutral signed hash-chained event outbox preparing future Ultra Core export: events signed, chained, exportable; platform holds no chain keys.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/packages/ultra-core-bridge/ (A13), built in P1 as prep hooks.

## Ultra-AI context
- Purpose: neutral signed-event outbox abstraction bridging Ultra-AI → Ultra Core — the ONLY allowed integration shape until Ultra Core's interface/spec is known (F10: no public info exists; must come from owner).
- Design constraints: sign every event (Ed25519 precedent exists in repo skills — witness/trader-backtest use it), ordering + idempotency keys, no Ultra-Core-specific fields leak into the schema.
- Gate-OS and Hermes Agent are the near-term consumers of the same outbox pattern — design once, reuse.
- Do NOT fabricate Ultra Core API surface; mark all Core-facing contracts UNVERIFIED until owner provides spec (Question Card R2 candidate). Facts: brain-stack/memory/planning/facts/planning.yaml (F10), brain-stack/memory/planning/facts/system-arch-and-zeroai-stack.md.
