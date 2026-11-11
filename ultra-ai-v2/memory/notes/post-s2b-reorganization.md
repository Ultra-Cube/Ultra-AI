# Post-S2b Reorganization Directive

**Status:** PENDING — applies after S2b completes and project verified working.

All content currently staged under `ultra-ai-v2/` is TEMPORARY. Once ingestion
finishes and the platform is confirmed working, redistribute into proper
root-level folders by purpose, consistent with existing repo structure:

- `docs/` — planning docs (ULTRA_AI_*.md, DOC_CONVERSION_MAP.csv), specs
- `platform/` — v2 runtime/code (G-0.5 decision: new tree beside legacy)
- `config/` — configuration assets
- agent/skill/plugin assets → their runtime-appropriate homes
- `memory/` + `diagrams/` → decide final home (likely under docs/ or platform/)

Constraints:
- Additions-only until `v0.2.0-planning` tag (preservation rule).
- Update all internal path references after the move.
- Re-run preservation verification after reorganization.
