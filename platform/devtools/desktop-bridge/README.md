# @ultra-ai/desktop-bridge

JSON-RPC 2.0 bridge over WebSocket between the Ultra desktop shell
(Code-OSS / Open VS Code based, ADR-G-2.2) and `@ultra-ai/hermes-runtime`.

## Run

```bash
npm run build -w @ultra-ai/desktop-bridge
node platform/devtools/desktop-bridge/dist/index.js
# or: DESKTOP_BRIDGE_PORT=9477 node dist/index.js
```

Default: `ws://127.0.0.1:9477` (env: `DESKTOP_BRIDGE_PORT`, `DESKTOP_BRIDGE_HOST`).

## Protocol

Requests: `{ jsonrpc:'2.0', id, method, params }`.
Responses: `{ jsonrpc:'2.0', id, result | error:{code,message} }`.
Server pushes runtime events as notifications `{ method:'event', params:<RuntimeEvent> }`.

| Method | Params | Result |
|---|---|---|
| `health` | — | `{status, uptime, clients}` |
| `sessions.create` | `{agentId?}` | session |
| `sessions.get` | `{id}` | session / -32601 |
| `sessions.list` | — | session[] |
| `tasks.run` | `{sessionId, prompt}` | task |
| `tasks.get` / `tasks.list` | `{id}` / — | task / task[] |
| `memory.read` | `{id}` | entry / null |
| `memory.query` | `{namespace?, scope?, limit?}` | entry[] |
| `memory.write` | `{scope?, namespace?, content, metadata?}` | entry |
| `memory.delete` | `{id}` | `{ok}` |
| `skills.list` / `skills.register` / `skills.match` | — / `{skill}` / `{prompt}` | skill[] / `{ok}` / skill[] |
| `providers.list` / `providers.set` | — / `{name, model?}` | string[] / `{ok,provider,model}` |
| `tools.list` | — | string[] |
| `engine.set` | `{engine}` | `{ok, engine}` |
| `config.get` | — | runtime config summary |

## Notes

- `providers.set` currently registers `MockProvider` under the requested
  name; real HTTP adapters (OpenAI/Anthropic/Ollama) plug in via
  `runtime.registerProvider` when their adapter packages land.
- `engine.set` is a no-op placeholder until engine adapters exist (S4-P1
  contracts reserve the slot).
- No blockchain/crypto methods exist by design — chain features are
  deferred to later phases.
