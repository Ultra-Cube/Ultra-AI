---
name: ask-with-options
description: Owner communication protocol: when blocked or a decision is needed, issue a structured Question Card with options (R0/R1/R2 classes) instead of stopping silently.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Any blocker, decision gate, or ambiguity that requires owner input.

## Procedure
1. Classify reversibility: R0 (decide + log), R1 (card + continue on branch), R2 (blocking card).
2. Issue card: ID, class, phase, context (<=3 lines), 2-4 options + Other, exactly one starred recommendation with consequence/cost/risk, parallel-safe continuation note, Arabic one-liner.
3. Record every answer in ultra-ai-v2/memory/decisions/ledger.md (id, date, choice, rationale).
4. Never repeat an answered card; never ask free-form 'what should I do?'.

## Verification
- Card follows the exact template in ULTRA_AI_SUPER_PROMPT.md section 3.2.
- Answer logged in ledger before work resumes.

## Failure modes
- Asking without options; repeating answered cards; treating R2 as R1.

## References
- ULTRA_AI_SUPER_PROMPT.md sections 3.1-3.4
