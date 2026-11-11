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
