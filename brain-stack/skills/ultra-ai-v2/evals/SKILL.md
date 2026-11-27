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
name: evals
description: Evaluation platform skill — build and run eval suites for models, agents, RAG pipelines, and prompts; LLM-as-judge, pairwise comparison, regression gates.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Measuring quality before shipping: model comparisons, prompt changes, agent behavior, RAG grounding, regression detection.

## Ultra-AI context
- Existing assets: `brain-stack/skills/ultra-ai-v2/eval-harness` (EDD harness), `.devin/skills/advanced-evaluation` (LLM-as-judge), `.devin/skills/agent-evaluation` (agent benchmarks).
- Model selection for judging: route judge calls through model-gateway; prefer a different family than the model under test to reduce self-preference bias.
- Evidence ladder: every eval claim needs recorded inputs, outputs, scores, and run ID — store under `docs/audit/` or brain-stack memory.

## Procedure
1. **Define suite** — task set with expected behavior, not just string match; cover happy path + edge + adversarial.
2. **Metrics** — pick per task: exact match, rubric score, pairwise win-rate, latency, cost.
3. **Judge setup** — LLM-as-judge with fixed rubric + position-swap for pairwise; deterministic checks first, judge second.
4. **Run & gate** — compare against baseline; block promotion on regression beyond threshold.
5. **Report** — scorecard with per-item evidence; persist run artifacts.

## Guardrails
- Never eval on training-contaminated or secret data.
- Judge model ≠ subject model family where possible.
- All eval results reproducible: same inputs → same run ID → same artifacts.
