# ZeroAI Architecture

ZeroAI is the local assistant layer for the Ultra-AI workspace.
It is designed to run in WSL as a closed, offline-first system.

## Design goals

- Work without Internet access
- Keep the user-facing interface simple
- Route all decisions through a single control plane
- Reuse local device resources, applications, and workflows
- Preserve English-only project docs and file names
- Support memory, learning, and future improvements

## Layer model



## Core layers

### Voice UI

The user speaks to ZeroAI from a local interface.
This layer should stay simple and should not try to reason.

### Speech-to-text

This layer converts audio into text locally.
PocketSphinx is not accurate enough for the final system.
We will evaluate stronger offline/open-source options and keep the best fit.

### Brain and memory

ZeroAI needs a memory layer and a reasoning layer.
The memory layer stores conversation context, task history, and user preferences.
The brain layer decides whether to answer, delegate, trigger a tool, or escalate.

### OpenClaw

OpenClaw remains the control plane and router.
It receives the cleaned text input and chooses the model or action path.

### Model layer

Ollama is the default local generation path.
AirLLM is a future optimization lane for heavier models or better resource control.

### Workflow layer

n8n is the visible automation backbone.
It handles repeatable tasks, workflow execution, and system orchestration.

### Tools and applications

ZeroAI may use local applications and system tools when a task needs action.
The assistant should be able to open apps, process files, and invoke local utilities.

## Recommended open-source candidates

- Speech-to-text: Whisper, faster-whisper, Vosk
- Memory: Mem0, Qdrant, SQLite-backed memory
- UI: Open WebUI, a custom lightweight desktop/web launcher
- Workflow: n8n
- Voice assistant base: OpenVoiceOS
- Local model runtime: Ollama, AirLLM

## Integration principle

ZeroAI should remain the top-level assistant entry.
UltraAI stays the larger ecosystem and can be merged where it adds value.
If UltraAI diagrams or components need adjustment, they should be adapted to the new ZeroAI control flow rather than copied blindly.
