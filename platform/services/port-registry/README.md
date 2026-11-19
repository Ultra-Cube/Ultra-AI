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
# @ultra-ai/port-registry

Platform port registry and conflict resolver (P1A-09).

- `PLATFORM_PORTS` — canonical claims for frontend (3000), core-api (4000),
  desktop-bridge (4001), and the engine sidecars (openhands 3300, ollama
  11434, n8n 5678, langflow 7860, ultra-studio 8443, omniroute 20128,
  openclaw 18789). Mirrors `ENGINE_PRESETS` in `@ultra-ai/engine-supervisor`.
- `PortRegistry` — claim/release/isFree/conflicts/snapshot plus `resolve()`
  with three strategies:
  - `strict` — preferred port or `PORT_CONFLICT` (default)
  - `offset` — preferred+n within `maxOffset`
  - `skip` — first free port >= preferred inside `range`

Zero runtime dependencies. Used by supervisors and proxies before binding
ports so engine/platform collisions are detected up front.
