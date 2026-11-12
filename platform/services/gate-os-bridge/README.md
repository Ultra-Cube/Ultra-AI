# @ultra-ai/gate-os-bridge

Reference implementation of the Gate-OS `/v1` integration contract
(`platform/api/contracts/gate-os/openapi.yaml`). **Gate-OS itself is never
modified** — this package plus the contract let Gate-OS adopt Ultra AI as
its AI core later.

## Status: STUB → SPEC (readiness phase S4-P3)

| Endpoint | Impl | Contract |
|---|---|---|
| `GET /v1/health` | ✅ | openapi.yaml |
| `GET /v1/capabilities` | ✅ (HermesRuntime-backed when provided) | openapi.yaml |
| `GET /v1/environments` | ✅ 7 presets | openapi.yaml |
| `PUT /v1/environments/{env}/profile` | ✅ in-memory overrides | openapi.yaml |
| `GET /v1/ui-spec/{env}` | ✅ deterministic per-env spec | openapi.yaml |
| `POST /v1/intents` | ⚠️ keyword router (LLM routing = TODO) | openapi.yaml |
| `POST /v1/events` | ✅ idempotent accept into outbox buffer | openapi.yaml |

## Run

```bash
npm install
npm run build
GATE_OS_BRIDGE_PORT=9300 node dist/index.js   # default 127.0.0.1:9300
```

Env vars: `GATE_OS_BRIDGE_PORT` (9300), `GATE_OS_BRIDGE_HOST` (127.0.0.1),
`GATE_OS_BRIDGE_TOKEN` (optional bearer auth on all `/v1/*` except `/health`).

## Library use

```ts
import { createGateOsBridge } from '@ultra-ai/gate-os-bridge';
import { HermesRuntime, MockProvider } from '@ultra-ai/hermes-runtime';

const runtime = new HermesRuntime({ provider: 'mock' });
runtime.registerProvider(new MockProvider());
const { server } = createGateOsBridge({ runtime });
server.listen(9300, '127.0.0.1');
```

## Verify

```bash
npm test          # jest contract tests (real HTTP on ephemeral port)
npm run lint && npm run type-check && npm run build
```

## Notes

- Zero runtime deps besides `@ultra-ai/hermes-runtime` (node:http).
- Events land in an in-memory outbox buffer; the signed-event outbox
  (hash-chained, exportable) is the shared pattern for the future Ultra
  Core bridge — see `brain-stack/skills/ultra-ai-v2/signed-event-outbox`.
- Resource budgets in `src/environments.ts` are first drafts pending
  Gate-OS maintainer confirmation.
