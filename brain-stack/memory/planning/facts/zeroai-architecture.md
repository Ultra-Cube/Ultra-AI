# Facts — wsl-ai-stack/ZeroAI/* (vision docs, pre-implementation)

source: wsl-ai-stack/ZeroAI/ARCHITECTURE.md + siblings | status: ASPIRATIONAL-DESIGN (target architecture, not yet built)

## ZeroAI design goals
- Closed, offline-first assistant layer for the Ultra-AI workspace in WSL
- Simple user-facing interface; all decisions through single control plane
- Local device resources/apps/workflows; English-only docs
- Memory, learning, future improvements

## Layer model (mermaid flow)
User voice/text → Voice UI → Speech-to-Text → Brain+Memory → OpenClaw (control plane/router — MUST NOT be bypassed by direct model selection) → Model Layer / Workflow Layer / Tools / Ultra AI Cloud Bridge → Response

## Component decisions
- UI: Open WebUI (fastest polished) or LocalAI-centered custom surface; ZeroAI-controlled UX
- STT: PocketSphinx rejected (inaccurate); candidates Whisper, faster-whisper, Vosk
- Memory: Mem0, Qdrant, or SQLite-backed memory
- Model runtime: Ollama default; AirLLM future optimization lane for heavy models; local serving optional/replaceable behind same interface
- Workflow: n8n visible automation backbone
- Voice assistant base candidate: OpenVoiceOS
- UltraAI = distributed platform ZeroAI escalates to; edge handles local first, escalates only when needed
- Principle: adapt UltraAI diagrams/components to ZeroAI control flow, don't copy blindly

## NOTE vs Hermes decision (ADR-0001)
This doc predates the Hermes-Agent-as-runtime decision. OpenClaw-as-control-plane and Ollama-default-model-layer here are SUPERSEDED-in-direction by Hermes Agent runtime + hybrid plan; ZeroAI UX goals, offline-first stance, and escalation principle remain valid inputs.
