<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
║                                                                          ║
║ Project   : Ultra AI — Proprietary AI Platform                           ║
║ Developer : Ultra Cube Tech — ucubetech.com                              ║
║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
║ GitHub Org: github.com/Ultra-Cube                                        ║
║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
║ [UCUBETECH-COPYRIGHT]                                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

<!--
<!--
# @ultra-ai/hermes-openai-bridge

OpenAI-compatible HTTP bridge for `HermesRuntime`. Lets **Open WebUI** (or
any OpenAI client) use Hermes Agent — memory, skills, reasoning, tool loop —
as a chat model provider, instead of only raw Ollama/9router backends.

## Endpoints

| Route | Purpose |
|---|---|
| `GET /health` | liveness (no auth) |
| `GET /v1/models` | advertises `hermes` |
| `POST /v1/chat/completions` | runs a Hermes task; supports `stream: true` (SSE) |

Session continuity: `x-hermes-session` header → `metadata.conversation_id`
→ `user` field → default `"openwebui"`. Each session maps to a Hermes
session (agent `openwebui`), so memory recall/write and history accumulate
per conversation.

## Run

```bash
npm install
npx tsx src/index.ts          # or: npm run build && node dist/index.js
```

Env vars:

| Var | Default | Purpose |
|---|---|---|
| `HERMES_OPENAI_PORT` | `9400` | listen port |
| `HERMES_OPENAI_HOST` | `127.0.0.1` | bind address |
| `HERMES_OPENAI_TOKEN` | — | bearer auth on `/v1/*` |
| `HERMES_UPSTREAM_URL` | — | OpenAI-compatible upstream for the Hermes provider (e.g. `http://localhost:11434/v1` Ollama, `http://localhost:20128/v1` 9router). Unset → MockProvider. |
| `HERMES_UPSTREAM_API_KEY` | — | upstream key |
| `HERMES_UPSTREAM_MODEL` | — | upstream default model |

## Open WebUI wiring

In Open WebUI: **Admin → Settings → Connections → OpenAI API** add
`http://host.docker.internal:9400/v1` (compose) or
`http://localhost:9400/v1` (native), then select model `hermes` in chat.
`/chat` in the Ultra AI frontend already embeds Open WebUI, so Hermes
appears as a first-class model there.

## Notes

- v0: non-streaming replies are buffered into SSE chunks when
  `stream: true` (Hermes task completes, then emits). True token-level
  streaming requires provider streaming support — follow-up.
- `usage.prompt_tokens` is 0 (Hermes does not meter prompt tokens yet);
  `completion_tokens` ≈ chars/4.
