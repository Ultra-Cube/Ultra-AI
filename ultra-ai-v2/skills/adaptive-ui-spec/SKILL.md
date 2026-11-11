---
name: adaptive-ui-spec
description: Specify the adaptive, directly-interactive ZeroAI-style interface: chat surface that adapts to context, task, and user; spec before implementation.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/apps/console/ design (A09).

## Ultra-AI context
- Target: ZeroAI adaptive interface — role-aware workspaces (video-designer, developer, researcher, marketer, custom) driven by `AdaptiveWorkspaceProfile` TS interface (docs/architecture/system-architecture.md).
- Dual mode required: Simple (end users) + Professional/operator command center (routing, agent health, workflows, reasoning traces) — ai-os-blueprint.md.
- Telemetry-driven adaptation with manual overrides and safe rollback; UI stays ZeroAI-controlled even when Open WebUI is the render surface.
- Bilingual AR/EN from first screen (super-prompt directive 9). Facts: ultra-ai-v2/memory/facts/system-arch-and-zeroai-stack.md, ultra-ai-v2/memory/facts/wsl-stack-and-edge-arch.md.
