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
# Hermes embed-mode spike — RESULTS (wsl2)

Date: 2026-11-15
Host: WSL2 Ubuntu, Hermes Agent v0.23.1 (2026.9.24), commit `3b4215785882`, installed via git to `/home/pc/.hermes/hermes-agent`, binary `/home/pc/.local/bin/hermes`.

Spike harness: `distribution/scripts/spike-hermes-embed.sh` (rerun output: `docs/spikes/hermes-embed-wsl2-rerun-2026-11-15.md`).

## Result: POSITIVE — Hermes exposes a real OpenAI-compatible HTTP API. No `hermes-bridge` required.

Two distinct HTTP surfaces exist; only one is OpenAI-compatible:

### 1. `hermes serve` — dashboard/desktop backend (port 9119)

- Headless JSON-RPC/WebSocket backend for the Hermes desktop app. Web UI disabled (`hermes dashboard` serves the browser UI).
- `GET /api/health` → `{"ok":true,"version":"0.23.1",...}` — health only.
- `/api/v1/*`, `/v1/*`, `/api/sessions` → 401/404. The `window.__HERMES_SESSION_TOKEN__` in the root HTML is a dashboard session token, **not** a bearer credential for this surface.
- Verdict: internal RPC surface, not for Ultra integration.

### 2. `hermes gateway run` + `platforms.api_server` — OpenAI-compatible API (port 8642)

Enabled via:

```bash
hermes config set platforms.api_server.enabled true
hermes config set platforms.api_server.extra.key "<API_SERVER_KEY>"
hermes gateway run   # foreground; binds 127.0.0.1:8642 by default
```

Verified live on this host:

| Probe | Result |
|---|---|
| `GET /health` (Bearer) | 200 `{"status":"ok","platform":"hermes-agent","version":"0.23.1"}` |
| `GET /v1/models` (Bearer) | 200 — OpenAI `{"object":"list","data":[{"id":"hermes-agent",...}]}` |
| `GET /v1/capabilities` (Bearer) | 200 — full feature/endpoint table (below) |
| `POST /v1/chat/completions` (Bearer) | 200 OpenAI `chat.completion` envelope; body carries agent error because **no LLM provider credentials are configured** on this host (`agent_error`: run `hermes model` / `hermes auth add <provider>`) |
| `GET /api/sessions` (Bearer) | 200 `{"object":"list","data":[]}` |
| Same endpoints without/with wrong key | 401 `gateway_auth_failed` — auth enforced |

`/v1/capabilities` confirms the surface (abridged):

- Chat: `POST /v1/chat/completions` (+ streaming), `POST /v1/responses` (+ streaming)
- Async agent runs: `POST /v1/runs`, `GET /v1/runs/{id}`, `GET .../events` (SSE), `POST .../approval|steer|stop|resolve-unknown`, durable idempotency (24 h)
- Sessions: `GET/POST /api/sessions`, `GET/PATCH /api/sessions/{id}`, fork, model lock
- Discovery: `GET /v1/models`, `GET /api/model/options`, `GET /v1/skills`, `GET /v1/toolsets`
- Session continuity headers: `X-Hermes-Session-Id`, `X-Hermes-Session-Key`
- Runtime: server-side `AIAgent`, tools execute on the API-server host
- Auth: `Authorization: Bearer <key>` — key from `platforms.api_server.extra.key` / `API_SERVER_KEY`

## Integration conclusion for Ultra

- **Open WebUI / model-gateway can point directly at `http://127.0.0.1:8642/v1`** with the bearer key — OpenAI-compatible, no bridge needed for chat.
- For agentic work (runs, approvals, steering, sessions, skills) Ultra should use the richer `/v1/runs` + `/api/sessions` surface — this maps naturally onto `work-dispatch` executors and the confirmation gate.
- `hermes-bridge` is **not** required. Revisit only if a future Hermes version drops the api_server platform.
- Remaining host gap: no inference provider credentials — `POST /v1/chat/completions` returns a well-formed error until `hermes auth add <provider>` / `hermes model` is run (owner credential gate, same class as R2/API-test gates).

## Caveats

- api_server binds `127.0.0.1` by default; `platforms.api_server.extra.host/port` override. Non-loopback binds should stay behind `@ultra-ai/edge-proxy` (P1A-08) — never expose 8642 directly.
- The gateway was left running in this WSL2 session for verification; stop with `hermes gateway stop` or Ctrl+C on the `gateway run` process.
- Windows-native and bare-Linux (non-WSL2) spike runs remain open — WSL2 result is representative for the API contract but install paths differ.
