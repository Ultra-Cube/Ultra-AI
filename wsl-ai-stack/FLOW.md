# Ultra AI Flow

## Main control flow

```mermaid
flowchart LR
    U[User] --> I[Speech or typed prompt]
    I --> B[Voice bridge]
    B --> A[OpenClaw agent]
    A --> M[Model provider]
    M --> P[n8n planner]
    P --> T[Linux tools]
    T --> R[Result]
```

## Full execution path

```mermaid
sequenceDiagram
    participant User
    participant VoiceBridge
    participant OpenClaw
    participant Model
    participant n8n
    participant Tools

    User->>VoiceBridge: Speak or type a task
    VoiceBridge->>OpenClaw: Transcript or prompt
    OpenClaw->>Model: Select answer route
    Model->>n8n: Produce plan or intent
    n8n->>Tools: Run shell, file, or workflow step
    Tools-->>OpenClaw: Return output
    OpenClaw-->>VoiceBridge: Response text
    VoiceBridge-->>User: Speak or print result
```

## Layer contract

- OpenClaw is the assistant control plane.
- The model layer is swappable behind OpenClaw.
- n8n makes tool use visible and repeatable.
- Linux tools remain the execution surface.

## Current WSL path

1. Text or WAV enters the voice bridge.
2. The bridge transcribes with PocketSphinx or forwards typed text.
3. OpenClaw routes the request to the configured model alias.
4. n8n can receive the plan and trigger shell work.
5. The result returns to the console or TTS.

## Sample commands

- `bash ./scripts/openclaw-bridge.sh "..."`
- `bash ./scripts/voice-bridge.sh --sample --speak-response`
- `bash ./scripts/setup-n8n.sh --start`
- `bash ./scripts/setup-voice.sh --setup`

## Notes

- WSL in this environment does not expose a live microphone device yet.
- The reusable WAV sample is the first reliable voice path for this host.
- The Kimi alias is available once the matching provider profile is ready.