---
name: sbom
description: Generate and maintain a CycloneDX SBOM per build; release notes list every bundled component + license.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Every build/release; dependency changes.

## Ultra-AI context
- SBOM is a license-gate artifact (directive 4): every third-party dependency needs license row APPROVED + THIRD_PARTY.md + SBOM entry before shipping.
- Known landmines: Skales BSL-1.1 vendored (never ship — F9); ~124 Fadhel-SH repos cataloged pending license review; .devin/skills ~2,269 packs already security-scanned (report at external/mdskills-catalog/security-scan-report.json, all triaged clean).
- Generate SBOM at release time (S3) — tooling not yet chosen (syft/npm sbom vs manual for vendored dirs).
- THIRD_PARTY.md does not exist yet — create during S3 planning release. Facts: brain-stack/memory/planning/facts/planning.yaml (F9), brain-stack/memory/planning/facts/docs-classification-batch4.md.
