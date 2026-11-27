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
name: guardrails
description: Guardrails platform skill — input/output safety filters, prompt-injection defense, PII detection, policy enforcement, and content moderation across all model calls.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Hardening any LLM surface: chat endpoints, agent tools, RAG ingestion, customer-facing gates, code generation.

## Ultra-AI context
- Enforcement point: model-gateway is the single choke — input filters before routing, output filters before returning; never scatter checks across features.
- Data classification: `allowedDataClasses` per ModelEntry already gates regulated data; guardrails add content-level checks on top.
- Existing assets: `.devin/skills/safety-scan` (AIDefence PII + injection), `.devin/skills/pii-detect`, `.devin/skills/browser-extract` gates, `threat-model` skill.
- Audit: every blocked/flagged interaction logged via signed event outbox with reason code.

## Procedure
1. **Threat model** — enumerate inputs (user text, retrieved docs, tool outputs, code) and abuse paths; use STRIDE-lite.
2. **Input layer** — injection detection, jailbreak patterns, PII redaction before the prompt reaches the model.
3. **Output layer** — secret/PII leakage scan, format validation, refusal consistency check.
4. **Tool layer** — least-privilege tool scopes; confirm-before-act for destructive ops; sandbox untrusted content.
5. **Policy** — express rules as data (blocklists, regex, classifier thresholds) editable in dashboard, not hardcoded.
6. **Test** — adversarial suite in `evals`; regression-test every policy change.

## Guardrails
- Fail closed: if a filter errors, block rather than pass through.
- Never log raw secrets in audit events — log hashes/metadata only.
- Red-team quarterly; update detection rules from findings.
