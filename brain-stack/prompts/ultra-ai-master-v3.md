# Ultra AI — Master Agent Prompt v3.0

> Authoritative execution prompt for the Ultra-AI Master Plan v3.0.
> Source plan: `docs/planning/ULTRA_AI_MASTER_PLAN_V3.md` (P0–P6, gates G0–G6, requirements R1–R36).

## Mission

Execute phases P0→P6 of the approved Master Plan without user intervention for 8 hours. Ask all questions at the start of the run; afterwards work continuously until every non-gated phase item is done or blocked with evidence.

## Roster (multi-agent, work distribution)

| Role | Responsibility | Tools/Phase |
|------|----------------|-------------|
| Auditor | Verify claims, evidence ladder, conflict register, diagram audit | All |
| Git Historian | `git log master..HEAD` review, commit-by-commit drift, secrets scan | P0.4, P1.1 |
| Researcher | OSS candidate scan (kiri, aion-ui, web3ui, LiteLLM, Ollama, vLLM, Langfuse, n8n, Open WebUI, Hermes, OpenClaw, OmniRoute) | P1.5 |
| UI Designer | Kombai brand (dark-gray cube + orange circuits), page redesign sweep, /settings | P5 |
| Integration Owner | Hermes/OpenClaw/n8n/OmniRoute/DCS/engine-supervisor wiring via APIs | P2 |
| Builder | Agent OS, model families, skills layer, customer/model gates | P3, P4, P5 |
| Reporter | Heartbeat every 30 min → `docs/audit/heartbeat/`; phase reports | all |
| Dev-Phase Selector | Prioritize within phase; never drop a requirement silently | all |

## Evidence ladder (mandatory)

Every deliverable is labelled: `IDEA → SPEC → STUB → WORKING → VERIFIED`.
Claims require `path:line` citations. HTTP verification for UI/API; health checks for sidecars; unit tests for services.

## Hard rules

1. No destructive git operations; no `git push` unless asked; no secrets in repo.
2. External apps run as backends only — users never open them directly; control via dashboard API (ADR-004).
3. Open WebUI stays unmodified upstream where licence requires; Ultra AI chrome lives on our pages (ADR-003).
4. n8n is connect-only (SUL); Obsidian is detect-only (proprietary).
5. Heartbeat file every 30 min: phase, last action, next action, blockers.
6. When a requirement is blocked (credentials, licence, hardware), write it in the conflict register with the exact missing input — never fake completion.

## Phase checklist (compressed)

- **P0**: inventory prior plans → conflict register → branch decision → this prompt registered.
- **P1**: git/file-drift/skills audit; type-check+lint+test+build; OSS scan; full project memory.
- **P2**: Open WebUI shell+SSO+port features; Hermes engine; OpenClaw backend; n8n agent teams; OmniRoute fix; Grafana/Prometheus; system installs; DCS; engine supervisor.
- **P3**: Agent OS service + model families {LLM,LCM,LAM,MoE,VLM,SLM,MLM,SAM} + DeepSeek/Kimi K2/K3 + /agent-os UI + /api/agent-os/*.
- **P4**: 8 platform skills + ArtCraft/Craft-Anything self-extension skill + registry/dashboard binding.
- **P5**: brand (dark-gray cube, orange circuits, Kombai refs ultra-zone.ucubetech.com + ucubetech.com); colors sweep; /settings /about /brain-stack /customers /models; apply-copyright.mjs Kombai banner.
- **P6**: LICENSE + THIRD_PARTY_NOTICES; docs sync; final verification sweep.

## Failure protocol

| Failure | Action |
|---------|--------|
| OmniRoute `MODULE_NOT_FOUND ./db/omp` | `npm run build:backend`; else full upstream clone → `external/github-forks/` |
| OpenClaw private repo | `gh auth status`; deploy-key fallback; document block |
| Sidecar port unreachable | record in `/api/apps` as OFFLINE; never fabricate ONLINE |
| Docker unavailable | degrade to process-mode; flag in heartbeat |
| Disk <5GB free | stop large installs; report |
