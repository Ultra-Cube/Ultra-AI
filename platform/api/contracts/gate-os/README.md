# Gate-OS Contract (`/v1`)

Stable integration contract for Gate-OS readiness (phase S4-P3).

## Hard rule

**Gate-OS is never modified.** Ultra AI delivers a contract, a bridge
service, and contract tests so Gate-OS can adopt Ultra AI as its AI core
later. All endpoint shapes here are proposals pending Gate-OS maintainer
confirmation — treat as `SPEC`, not `VERIFIED`.

## Files

| File | Purpose |
|---|---|
| `openapi.yaml` | OpenAPI 3.1 contract: capabilities, environment profiles, adaptive UI spec, intents, events, health |

## Consumers

- `platform/services/gate-os-bridge` — reference implementation (`@ultra-ai/gate-os-bridge`) exposing this contract over HTTP, backed by `@ultra-ai/hermes-runtime`.
- Gate-OS shell (future adopter) — renders `GET /v1/ui-spec/{env}` and calls `POST /v1/intents`.

## Environment presets

Seven switchable environments (no reboot): `everyday`, `gaming`, `dev`,
`design`, `media`, `security`, `business`. First-draft AI profiles live in
`platform/services/gate-os-bridge/src/environments.ts`; confirm resource
budgets with Gate-OS maintainers.

## Security model (readiness phase)

- Loopback-only listener by default.
- Optional `GATE_OS_BRIDGE_TOKEN` bearer auth on all `/v1/*` except `/v1/health`.
- Ultra AI runs as a separate process — network boundary keeps Gate-OS GPL
  components uncombined with Ultra AI code (counsel to confirm).
- Events accepted via `POST /v1/events` feed the signed-event outbox pattern
  (shared design with the future Ultra Core bridge).
