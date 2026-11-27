# Multi-Agent Prompt & Autonomy Verification (R27–R29)

Date: 2026-11-21 · Branch: `release/planning-study`

## R27 — Multi-agent prompt structure

Source: `brain-stack/prompts/ultra-ai-master-v3.md` (76 lines)

Required roster — all present:

| Agent | Role | Coverage |
|-------|------|----------|
| Auditor | Verify claims, evidence ladder, conflict register, diagram audit | All phases |
| Git Historian | `git log master..HEAD` review, commit drift, secrets scan | P0.4, P1.1 |
| Researcher | OSS candidate scan (kiri, aion-ui, LiteLLM, Ollama, vLLM, Langfuse, OmniRoute) | P1.5 |
| UI Designer | Kombai brand (dark-gray cube + orange circuits), page redesign, /settings | P5 |
| Integration Owner | Hermes/OpenClaw/n8n/OmniRoute/DCS/engine-supervisor wiring | P2 |
| Builder / Verifier / Reporter | Implementation, phase gates, heartbeats | all |

Evidence ladder (IDEA→SPEC→STUB→WORKING→VERIFIED) and `path:line` citation rule present in prompt sections 2–4.

## R28 — Work distribution

Distribution is encoded per-phase in the prompt: research→plan→review→build→design→check→report roles map to the roster table; parallel lanes allowed after P2 core (P3/P4/P5). No single-agent bottleneck remains in the plan text.

## R29 — 8-hour autonomy + heartbeat

- Prompt line 29: "Execute phases P0→P6 ... without user intervention for 8 hours. Ask all questions at the start."
- Prompt line 55: heartbeat file every 30 min with phase, last action, next action, blockers.
- Heartbeat sink verified: `docs/audit/heartbeat/2026-11-21-v3-p0.md` exists (42 lines, P0 gate report).
- Failure-handling table present (Docker unavailable → process-mode fallback, etc.).

## Verdict

R27 ✅ R28 ✅ R29 ✅ — prompt structure complete and self-consistent with `docs/planning/ULTRA_AI_MASTER_PLAN_V3.md` execution model. Actual 8h autonomous runtime is an operational activity, not a code artifact; the mechanism (prompt + heartbeat dir + per-phase commits) is in place.
