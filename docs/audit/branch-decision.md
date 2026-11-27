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

# P0.4 — Branch Review & Decision

> Date: 2026-11-21 · Decision owner: project lead (Ultra Cube Tech)

## Current state

- Active branch: `release/planning-study`
- Ahead of `origin/master`: **206 commits**, 0 behind
- Working tree: modified submodule pointers (`control/{distribution,environments,infrastructure,platform}`), modified infra/distribution scripts, plus new untracked plan/memory files from this run

## Assessment

`release/planning-study` is the de-facto integration branch — all S/P-phase work, UI sprint, bridge work, and prior checkpoint commits live here and nowhere else. `origin/master` is stale relative to it.

## Decision

**CONTINUE on `release/planning-study`.** Rationale:

1. It is the only branch containing the verified work (206 commits ahead).
2. v3 plan phases P0–P6 build directly on this state; branching now would fork the integration line.
3. Per-phase `feat/pN-*` branches will be cut FROM this branch and merged back, keeping history linear-ish.

## Conditions / follow-ups

- C-015: dirty submodule pointers must be reviewed (`git diff` inside each submodule) before the next commit batch — they may be intentional local changes or stale checkouts.
- Before any push: confirm remote tracking and tag strategy (ADR-0002 release-tag-license governs).
- `master` should NOT be fast-forwarded without owner approval — it is the release line.

## Alternatives considered

| Option | Rejected because |
|--------|------------------|
| New `release/v3` branch | Would orphan 206 commits of verified context; reconciliation maps to this branch |
| Merge to `master` now | Release line decision belongs to owner; premature |
