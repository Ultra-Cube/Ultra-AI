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
3. Record every answer in brain-stack/memory/planning/decisions/ledger.md (id, date, choice, rationale).
4. Never repeat an answered card; never ask free-form 'what should I do?'.

## Verification
- Card follows the exact template in ULTRA_AI_SUPER_PROMPT.md section 3.2.
- Answer logged in ledger before work resumes.

## Failure modes
- Asking without options; repeating answered cards; treating R2 as R1.

## References
- ULTRA_AI_SUPER_PROMPT.md sections 3.1-3.4

## Ultra-AI context
- Protocol from super-prompt: NEVER STOP SILENTLY — ambiguous points become Question Cards with options, not guesses.
- Tiers: R0 (log to memory/contradictions.md, continue) / R1 (card + continue on a branch) / R2 (blocking — must be answered before proceeding).
- Precedent: G-0.1–G-0.7 cards all answered with recommended options and recorded in memory/decisions/ledger.md.
- Cards are bilingual: English body + one-line Arabic summary (directive 9).
- Use for: scope ambiguity, license gates, port conflicts (known: n8n 5678 vs JARVIS 5678 — F11), naming collisions (monitoring "Hermes" vs Hermes Agent — F5). Facts: brain-stack/memory/planning/facts/planning.yaml.
