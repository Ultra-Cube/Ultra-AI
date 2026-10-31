# Upstream Integration Inventory

> Inventory of the 8 fadhel-sh upstream forks that back the Ultra-AI catalog
> sub-projects. Clones live (gitignored) under `external/`. Read-only analysis —
> no installs run, no files in the upstreams modified. Produced 2026-10-31.

## How Ultra-AI probes sub-projects today
`packages/api/src/services/integration-service.ts` → `probeAdapterStatus()` does
`GET ${MOCK_ADAPTERS_URL}/adapters/${id}/health` (default `http://localhost:4100`,
1500 ms timeout). Non-OK / unreachable → `offline`. Every sub-project depends on
`9router`, so 9router is the keystone to health-gate first.

## Classification

| id | Upstream | Kind | Real port | Health | Secrets needed | Runnable on this box? |
| --- | --- | --- | --- | --- | --- | --- |
| **9router** | 9router | Next.js service | **20128** (scripts say 20127) | `GET /api/health` → `{ok:true}`, CORS-open, auth-exempt | `JWT_SECRET`, `INITIAL_PASSWORD`, `DATA_DIR` | yes (needs `npm build` first) |
| **jarvis** | OpenCompany | Python FastAPI (uv) + Bun/Next | **5678** (env `HOST`/`PORT`, no code default) | `GET /health`, `GET /health/ready` | `SECRET_KEY`, `API_KEY_ENCRYPTION_KEY`, `JWT_SECRET_KEY` | yes (no Docker; binds 127.0.0.1) |
| **openclaw** | AionUi | Electron **+ headless web-host** | dev **25809** / Docker **3000** (`--port`/`AIONUI_PORT`/`PORT`) | backend `aioncore` `GET /health` | admin pw auto-seeded; provider keys in-app | partial — needs external `aioncore` binary + built renderer; 932M, don't blind-install |
| **webui** | APP_WebUI-desktop | **Pure Electron desktop client** | none of its own (targets `:8080` Open WebUI, llama.cpp `:18881`) | **none** (GUI, no inbound HTTP) | none at startup | n/a — not a service, can't be health-probed |
| **biome** | AI-Models_Biome | Electron + Python FastAPI (uv) | injected; py default **7987** `0.0.0.0` | `GET /health` (+ `/ws`), reports warmup state | HuggingFace token | health surface only (GPU-bound; `world_engine.loaded=false` w/o GPU) |
| **quant-mind** | AI-Tools_quant-mind | Python **library** (no server) | none | none | `OPENAI_API_KEY`, opt `LLAMA_CLOUD_API_KEY` | yes via `uv` (avoid heavy `full` extra); needs HTTP wrapper to be a service |
| **godmode** | Engine_world-engine | Python **library** (CUDA-only) | none | none | `HF_TOKEN` | no — hard CUDA req (`torch==2.11.0`+triton); documented-only |
| **kimi-k2.5** | AI-Model_Kimi-K2.5 | **Docs only** (model card + PDF) | none | none | none | n/a — no code; mock adapter stays |

## Integration verdicts

**Drop-in HTTP services (can replace the 4100 mock directly):**
- **9router** → probe `http://localhost:20128/api/health`. Already matches the `port: 20128`
  in `integration-service.ts`. Health-gate this FIRST (everything depends on it).
- **jarvis (OpenCompany)** → probe `http://localhost:5678/health` (or `/health/ready`
  for a truthful "can serve" signal). GAP: the `jarvis` entry in `integration-service.ts`
  currently has **no `port` field** — add `port: 5678`.
- **biome** → launch `uv run python -u main.py --host 127.0.0.1 --port 4100`, probe `/health`.
  Single-tenant (one WS session), GPU-bound — health works but model won't load here.

**Needs a wrapper or is not a service:**
- **openclaw (AionUi)** → only its headless `webui` server mode is probeable
  (`AIONUI_PORT=<p> bun run webui`, has `/health`); the Electron app is not. Needs external
  `aioncore` binary + built renderer.
- **webui (APP_WebUI-desktop)** → desktop GUI client, NOT a service. The actual serviceable
  component for this id is the **Open WebUI backend** (`:8080`) it points at, not this repo.
- **quant-mind** → Python library; needs a thin FastAPI shim exposing `quantmind.flows`
  over HTTP with its own `/health` to sit behind 4100.
- **godmode** → Python library, embedded in-process (e.g. biome imports `world_engine`),
  never probed as a service. CUDA-only.
- **kimi-k2.5** → docs/model card only; keep the mock adapter.

## Recommended wiring order (when we do it)
1. **9router** (keystone, port already correct, zero-auth health) — lowest risk.
2. **jarvis** — add `port: 5678` to config, repoint probe.
3. **biome** — health-only on this box; full function needs GPU.
4. Wrap **quant-mind** in a FastAPI shim; treat **openclaw** via web-host mode.
5. Leave **webui** (point at Open WebUI backend), **godmode** (embed), **kimi-k2.5** (mock) as-is.

## Not verified (honest gaps)
No installs or builds were run (host: no GPU, ~1.3 GB free RAM). All ports, commands, and
health routes are from static manifest/source reading with file:line citations — not confirmed
live. The 9router 20127-vs-20128 script/env discrepancy and OpenCompany's loopback bind
(`HOST=0.0.0.0` needed for cross-container probes) should be confirmed at runtime.
