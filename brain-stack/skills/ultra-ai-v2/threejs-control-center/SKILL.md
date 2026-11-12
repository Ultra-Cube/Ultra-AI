---
name: threejs-control-center
description: Build 3D control-center visualizations for memory, skills, reasoning (mind), and orchestration using Three.js / React Three Fiber.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
3D views of brain/brain-stack/memory/planning/skills/agents in console.

## Ultra-AI context
- Requirement: useful 3D visualizations for memory, skills, reasoning/mind, and control functions — part of the ZeroAI professional/operator mode (command center).
- Tech direction: Three.js (repo has 3d-web-experience skill + threejs-* packs in .devin/skills for reference); render inside platform/frontend (Next.js 14) or desktop-ui surface.
- Data sources for viz: memory/facts + sources.jsonl (knowledge graph), agent registry (32 agents 3-tier), workflow traces (n8n run endpoints), model router decisions.
- Constraint: visualization is operator-facing — Simple mode stays clean; 3D center belongs to Professional mode. Facts: brain-stack/memory/planning/facts/system-arch-and-zeroai-stack.md, brain-stack/memory/planning/facts/docs-classification-batch4.md.
