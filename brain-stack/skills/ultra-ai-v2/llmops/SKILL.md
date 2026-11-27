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

---
name: llmops
description: LLMOps platform skill — model lifecycle operations, deployment, monitoring, cost control, prompt/version management, and incident response for production LLM workloads.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Operating LLM systems in production: deploying models, managing versions, monitoring quality/cost/latency, handling prompt regressions, capacity planning.

## Ultra-AI context
- Agent OS is the control plane: `platform/services/model-gateway` (registry, families, routing) + model lifecycle in `/models` and `/agent-os` UI gates.
- Model families (R10/R11): LLM, LCM, LAM, MoE, VLM, SLM, MLM, SAM — each with routing policy and data-classification constraints.
- Observability: Prometheus + Grafana (:9090/:3001) collect metrics; engine supervisor tracks service health; signed event outbox for audit.
- Cost: model-gateway `costPer1k` + `latencyClass` drive quality/cost/latency/hybrid routing modes.

## Procedure
1. **Inventory** — list registered models, families, providers, enabled flags via model-gateway API.
2. **Deploy/rollback** — version models through the registry; never edit running config without a recorded change.
3. **Monitor** — track latency p50/p95, error rate, cost per task, quality scores; alert on drift.
4. **Prompt management** — version prompts alongside models; A/B via n8n workflows before rollout.
5. **Incident response** — circuit-break failing providers; fall back per `model-policy` chains; postmortem in brain-stack memory.

## Guardrails
- All model traffic through the gateway — no direct provider calls from features.
- Cost budgets enforced per team/customer gate (R20).
- Every deploy/rollback logged with operator, reason, and diff.
