# Ultra-AI — Agent Guide

TypeScript monorepo (Turborepo): `apps/`, `packages/`, `services/`. Node >=20, npm workspaces.

## Commands
- Dev: `npm run dev` (turbo) | Build: `npm run build` | Test: `npm run test` | Lint: `npm run lint` | Type-check: `npm run type-check`
- Docker stack: `npm run docker:dev` / `docker:down`

## Agent Assets (mdskills.ai + GitHub imports)
- Skills: `.devin/skills/` (~2,269 SKILL.md packs (mdskills.ai + GitHub forks import)) — invoke via `/name` or auto-trigger
- Subagents: `.devin/agents/` (architect, security-auditor, tdd-orchestrator, ...)
- Rules: `.cursor/rules/*.mdc` (TypeScript, Next.js, Node/Express, Vitest, +59 more; activation by globs/description)
- MCP: `.devin/mcp_config.json` (playwright, memory) + `.devin/mcp_config.local.json` (postgres — gitignored)
- GitHub fork skills: also merged into `.devin/skills/` from `external/github-forks/` (antigravity-awesome-skills, everything-claude-code, OfficeCLI, NemoClaw, OmniRoute, GitNexus, Understand-Anything, agentshield, clawhub, colibri, Edge0, airllm, rtk, open-code-review, obsidian-mind, Gnosis, ruflo, higgsfield-ai/skills). Repos kept for reference in `external/github-forks/` (gitignored).
- Security: `external/mdskills-catalog/security-scan-report.json` covers both imports; all flagged hits triaged — findings are security-tooling examples/docs or false positives, no active malicious content. `loki-mode` deleted.

## Conventions
- Follow existing patterns; verify with `npm run lint` + `npm run type-check` before done
- Database: Postgres (`DATABASE_URL`), Mongo, Redis via docker-compose
