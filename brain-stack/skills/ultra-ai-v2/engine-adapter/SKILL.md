---
name: engine-adapter
description: Implement adapters embedding open-source engines (OpenClaw, Ollama, 9router, n8n, Langflow, Dify, Open WebUI, OpenHands) behind Ultra-AI contracts.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/packages/engines/* work (A08).

## Ultra-AI context
- Adapter layers to build: provider adapters (OpenAI/Anthropic/Ollama/Mock exist in ai-core), engine adapters (Hermes Agent runtime, OpenClaw bridge, 9router gateway), tool adapters (n8n workflows, Linux tools, mock-adapters).
- Canonical model catalog: platform/backend/ai-core/src/models.ts — OpenAI gpt-5/4.1/4o family, Anthropic opus-4.1/sonnet-4.5/haiku-4.5 (friendly→dated id resolution), Ollama llama3.1/mistral/codellama; default gpt-5-mini.
- ModelGatewayPolicy routing modes: quality/cost/latency/hybrid via ProviderManager.selectOptimalProvider.
- External runtimes integrate as adapters, never core deps: OpenClaw (control), n8n (flows), Ollama (local), 9router (40+ providers gateway, RTK -40% tokens), Hermes Agent (new core runtime per ADR-0001). Facts: brain-stack/memory/planning/facts/architecture-master.md, brain-stack/memory/planning/facts/docs-classification-batch4.md.
