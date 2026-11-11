---
description: Run the phase gate checklist — DoD evidence, preservation verify, go/no-go card.
---

# /ultra-gate

Run a phase gate for the current phase:
1. Collect DoD items from `ULTRA_AI_TODO.md` for the phase.
2. For each item, verify evidence exists (command outputs, file paths, hashes) — mark VERIFIED or GAP.
3. Run `bash scripts/preservation.sh verify-additive <baseline-tag> HEAD` (or verify-tag pre-release).
4. List open risks and pending Question Cards.
5. Issue a go/no-go Question Card to the owner with the evidence summary.
