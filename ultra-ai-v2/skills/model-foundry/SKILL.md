---
name: model-foundry
description: Model Foundry v0: orchestration + LoRA/distill pipeline + eval on GPU host; scope per card G-1.7 (default v0, not full RL).
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
platform/packages/foundry/ work (A11).

## Ultra-AI context
- Canonical catalog = packages/ai-core/src/models.ts (single source — do not fork lists): OpenAI gpt-5/gpt-5-mini/gpt-4.1/4.1-mini/4o/4o-mini; Anthropic claude-opus-4.1/sonnet-4.5/haiku-4.5 with friendly→dated id resolution; Ollama llama3.1/mistral/codellama; default gpt-5-mini.
- Task affinity map: summarize/translate/analyze/generate/respond → preferred models.
- Future lanes: Kimi-k2.5 alias (moonshot/Kimi-K2.5 via OpenClaw), AirLLM GPU lane for heavy models, config/brain scaffold for self-hosted OpenAI-compatible endpoint (GPU host required — scaffold only).
- Provider failover exists (OpenAI/Anthropic/Mock); 9router adds 40+ providers + auto-fallback. Facts: ultra-ai-v2/memory/facts/architecture-master.md, ultra-ai-v2/memory/facts/system-arch-and-zeroai-stack.md, ultra-ai-v2/memory/facts/docs-classification-batch4.md.
