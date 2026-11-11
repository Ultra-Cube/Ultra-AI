---
name: hermes-integration
description: Integrate Hermes Agent (Nous Research, MIT) as platform brain: persistent memory, skills, reasoning, orchestration, MCP, multi-platform gateway.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/packages/brain/ work; runtime decisions.

## Ultra-AI context
- ADR-0001 decision: Hermes Agent (NousResearch/hermes-agent, MIT) = foundational runtime — persistent memory, skills, reasoning, MCP, multi-agent orchestration. Claude Code = parallel crew member A00–A15.
- NAME COLLISION (F5): repo "Hermes" = Prometheus+Grafana monitoring stack (monitoring/hermes + apps/web/app/hermes) — completely different thing. Always qualify: "Hermes Agent" vs "Hermes monitoring".
- Integration surface: Hermes skills ← ultra-ai-v2/skills + plugin; MCP config .devin/mcp_config.json; memory bank ← memory/ tree; outbox events for Ultra Core bridge.
- Current state: planning only — no Hermes code integrated yet; S4 P1 platform core is where runtime work starts. Facts: ultra-ai-v2/memory/facts/planning.yaml (F5), memory/decisions/ADR-0001-runtime-hybrid.md.
