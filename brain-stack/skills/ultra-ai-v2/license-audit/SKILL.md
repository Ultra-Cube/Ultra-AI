---
name: license-audit
description: Audit third-party licenses before vendoring: check ULTRA_AI_LEGAL_LICENSING.md row is APPROVED; update THIRD_PARTY.md and SBOM; never ship BSL/non-commercial code.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Adding any third-party code, weights, or dependency to repo/installer/image.

## Procedure
1. Look up component row in ULTRA_AI_LEGAL_LICENSING.md.
2. If PENDING: row stays PENDING; do not vendor; raise card (replace / contact vendor / user-installed).
3. If APPROVED: vendor, update THIRD_PARTY.md + SBOM (CycloneDX).
4. Known traps: Skales BSL 1.1 (non-commercial until 2030-04-19 - never in product builds); n8n embed licensing; Dify single-tenant; Open WebUI edition limits.

## Verification
- License gate respected: nothing vendored while row is PENDING.
- THIRD_PARTY.md and SBOM updated per vendored component.

## References
- ULTRA_AI_LEGAL_LICENSING.md; fact F9

## Ultra-AI context
- Decision ADR-0002: Apache-2.0 license, tag v0.2.0-planning — overrides stale README MIT/1.0.0 claims.
- HARD BLOCKER F9: repo vendors Skales under BSL 1.1 (non-commercial until 2030-04-19) — must NEVER ship in a product build.
- License gate (directive 4): no third-party code before license row APPROVED + THIRD_PARTY.md entry + SBOM record. ULTRA_AI_LEGAL_LICENSING.md holds the matrix.
- ~124–125 Fadhel-SH upstream repos cataloged (external-integrations/) — each needs a license row before integration. Facts: ultra-ai-v2/memory/facts/planning.yaml (F9), ultra-ai-v2/memory/facts/docs-classification-batch4.md.
