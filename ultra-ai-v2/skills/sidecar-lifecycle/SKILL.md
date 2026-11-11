---
name: sidecar-lifecycle
description: Manage embedded open-source engines (Ollama, OpenClaw, 9router, n8n, Langflow, Dify, Open WebUI, OpenHands) as supervised sidecars inside Ultra-AI.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Runtime supervisor work (platform/packages/runtime-supervisor/); engine lifecycle.

## Ultra-AI context
- services/mock-adapters: single Fastify :4100 serving imported sub-projects as live endpoints (9router, openclaw, jarvis, webui, quant-mind, kimi-k2.5, biome, godmode) — the existing sidecar pattern to generalize.
- embedded-postgres via pgtool (/opt/data/pgtool, db ultra_ai_dev) is the WORKING dev DB because Docker daemon unavailable + no sudo — docker-compose Postgres is secondary.
- ultra-stack.sh boots full system; ports API 4000 / Gateway 20129 / Web 3000 / Grafana 3001 / Prometheus 9090.
- Sidecar lifecycle rules needed: health endpoint, 1.5s probe timeout (existing convention), graceful degrade when absent (ZeroAI must work with sidecars down — offline-first). Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/root-docs-build-state.md, ultra-ai-v2/memory/facts/docs-classification-batch4.md.
