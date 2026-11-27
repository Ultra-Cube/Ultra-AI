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

# @ultra-ai/brain

Brain package (P1A-02): manages the Hermes Agent process inside Ultra-AI — spawn/health/stop across embed modes, and merges `~/.hermes/config.yaml` so custom providers route through the platform model gateway.

## Pieces

- **`BrainManager`** — process manager for Hermes in `cli` | `gateway` | `openai-compatible` embed modes. `start(mode?)`, `stop()`, `health()`, and async `probe()` (HTTP health check for gateway modes; degrades on timeout/5xx).
- **`mergeHermesConfig`** — reads the user's Hermes config and rewrites any non-platform provider to `openai-compatible` pointed at the platform gateway (`ULTRA_MODEL_GATEWAY_URL`, default `http://127.0.0.1:20128/v1`), preserving the original provider name under `originalProvider`. This keeps all model traffic inside Ultra's metering/policy boundary.
- **`loadHermesConfig` / `saveHermesConfig`** — YAML round-trip via `js-yaml`; saves with `0600` perms.

## Usage

```ts
import { BrainManager, resolveBrainConfig, loadHermesConfig, mergeHermesConfig, saveHermesConfig } from "@ultra-ai/brain";

const brain = resolveBrainConfig();
const merged = mergeHermesConfig(loadHermesConfig(brain.hermesConfigPath), brain);
saveHermesConfig(brain.hermesConfigPath, merged);

const mgr = new BrainManager(brain, { healthUrl: "http://127.0.0.1:8642/healthz" });
mgr.start();            // picks first preferred mode
const health = await mgr.probe();
```

## Tests

`npm test` — config merge (provider rewrite, platform passthrough, string shorthand, gateway defaults), YAML round-trip with file perms, manager state/selection/failure paths. No real Hermes binary required; the failure path uses a nonexistent command.
