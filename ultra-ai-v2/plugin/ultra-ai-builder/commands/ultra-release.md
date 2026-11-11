---
description: Prepare the planning & study release — additions-only branch, tag, notes, bundle.
---

# /ultra-release

Prepare S3 release (requires owner approval — R2):
1. Confirm branch `release/planning-study` from baseline tag; only additions under ultra-ai-v2/, ultra-ai-v2/memory/, ultra-ai-v2/diagrams/, legal/, scripts/, manifests, PLANNING_RELEASE_NOTES.md.
2. Run verify-additive + verify-tag; both must be OK.
3. Draft PLANNING_RELEASE_NOTES.md: included artifacts, deliberately unchanged files, known gaps (F2 gitlinks, F3 no LICENSE/lockfile, F4 unverifiable tests, F9 Skales BSL), verification instructions.
4. Create git bundle backup; propose tag name per card G-0.2 (default `v0.2.0-planning`, pre-release).
5. Issue publish Question Card; do NOT push or publish without owner answer.
