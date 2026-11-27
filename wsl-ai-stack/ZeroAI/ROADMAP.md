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

# ZeroAI Roadmap

## Phase 1

- Clean the current ZeroAI scaffolding
- Lock the English-only docs
- Capture the architecture and control flow
- Commit the baseline as a versioned checkpoint

## Phase 2

- Evaluate offline speech-to-text engines
- Introduce a memory store
- Add a clean local UI entrypoint for ZeroAI
- Make the assistant route through OpenClaw without fallback replies

## Phase 3

- Add tool execution wrappers for local applications
- Wire n8n workflows into the task pipeline
- Add model selection and fallback policy

## Phase 4

- Integrate AirLLM where it improves resource use
- Merge useful parts of UltraAI into the ZeroAI control model
- Keep the system fully testable inside WSL
