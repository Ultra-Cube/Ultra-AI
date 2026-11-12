# Ultra-AI v0.3.0-planning — Post-Migration Planning Release

**Type:** pre-release (planning/study). Not a product release — documents the reorganized repository.
**Date:** 2026-11-12
**Release branch:** `release/planning-study`
**Supersedes:** `v0.2.0-planning` (planning corpus + skills release, 2026-11-11)
**Baseline:** `baseline/pre-planning-20261111` → commit `c863ef8` (unchanged)

## What this release contains

The repository was physically reorganized into the seven-tree layout declared in
[`docs/planning/layout-map.yaml`](../planning/layout-map.yaml) (WP-0 migration + WP-0b conformance).
Unlike v0.2.0, this phase **moved and renamed** paths, so integrity is proven by
`verify-moves --post` (**58/58 moves, 0 violations**) rather than `verify-additive`.

| Phase | Commits | Content |
|-------|---------|---------|
| WP-0 STEP1–5 | `cbcfc9c` … `6f0d286` | Root docs → `docs/`; monorepo → `platform/`; docker/k8s/scripts/monitoring → `control/` + `infrastructure/`; `.env.example` → `environments/`; `release-assets/` gitignored |
| WP-0 verify fix | `4279d8b` | `verify-moves --post` diffs git tree against pre-move base `1507dcc` |
| WP-0 path rewrite | `96d0423` | workspaces, tsconfig extends, Docker/K8s manifests, 172 files rewritten; lint 9/9 + type-check 10/10 + build/test 21/21 green |
| WP-0b conformance | `6421532` | ~35 missing placeholders created; `brain-stack/{agents,commands,hooks,mcp,rules}` added; `brain-stack/memory/ops/` created with `project-map.md`; 9 empty legacy dirs removed; 33 duplicate skills deduplicated from plugin |
| Docs | `593e024` | README: post-migration layout tree, section functions, brain-stack memory/skills table |

## New canonical roots

```text
brain-stack/   platform/   control/   environments/
distribution/  infrastructure/   docs/   external/
```

See README §"Repository Layout" and `brain-stack/memory/ops/project-map.md` for the full map.

## What is deliberately unchanged / deferred

- No application behavior changed; all moves are path-level.
- `platform/database` is a placeholder — `platform/backend/core-api/prisma` move deferred
  (requires `package.json` Prisma path updates).
- `external-integrations/` and `wsl-ai-stack/` remain outside the declared layout
  (reference / local-ignored areas).
- `infrastructure/Test/` uses uppercase `T` per the owner-supplied path map.
- Blockchain/crypto/token layers remain deferred (architectural prep only, per owner decision).
- Gate-OS untouched — integration via stable contract only.

## How to verify

```bash
# migration integrity: every pre-move file present at its new path
bash infrastructure/automation/preservation.sh verify-moves moves.tsv --post 1507dcc   # 58 rows; residual flags are self-rows + WP-0b plugin dedup (see below)

# toolchain health post-rewrite
npm run lint        # 9/9 tasks, 0 errors
npm run type-check  # 10/10 tasks
npm run test        # 21/21 tasks incl. Next.js build

# baseline corpus still intact (v0.2.0 additions preserved)
bash infrastructure/automation/preservation.sh verify-tag HEAD PLANNING_BASELINE_c863ef8.sha256
```

## Post-WP-0b verify-moves residual flags (expected, not data loss)

Re-running `verify-moves --post 1507dcc` after WP-0b reports 20 flags, all explained:

- **17 × `SRC-STILL-EXISTS`** — `moves.tsv` contains identity rows (`src == dst`,
  e.g. `platform/frontend → platform/frontend`) generated for directories already
  in place; the checker flags them because src still exists (it *is* dst).
- **1 × `FILESET-DIFF` on `ultra-ai-v2/plugin → brain-stack/plugin`** — WP-0b
  intentionally deduplicated the plugin mirror: the 16 `agents/a*.md` now live in
  `brain-stack/agents/` and the 33 skills in `brain-stack/skills/ultra-ai-v2/`
  (verified 0 missing). Plugin retains `plugin.json`/`AGENTS.md`/`README.md` only.
- **2 × `WARN-DST-EXTRA`** — files added post-move (plugin README, frontend sources).

## Known gaps carried forward

- All v0.2.0 gaps (LICENSE file, plugin clean-sandbox check, P0-07b deep-reads).
- WP-2 `monitoring/sentinel` not yet implemented.
- S4 phased build (P1 platform core → P4 Ultra Core bridge) pending.
