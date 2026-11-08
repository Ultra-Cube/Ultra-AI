# Ultra-AI — Agent Guide

TypeScript monorepo (Turborepo): `apps/`, `packages/`, `services/`. Node >=20, npm workspaces.

## Commands
- Dev: `npm run dev` (turbo) | Build: `npm run build` | Test: `npm run test` | Lint: `npm run lint` | Type-check: `npm run type-check`
- Docker stack: `npm run docker:dev` / `docker:down`

## Agent Assets (mdskills.ai import)
- Skills: `.devin/skills/` (~780 SKILL.md packs) — invoke via `/name` or auto-trigger
- Subagents: `.devin/agents/` (architect, security-auditor, tdd-orchestrator, ...)
- Rules: `.cursor/rules/*.mdc` (TypeScript, Next.js, Node/Express, Vitest, +59 more; activation by globs/description)
- MCP: `.devin/mcp_config.json` (playwright, memory) + `.devin/mcp_config.local.json` (postgres — gitignored)
- Full catalog mirror (uninstalled reference): `external/mdskills-catalog/` — see its README/SETUP docs

## Conventions
- Follow existing patterns; verify with `npm run lint` + `npm run type-check` before done
- Database: Postgres (`DATABASE_URL`), Mongo, Redis via docker-compose
