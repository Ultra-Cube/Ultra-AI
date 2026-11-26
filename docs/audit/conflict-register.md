# P0.3 — Conflict Resolution Register

> Date: 2026-11-21 · Status: ACTIVE — new conflicts append here.

| ID | Conflict | Resolution | Status |
|----|----------|------------|--------|
| C-001 | Hermes vs Open WebUI dashboard authority | ADR-004: Hermes engine/dashboard backend, Open WebUI UI shell; external apps backend-only via API | RESOLVED (recorded in plan §3) |
| C-002 | OmniRoute `MODULE_NOT_FOUND ./db/omp` in `open-sse` | Try `npm run build:backend`; else full upstream clone into `external/github-forks/`; defer to P2.5 | OPEN → P2 |
| C-003 | Docker availability | RESOLVED 2026-11-21: Docker Desktop host integration works; Grafana/Prometheus unblocked | RESOLVED |
| C-004 | `next-env.d.ts` banner stripped on `next dev` regen | Auto-generated file; banner script re-stamps on next run | ACCEPTED |
| C-005 | Health route fallback shape could be misread as gateway-up | Verified: true-down returns `offline` + `offline:true`; honest rendering | CLOSED |
| C-006 | `vlab` ASCII corruption in reports | Fixed `23595f9c`+`cc32817d`; zero matches repo-wide | CLOSED |
| C-007 | UI sprint work untracked in old plan | Merged as P1G in reconciliation; carried into v3 P5 | CLOSED |
| C-008 | OpenClaw private repo (`fadhel-sh`) | Deploy via authenticated clone/`gh`; document in P2.3; blocked → register here | OPEN → P2 |
| C-009 | n8n SUL licence vs redistribution | Connect-only sidecar; never vendored | RESOLVED (policy) |
| C-010 | Obsidian proprietary | Detect-only; never auto-installed | RESOLVED (policy) |
| C-011 | airllm `int8-quantize` patched | File present; verify runtime in P2.7 | OPEN → P2 |
| C-012 | T2 value layer vs G-4.2 legal sign-off | Design-only (`docs/T2_VALUE_LAYER_DESIGN.md`); not enabled | BLOCKED (owner) |
| C-013 | QC-P4B-15 Ultra-Core URL+creds | Awaiting owner input | BLOCKED (owner) |
| C-014 | Engine supervisor static 10-service catalog | Needs Hermes/OpenClaw/n8n added as real engines (P2.8) | OPEN → P2 |
| C-015 | Dirty submodule pointers (`control/{distribution,environments,infrastructure,platform}`) | Pre-existing local state; review before any commit/push | OPEN → P0.4 |
