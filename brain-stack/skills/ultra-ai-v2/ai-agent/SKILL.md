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
name: ai-agent
description: AI Agent platform skill — single-agent design patterns, ReAct loops, tool use, planning, reflection, and reliable task completion for production agents.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Building a single autonomous agent that plans, uses tools, and completes multi-step tasks reliably.

## Ultra-AI context
- Distinct from `agents` (which covers teams/coordination): this skill is the single-agent craft — loop design, tool schemas, stopping conditions.
- Runtime targets: Hermes profiles, OpenClaw background tasks, n8n AI Agent nodes, or custom services in `platform/services/`.
- Model routing: agent loops should pin a model family per role (e.g., LAM for agentic coding per Kimi K2 entry) via model-gateway policy, not hardcode model names.
- Reliability: compounding error rates kill agents — cap steps, verify each tool result, and escalate rather than retry-loop forever.

## Procedure
1. **Task decomposition** — break goal into verifiable subtasks with explicit done-criteria.
2. **Loop choice** — ReAct (reason+act) for exploration, Plan-Execute for known procedures, Reflexion for self-correction.
3. **Tool design** — small, typed, idempotent tools; rich descriptions; sandboxed execution.
4. **Memory** — working memory in context; episodic memory via brain-stack; entity memory via knowledge graph when needed.
5. **Stopping rules** — max steps, max cost, max time; explicit success check before declaring done.
6. **Observability** — trace every step (observe-trace pattern); feed failures into `evals`.

## Guardrails
- Every tool call passes policy engine checks.
- No silent retries on side-effecting tools — verify state first.
- Agent must state uncertainty; never fabricate tool results.
