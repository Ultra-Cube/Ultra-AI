# @ultra-ai/zeroai-edge

ZeroAI local-first execution contract for the Ultra AI platform.

## Flow

```
user input → memory.recall → policy.decide → [confirmation gate] → execute → response
```

Every request passes through the policy layer — no route may bypass it.

## Routes

| Route | Meaning |
|---|---|
| `local-model` | Local inference lane (Ollama / Hermes runtime via OpenClaw) — **default** |
| `local-tool` | On-device action via a registered `ToolPort` |
| `workflow` | Repeatable automation via a `WorkflowPort` (n8n et al.) |
| `escalate` | Ultra AI gateway — only when policy decides (keywords, explicit hint) |

## Guarantees

- **Local-first**: default route is the local model; escalation requires a policy rule.
- **Honest locality**: `locality: 'local' | 'escalated'` is always reported — if the gateway is unavailable the router falls back to local and still reports `local`.
- **Confirmation gate**: sensitive actions (delete, transfer, payment, shell, …) return `status: 'awaiting-confirmation'` until `req.confirmation.approved === true`.
- **Observable**: `onEvent` emits `request.received → memory.recalled → policy.decided → route.executed → response.ready` for UI visibility.
- **Memory**: every completed exchange is written back via `MemoryPort.remember`.

## Wiring

Ports are dependency-injected; wire `hermes-runtime` adapters (`ProviderAdapter` → `LocalModelPort`, `ToolAdapter`/`ToolRegistry` → `ToolPort`, engine adapters → `WorkflowPort`) and the Ultra gateway client → `GatewayPort`. No runtime dependency on `hermes-runtime` is required — the contract stands alone.
