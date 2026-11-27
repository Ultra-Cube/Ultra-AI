<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗       ║
║ ██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║       ║
║ ██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║       ║
║ ╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║      ║
║  ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║       ║
║   ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝       ║
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

# Ultra AI — Agent Teams (R9 / V3-P2.6)

Five named agent teams running on Hermes (:9119) + OpenClaw (:18789) +
n8n (:5678). Each team has a defined roster, trigger, and deliverable.
Definitions are declarative; activation is via the `/api/agents` registry
and n8n workflow schedules.

| Team | Role | Trigger | Deliverable |
|------|------|---------|-------------|
| **Dot** | Ongoing ops assistant | Continuous / scheduled | Daily status digest, anomaly flags |
| **Muse** | Personal assistant | On-demand chat | Personal task help, notes, reminders |
| **Grok Bot** | AI-team coordinator | Event (PR/issue/model event) | Coordination summaries, routing decisions |
| **SkillTree** | Per-department teams | Scheduled per dept | Department skill audits, capability reports |
| **AnyModelBot** | Background code review | CI hook / schedule | Review findings, model-quality scores |

## Wiring

```
User / schedule ──▶ n8n workflow ──▶ Hermes api_server (:9119)
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                   OpenClaw        Agent OS        brain-stack
                   (:18789)       (model route)   (skills/memory)
```

- Hermes exposes each team as a profile (`dot`, `muse`, `grok-bot`,
  `skilltree`, `anymodelbot`) via `hermes-runtime` adapters.
- n8n workflows: `dot-daily-review`, `muse-personal-tasks`,
  `grok-bot-team-coord`, `skilltree-dept-teams`,
  `anymodelbot-code-review`, `model-router` (family routing:
  LLM/LCM/LAM/MoE/VLM/SLM/MLM/SAM).
- OpenClaw acts as the background backend assistant; all agent
  traffic is mediated through the Ultra AI API — external apps are
  controlled via dashboard API only (R7).

## Status tracking

Team health is reported through `/api/agents` and surfaced on the
`/hermes` dashboard page. Heartbeats every 30 min during autonomous
runs land in `docs/audit/heartbeat/`.
