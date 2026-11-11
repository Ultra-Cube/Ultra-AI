# Ultra-AI v0.2.0-planning — Planning & Study Release

**Type:** pre-release (planning/study). Not a product release — no runtime code is shipped.
**Baseline:** `baseline/pre-planning-20261111` → commit `c863ef8`
**Release branch:** `release/planning-study`

## What this release contains

All changes are **additions only** — zero existing files were modified, deleted, or renamed
(verified by `scripts/preservation.sh verify-additive`: 236 files added, 0 changed, 0 deleted).

| Area | Path | Contents |
|------|------|----------|
| Planning artifacts | `ULTRA_AI_*.md`, `DOC_CONVERSION_MAP.csv`, `PLANNING_BASELINE_*.sha256` | Super prompt, TODO, technical spec, legal/licensing, master plan, doc map, sha256 baselines |
| Project skills | `ultra-ai-v2/skills/` | 33 domain skills with Ultra-AI project context (Hermes, providers/engines/tool adapters, signed-event outbox, Gate-OS contract, 3D control center, packaging, SBOM, threat model, i18n/RTL, …) |
| Builder plugin | `ultra-ai-v2/plugin/ultra-ai-builder/` | `plugin.json`, 33 mirrored skills, 16 agents (A00–A15), 4 commands, hooks (preservation-guard), `.mcp.json`, `AGENTS.md` |
| Memory bank | `ultra-ai-v2/memory/` | Facts corpus (7 files), decisions ledger (ADR-0001/0002 + G-0.1–G-0.7), glossary, contradictions (C-001…), timeline, `sources.jsonl` (122 entries), `coverage.md`, notes |
| Diagram registry | `ultra-ai-v2/diagrams/` | 116 extracted `.mmd` files + `graphs/registry.json` + `graphs/index.md` |
| Tooling | `scripts/preservation.sh` | Manifest / verify-tag / verify-additive preservation checker |

## What is deliberately unchanged

- All pre-existing source, docs, config, `apps/`, `packages/`, `services/`, `wsl-ai-stack/`,
  `external-integrations/`, `monitoring/` content — byte-identical to baseline.
- `package.json` versions stay `0.1.0`; LICENSE/NOTICE/README fixes are deferred to Phase 0
  on a normal branch (ADR-0002).
- One known-invalid Mermaid block preserved untouched in its source doc (F11 handling).

## Source ingestion status (S2)

- Corpus: 113 project `.md` files per `DOC_CONVERSION_MAP.csv` (+ companion files = 122 ledger entries).
- `sources.jsonl`: 46 deeply read (`done`), 72 head-scanned/classified (`partial`), 4 mechanical.
- Mermaid: 116 fences found and extracted (plan estimated 117 — deviation recorded; the
  `docs/ux-design/user-journeys.md` block was recovered manually).

## Known gaps (carried into Phase 0+)

- F2/F3/F4/F9 repo-state gaps per `ULTRA_AI_TODO.md` (CI greenness, LICENSE file, stale docs).
- P0-07b backlog: agent deep-read of mechanically-extracted docs (ux, product, code-docs, history, business).
- Plugin clean-sandbox install and manifest-format check still UNVERIFIED (P0-05).
- No LICENSE file yet; license matrix + `THIRD_PARTY.md` placeholder only (P0-11).
- External gitlinks mirrored per `_PINS.md`; mirror execution awaits owner credentials (P0-12).
- Blockchain/crypto layers intentionally deferred to later phases (architectural prep only).

## How to verify

```bash
# additions-only proof (run from repo root)
bash scripts/preservation.sh verify-additive baseline/pre-planning-20261111 HEAD
# expect: "OK: 236 files added, 0 changed, 0 deleted" (count may grow with this file)

# baseline integrity: every baseline file unchanged at this tag
bash scripts/preservation.sh verify-tag HEAD PLANNING_BASELINE_c863ef8.sha256
# expect: "checked N entries, violations: 0"

# diagram registry completeness
ls ultra-ai-v2/diagrams/*.mmd | wc -l        # 116
node -e "console.log(require('./ultra-ai-v2/diagrams/graphs/registry.json').length)"  # 116
```

## Decision record

- Runtime: Hermes Agent core + Claude Code parallel agent (ADR-0001, G-0.1).
- Tag name `v0.2.0-planning`, license Apache-2.0 planned (ADR-0002, G-0.2/G-0.3).
- All G-0.x question cards answered 2026-11-09/11 — see `ultra-ai-v2/memory/decisions/ledger.md`.
