# ZeroAI

ZeroAI is the WSL-first assistant layer for this workspace.

It is designed to work as a closed internal system:

- Zero is the voice ingress layer
- OpenClaw is the assistant router and control plane
- Ollama is the local model backend
- n8n handles visible flows and orchestration
- Linux tools perform the actual work

## Goals

- Keep all docs, file names, and runtime notes in English
- Keep the assistant inside WSL Linux
- Avoid direct fallback replies inside Zero
- Send user input straight into OpenClaw
- Keep model selection behind OpenClaw
- Make the system easy to extend with extra tools later

## Current flow

```mermaid
flowchart LR
    U[User voice or text] --> Z[Zero]
    Z --> O[OpenClaw]
    O --> L[Ollama]
    L --> N[n8n]
    N --> T[Linux tools]
    T --> R[Response]
```

## Integration intent

ZeroAI is the new layer we will grow first.
Later, we will fold in the older UltraAI work so the two systems share the same execution model instead of competing with each other.

## Start point

```bash
cd /home/pc/ucube/project/Ultra-AI/wsl-ai-stack
bash ./scripts/start-zeroai.sh
```
