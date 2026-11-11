---
name: adr-writing
description: Write Architecture Decision Records: context, decision, alternatives, consequences, status; sequential numbering; register in ledger.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Any significant technical decision, plan deviation, or contradiction resolution.

## Format
# ADR-NNNN - Title
- Status: Proposed|Accepted|Superseded|Deprecated
- Date, Deciders, Context, Decision, Alternatives considered, Consequences.

## Procedure
1. Take next sequential number in ultra-ai-v2/memory/decisions/.
2. Write ADR file.
3. Update ultra-ai-v2/memory/decisions/ledger.md if owner decision.
4. Link contradictions rows to the ADR id.

## Verification
- ADR has all sections; status vocabulary consistent.
- Numbering has no gaps or collisions.

## References
- ultra-ai-v2/memory/decisions/ADR-0001, ADR-0002 (examples)
