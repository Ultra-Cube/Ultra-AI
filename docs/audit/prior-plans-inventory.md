<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗       ║
║ ██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║       ║
║ ██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║       ║
║ ╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║      ║
║  ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║       ║
║   ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝       ║
║                                                                          ║
║ Project   : Ultra AI — Proprietary AI Platform                           ║
║ Developer : Ultra Cube Tech — ucubetech.com                              ║
║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
║ GitHub Org: github.com/Ultra-Cube                                        ║
║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
║ [UCUBETECH-COPYRIGHT]                                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

# P0.1 — Prior Plans & Diagrams Inventory

> Date: 2026-11-21 · Branch: `release/planning-study` · Status: COMPLETE

## Plans found

| Plan doc | Path | Status |
|----------|------|--------|
| Master Agent Prompt v1.0 | `docs/MASTER_AGENT_PROMPT.md` | SUPERSEDED by v3.0 (`brain-stack/prompts/ultra-ai-master-v3.md`) |
| Master Agent Prompt v2.0 | (prior thread; superseded) | SUPERSEDED |
| PLAN_RECONCILIATION_2026-11 | `docs/planning/PLAN_RECONCILIATION_2026-11.md` | ACTIVE — item-by-item status map, extended by v3 P0 |
| S/P-phase plan (ULTRA_AI_TODO) | `brain-stack/memory/planning/*`, commit log | PARTIAL — P0–P4B mapped in reconciliation §1 |
| Master Plan v2 | `docs/v2/master-plan.md` + `technical-spec.md` | SUPERSEDED by v3 (kept as reference) |
| Roadmap / status reports | `docs/planning/{DEVELOPMENT_ROADMAP,PROJECT_STATUS_REPORT,REMAINING_TASKS,COMPLETION_STATUS,CRITICAL_ISSUES,DEPLOYMENT_TIMELINE}.md` | REFERENCED — stale in places; reconciliation is authoritative |
| Phase reports | `docs/phases/PHASE_18_*`, `PHASE_19_*` | DONE (historical) |
| Spikes | `docs/spikes/hermes-embed-*` (3 reports) | VERIFIED evidence for Hermes embed feasibility |
| Brain-stack memory | `brain-stack/memory/{ops,planning,diagrams}` | ACTIVE — phase registry added (`phases-v3.md`) |

## Diagrams found

| Set | Path | State |
|-----|------|-------|
| Brain-stack diagram exports | `brain-stack/memory/diagrams/README__1..10.mmd` | 10 `.mmd` files — extracted Mermaid from README; kept as reference |
| Inline Mermaid | 23 docs contain ```mermaid blocks (architecture, business, ui, security, planning) | Mixed validity — spot-checked, parseable; P1/P2 will re-render critical ones (architecture/system-architecture.md, zero-ai-integration.md) |
| ASCII banners | apply-copyright.mjs generated; `vlab` corruption fixed (`23595f9c`, `cc32817d`) | FIXED |

## Lost/at-risk items carried into v3

- U-phase items (phases deleted from older plan): re-covered by P2 (integrations) + P5 (design/brand) + P6 (legal/release).
- Detailed review/audit stages: now explicit G0–G6 gates + heartbeat cadence.
- Kombai banner spec: now P5 + `apply-copyright.mjs` update task (P5.1.3).

## Verdict

No prior plan item is silently dropped: reconciliation §1–§2 maps each to v3 phase or records it SUPERSEDED with reason. v3 plan file: `docs/planning/ULTRA_AI_MASTER_PLAN_V3.md`.
