---
description: Verify preservation baseline and additive-only changes.
---

# /ultra-verify

1. Identify baseline tag/manifest (e.g. `baseline/pre-planning-YYYYMMDD` or `PLANNING_BASELINE_c863ef8.sha256`).
2. Run `bash infrastructure/automation/preservation.sh verify-tag <tag> <manifest>`.
3. Run `bash infrastructure/automation/preservation.sh verify-additive <tag> HEAD`.
4. Report OK/FAIL with exact output; on FAIL list changed/deleted paths and issue an R2 card.
