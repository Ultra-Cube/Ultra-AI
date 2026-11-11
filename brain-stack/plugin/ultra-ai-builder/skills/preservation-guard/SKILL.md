---
name: preservation-guard
description: Additive-only changes before the planning tag; run infrastructure/automation/preservation.sh manifest/verify-additive/verify-tag; never rewrite history.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Before every merge on release/planning-study; any time baseline integrity is questioned.

## Procedure
1. Pre-tag: only add files under new directories (ultra-ai-v2/, ultra-ai-v2/memory/, ultra-ai-v2/diagrams/, legal/, scripts/).
2. Baseline: bash infrastructure/automation/preservation.sh manifest HEAD baseline.sha256 (read-only).
3. Gate: bash infrastructure/automation/preservation.sh verify-additive baseline/pre-planning-YYYYMMDD HEAD must print 'OK ... 0 changed, 0 deleted'.
4. Prove tag intact: verify-tag baseline/pre-planning-YYYYMMDD baseline.sha256.
5. Violations: stop, issue R2 card (revert / archive under docs/archive/ / accept with ADR). Never push --force, filter-repo, or delete .git.
6. Backups: git bundle create ultra-ai-<date>.bundle --all before S3 and each phase gate.

## Verification
- verify-additive = OK; manifest covers gitlinks separately.

## Failure modes
- Editing existing files pre-tag; force-push; deleting baseline files.

## References
- ULTRA_AI_SUPER_PROMPT.md sections 1, 8; infrastructure/automation/preservation.sh
