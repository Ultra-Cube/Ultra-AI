---
name: evidence-report
description: Produce work reports and phase-gate reports with commands, outputs, file paths and hashes. 'Done' requires evidence.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
After every task, daily digest, phase gate, or any completion claim.

## Procedure
Task report format: ID - owner - status - evidence (commands + outputs) - files changed - new risks - next.
Status words only: IDEAL, SPEC, STUB, WORKING, VERIFIED.
Phase gate: DoD checklist with evidence, open risks, go/no-go card.
Daily digest: Arabic summary + English table (board snapshot, pending decisions, risks).

## Verification
- Every claim cites a command and its output summary plus file paths.
- Environment limits marked 'UNVERIFIED - needs <env>'.

## Failure modes
- Claiming done without running commands; aspirational work described as implemented.

## References
- ULTRA_AI_SUPER_PROMPT.md App. B, section 3.4
