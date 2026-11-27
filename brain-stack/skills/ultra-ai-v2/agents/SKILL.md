<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

---
name: agents
description: Agent platform skill — agent lifecycle, tool-use contracts, memory, multi-agent coordination patterns, and the Hermes/OpenClaw/n8n agent teams (Dot, Muse, GrokBot, SkillTree, AnyModelBot).
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Designing, spawning, or governing autonomous agents; wiring agent teams through Hermes + OpenClaw + n8n; adding tools or memory to an agent.

## Ultra-AI context
- Teams (R9): Dot = ongoing ops, Muse = personal assistant, GrokBot = AI team coordination, SkillTree = per-department teams, AnyModelBot = background code review. Defined in `platform/backend/hermes-runtime/src/teams.ts`.
- Runtime: Hermes Agent (:9119) + openai-bridge (:8642); OpenClaw (:18789) is the background backend assistant; n8n (:5678) triggers and schedules.
- Coordination: use `agent-coordination` / `multi-agent-patterns` patterns from `.devin/skills/` for swarm/topology decisions; prefer sequential pipelines for dependent steps.
- Governance: every agent action goes through the policy engine — model family routing, data-classification, and audit logging are non-negotiable.

## Procedure
1. **Role definition** — name, goal, tool scope, memory scope, escalation path.
2. **Tool contract** — explicit input/output schema; reject free-form tool descriptions.
3. **Memory** — short-term in context, long-term via brain-stack memory / AgentDB; never persist secrets.
4. **Coordination** — pick pattern: single agent / pipeline / orchestrator-worker / swarm; document the choice.
5. **Verification** — run `evals` skill against the agent's task suite; monitor via observability hooks.

## Guardrails
- Agents never bypass the model-gateway or policy engine.
- Human-in-the-loop required for destructive or external-side-effect actions.
- Heartbeat/observability reporting every cycle (R29 pattern).
