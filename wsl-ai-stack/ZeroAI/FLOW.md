# ZeroAI Flow

## Main routing

```mermaid
sequenceDiagram
    participant User
    participant Zero
    participant OpenClaw
    participant Ollama
    participant n8n
    participant Tools

    User->>Zero: Speak or type a request
    Zero->>OpenClaw: Forward the raw input
    OpenClaw->>Ollama: Choose or call the model
    Ollama->>n8n: Provide plan or response context
    n8n->>Tools: Execute workflow or shell step
    Tools-->>OpenClaw: Return result
    OpenClaw-->>Zero: Send answer text
    Zero-->>User: Speak or print the answer
```

## Rules

- Zero should not answer from canned fallback phrases
- Zero should act like a transport layer
- OpenClaw should decide how to route each request
- Ollama should generate the text response
- n8n should stay visible and reusable
- Everything should stay WSL-local unless we explicitly add a bridge

## Future expansion

- Add more tools only when they clearly fit the same control path
- Keep each new tool behind OpenClaw instead of hard-wiring it into Zero
- Preserve a single English naming scheme across scripts and docs
