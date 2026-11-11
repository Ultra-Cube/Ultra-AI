# @ultra-ai/mock-adapters

A single lightweight Fastify process that makes the imported Ultra-AI
sub-projects actually respond inside the platform, instead of being static
`imported` catalog entries.

One process serves every sub-project through routes keyed by id:
`9router`, `openclaw`, `jarvis`, `webui`, `quant-mind`, `kimi-k2.5`, `biome`,
`godmode`.

## Port

Defaults to **4100** (override with `MOCK_ADAPTERS_PORT`).

## Run

```bash
# from repo root
npm run mock-adapters          # tsx, no build step
# or build + run
npm run mock-adapters:build
npm run start --workspace=@ultra-ai/mock-adapters
```

## Endpoints

| Method | Path                      | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| GET    | `/health`                 | Service-level health + list of adapters  |
| GET    | `/adapters`               | Adapter catalog (ids, names, types)      |
| GET    | `/adapters/:id/health`    | Per-adapter health (status, uptime)      |
| GET    | `/adapters/:id/status`    | Per-adapter rich status (live metrics)   |

Each adapter rotates through `running` / `busy` / `degraded` and reports
growing uptime and request counts, so the integration layer sees honest,
moving data.

## How the platform consumes it

- `packages/api/src/services/integration-service.ts` — `refreshStatuses()`
  probes `/adapters/:id/health` and maps the result onto each system's status,
  falling back to `offline` when unreachable.
- `apps/web/app/api/integration/systems/route.ts` — probes the same endpoint
  per request so the UI shows live status.

Both read `MOCK_ADAPTERS_URL` (default `http://localhost:4100`).
