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
name: agentic-ai
description: Agentic AI platform skill — multi-step autonomous workflows, tool orchestration, human-in-the-loop gates, and end-to-end task pipelines across Hermes, OpenClaw, and n8n.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
End-to-end autonomous workflows: research→plan→build→verify pipelines, scheduled agentic jobs, cross-service orchestration with approval gates.

## Ultra-AI context
- Orchestration surfaces: n8n (:5678) for durable scheduled workflows; Hermes teams (Dot/Muse/GrokBot/SkillTree/AnyModelBot) for agent roles; OpenClaw for background execution.
- Complements `agents` (team topology) and `ai-agent` (single-agent craft): this skill owns the pipeline — sequencing, gates, retries, rollbacks.
- Durable execution matters: use n8n workflows or queue-backed services, never fire-and-forget shell chains for multi-step jobs.
- Cost control: route each step through model-gateway family policy — cheap SLM for classification, LAM/LLM for reasoning, VLM/SAM for media tasks.

## Procedure
1. **Pipeline spec** — steps, inputs/outputs, success criteria per step, failure policy (retry/escalate/abort).
2. **Orchestrator choice** — n8n for visual/scheduled, code service for complex branching, agent team for role-based work.
3. **Gates** — human approval before irreversible actions; budget caps; data-classification checks per step.
4. **Observability** — per-step traces, cost ledger, heartbeat reports (R29); failures route to AnyModelBot-style review.
5. **Recovery** — idempotent steps or checkpointing; dead-letter queue for poison items.

## Guardrails
- No external services without owner approval (R34 — everything internal).
- Every pipeline versioned in git; n8n workflows exported as JSON artifacts.
- Kill switch per pipeline; global pause via engine supervisor.
