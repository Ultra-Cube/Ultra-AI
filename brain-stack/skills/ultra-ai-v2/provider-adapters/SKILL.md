---
name: provider-adapters
description: Build provider/model adapters for the gateway: OpenAI-compatible endpoints, DeepSeek, GLM, Kimi, Manus connector, 9router/OmniRoute routing.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/packages/gateway/ work (A07).

## Ultra-AI context
- Existing providers in ai-core: OpenAI, Anthropic, Mock — with failover; wired to POST /ai/process.
- Adapter inventory (external-integrations/, Aug 2026): 9router (40+ providers, priority 1), openclaw, JARVIS (OSINT), WebUI-desktop, quant-mind; services/mock-adapters Fastify :4100 serves them as live endpoints keyed by id with 1.5s health timeout.
- Hermes Agent becomes the primary runtime provider surface; Claude Code a parallel crew runtime — adapters normalize both behind engine-adapter contract.
- Local lane: Ollama (gemma4:latest default via OpenClaw), llama3.1/mistral/codellama in catalog; config/brain scaffold for future GPU host. Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/docs-classification-batch4.md, ultra-ai-v2/memory/facts/wsl-stack-and-edge-arch.md.
