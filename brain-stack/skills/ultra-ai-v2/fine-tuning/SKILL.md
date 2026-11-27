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
name: fine-tuning
description: Fine-tuning platform skill — dataset preparation, LoRA/QLoRA runs, evaluation gates, and deployment of custom models into the Agent OS registry.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Customizing models for Ultra AI workloads: domain adaptation, style/format tuning, task-specific heads, distillation into SLM family.

## Ultra-AI context
- Compute reality: local Ollama (:11434) + AirLLM for CPU/offload inference; large fine-tunes may need scheduled GPU windows — coordinate via n8n.
- Registry path: fine-tuned weights register as new ModelEntry in model-gateway catalog with `family` set appropriately (usually SLM for distilled, LLM for full).
- Data governance: training data must pass the same `allowedDataClasses` policy as inference; never train on `regulated` data without explicit approval.
- Baseline first: always fine-tune against a measured baseline — run `evals` skill before and after.

## Procedure
1. **Task spec** — what behavior changes; success metric; size of improvement needed to justify cost.
2. **Dataset** — collect examples; dedupe; split train/val/test; document provenance and license.
3. **Method** — prefer LoRA/QLoRA for cost; full FT only with justification; pick base model by family need.
4. **Train** — log hyperparams, seed, hardware, duration; checkpoint regularly.
5. **Evaluate** — evals skill on held-out set; compare vs base model; check for regressions on general tasks.
6. **Deploy** — register in catalog; route via family policy; keep rollback path to base model.

## Guardrails
- No training on secrets, PII, or `regulated` data without sign-off.
- Version every artifact: dataset hash, weights hash, config.
- Fine-tuned model inherits the strictest data-classification of its training data.
