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

<!--
╔══════════════════════════════════════════════════════════════════════════╗
║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
║ Project: Ultra AI · Developer: Ultra Cube Tech · Team: Ultra Zone Team  ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

# Copilot Instructions — Ultra AI

TypeScript monorepo (Turborepo, npm workspaces). See `AGENTS.md` for the full
guide — this file is the short version for GitHub Copilot.

## Layout
- `platform/` — frontend (Next.js), backend (`core-api`, :4000), api, shared, services, devtools, apps
- `brain-stack/` — skills, prompts, memory, workflows (file-backed; managed via `/api/brain-stack/*`)
- `contracts/` — Ultra Core contract package (openapi.yaml + JSON Schemas; interface of record, G-4.1)
- `docs/` — plans, ADRs, runbooks (`docs/MASTER_AGENT_PROMPT.md` is the 8h orchestrator spec)
- `external-integrations/` — pinned upstream apps (Hermes, OmniRoute, n8n, Open WebUI, Grafana, Obsidian); embedded as sidecars, never vendored
- `infrastructure/` — docker-compose, systemd units

## Commands
- Dev: `npm run dev` · Build: `npm run build` · Test: `npm run test` · Lint: `npm run lint` · Type-check: `npm run type-check`
- Stack: `npm run docker:dev` / `docker:down`

## Rules that matter
- **Honest states** — never fabricate service availability; offline/degraded UI states are required, not bugs.
- **Gates** — no live Ultra-Core calls or T1 until owner provides endpoint+credentials (QC-P4B-15); T2 value layer stays disabled pending G-4.2 counsel sign-off.
- **Upstream apps** — pin versions, keep update path open, never fork their code into our tree.
- **Secrets** — never commit; `.env.example` only.
- **Commits** — conventional: `type(scope): description`.
- **Baseline-locked docs** — archive-and-replace, never silent edits.
- Verify with `npm run lint` + `npm run type-check` before declaring done.
