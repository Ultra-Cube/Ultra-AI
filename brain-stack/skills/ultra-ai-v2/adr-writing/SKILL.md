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

## Ultra-AI context
- Live ADR store: ultra-ai-v2/memory/decisions/ — ADR-0001 (Hermes Agent hybrid runtime), ADR-0002 (release tag + Apache-2.0), ledger.md indexes all G-0.x question-card decisions.
- Prime directive 10: "PLAN IS LIVING" — reality vs plan conflicts are resolved via ADR, never silent edits.
- Existing ADRs to respect: runtime hybrid (Hermes + Claude Code crew A00–A15); license = Apache-2.0 with v0.2.0-planning tag (overrides stale README MIT/1.0.0 claims).
- Question Cards: R0 log-only / R1 card+branch / R2 blocking — record decision, options, and Arabic one-liner. Facts: ultra-ai-v2/memory/facts/planning.yaml (F3, F5).
