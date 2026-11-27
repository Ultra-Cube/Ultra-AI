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

# THIRD-PARTY NOTICES — Ultra AI

> Generated inventory of third-party components integrated into Ultra AI.
> Primary source: `docs/v2/legal-licensing.md` (full 20-component matrix).
> Ultra AI itself is **proprietary** — see `LICENSE` at repository root.

## Open-source components

| Component | License | Integration mode | Notes |
|-----------|---------|------------------|-------|
| Hermes Agent (Nous Research) | MIT | Brain / engine | Keep copyright + licence notice |
| OpenClaw | MIT | Background assistant (:18789) | Notices; pairing required |
| Ollama | MIT | Local model runtime (:11434) | Model weights carry own licences |
| 9router / OmniRoute | MIT | Provider router (:20128) | OAuth pooling disabled by default |
| Langflow | MIT | Flow builder | Default flow engine (Dify is SUL-adjacent) |
| Open WebUI | BSD-3 + branding clause | UI shell (:8080) | No white-labelling; branding intact |
| n8n | Sustainable Use License | Workflow automation (:5678) | **Connect-only** — never bundled/hosted |
| Dify | Apache-2.0 + conditions | Single-tenant engine | No multi-tenant operation |
| AirLLM | Apache-2.0 | Large-model inference | — |
| LiteLLM | MIT | LLM gateway patterns | — |

## Restricted / conditional components

| Component | License | Constraint |
|-----------|---------|------------|
| Skales | BSL 1.1 | Personal/learning only; excluded from builds; converts to Apache-2.0 on 2030-04-19 |
| AI-Models_Biome | GPL-3.0 | Separate-process use only; never link into Ultra AI code |
| Kimi K2.x | Modified MIT | Display model name if >100M MAU or >$20M monthly revenue |
| Kimi K3 | Kimi K3 License | Display trigger + MaaS agreement required for reselling hosted inference |
| DeepSeek models | MIT (weights) | Model weights open; verify per-variant |

## Proprietary (detect-only, not redistributed)

| Component | Status |
|-----------|--------|
| Obsidian | Proprietary — detected at runtime, never bundled or auto-installed |
| Manus | Closed commercial API — optional connector with user key only |

## Bundled skills inventory

All skills under `.devin/skills/` retain their original licences; see
`external/mdskills-catalog/security-scan-report.json` and per-skill
`LICENSE*` files where present.
