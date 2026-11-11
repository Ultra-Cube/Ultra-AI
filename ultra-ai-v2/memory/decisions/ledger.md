# Decision Ledger — Ultra-AI v2

Every owner answer to a Question Card is recorded here: id, date, choice, rationale.
Cards are issued by A00 (Lead Orchestrator); answers come only from the owner.

| ID | Date | Class | Question (short) | Choice | Rationale |
|----|------|-------|------------------|--------|-----------|
| G-0.1 | 2026-11-11 | R1 | Runtime executing the Crew A00–A15 | **Hermes Agent + Claude Code (hybrid)** | Brain/ultra-ai-v2/memory/skills built on Hermes Agent; Claude Code used for parallel implementation work. Highest flexibility. |
| G-0.2 | 2026-11-11 | R2 | Planning release tag name | **`v0.2.0-planning`** | Clearly marks a pre-experiment planning/study release; does not confuse product versioning. |
| G-0.3 | 2026-11-11 | R2 | License of Ultra AI code | **Apache-2.0** | Permissive open license with explicit patent grant; suitable for large infrastructure project. LICENSE file to be added in Phase 0 (post-baseline). |

| G-0.4 | 2026-11-11 | R1 | Hermes name collision (monitoring vs agent) | **Rename monitoring stack to Sentinel** (copy, keep old files) | Clear naming for Hermes Agent; old monitoring files preserved untouched. |
| G-0.5 | 2026-11-11 | R2 | Where new v2 code lives | **New `platform/` tree beside legacy** | Clean separation, preserves everything, dual maintenance during transition. |
| G-0.6 | 2026-11-11 | R2 | 5 orphan gitlinks | **Mirror forks into Ultra-Cube + add .gitmodules** (after release) | Recovers content; record SHAs in `external-integrations/_PINS.md` now. |
| G-0.7 | 2026-11-11 | R1 | Agent write-approval granularity | **Class-based R0/R1/R2 + protected paths for baseline/release** | Balances speed and safety; per-file approval on preservation-critical paths. |

## Pending cards
(none — G-0.x batch complete; next gates: G-1.x during P1, G-2.x desktop, G-3.x Gate-OS, G-4.x Ultra Core)

## Owner directive (2026-11-11) — post-S2b reorganization
- **Note:** All files under `ultra-ai-v2/` are temporary staging. After S2b finishes AND the project is verified working end-to-end, everything must be redistributed into proper root-level folders organized by purpose — e.g. docs folder, runtime/platform folder, config, etc. — matching the existing repo layout (`apps/`, `packages/`, `services/`, `docs/`, `config/`). `ultra-ai-v2/` must not remain as a permanent root directory.
- Recorded as pending gate: applies after S2 completion + S3 release verification.
