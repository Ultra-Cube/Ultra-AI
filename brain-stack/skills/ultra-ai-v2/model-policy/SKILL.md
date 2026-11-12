---
name: model-policy
description: Define and enforce model routing policy: which models for which tasks, cost/quality tiers, data-sensitivity rules, fallback chains.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Gateway routing; user-facing model selection; compliance.

## Ultra-AI context
- Routing contract: ModelGatewayPolicy modes quality/cost/latency/hybrid; ProviderManager.selectOptimalProvider picks backend.
- Selection rule (ZeroAI/MODEL_STACK): Ollama default for local WSL loop; OpenClaw = routing layer; swap model backend without changing ZeroAI contract; new providers only if they fit the same control contract.
- Edge-first: local resolve first, escalate to Ultra AI distributed/cloud only when needed — never bypass the control plane for direct model selection.
- Cost awareness: 9router claims RTK -40% token compression; omni-compression skills exist in .devin/skills for reference. Facts: brain-stack/memory/planning/facts/system-arch-and-zeroai-stack.md, brain-stack/memory/planning/facts/zeroai-architecture.md, brain-stack/memory/planning/facts/docs-classification-batch4.md.
