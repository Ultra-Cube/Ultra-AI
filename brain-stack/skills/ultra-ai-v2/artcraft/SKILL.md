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
name: artcraft
description: ArtCraft / Craft-Anything skill — reverse-engineer any capability (UI, workflow, API, agent behavior, design system) into a reusable SKILL.md so Ultra AI can self-extend its skill library.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
The project needs a capability it doesn't have yet: reverse-engineer an existing artifact (page, workflow, service, prompt pattern, design) and distill it into a new brain-stack skill or platform feature.

## Ultra-AI context
- Purpose (R13): self-extension loop — observe → decompose → abstract → re-emit as SKILL.md + optional code, registered in skill-registry and `/brain-stack`.
- Inputs can be internal (our own pages/services) or OSS references in `external/github-forks/` and `.devin/skills/` (~2,269 packs).
- Output must follow the brain-stack SKILL.md contract: HTML copyright banner, YAML frontmatter (`name`, `description`, `platforms`, `version`), When-to-use / context / procedure / guardrails sections.
- License discipline: reverse-engineering for interoperability and re-implementation is fine; never copy proprietary code verbatim — abstract the pattern, write original implementation. Check `docs/legal/THIRD_PARTY_NOTICES.md` obligations.

## Procedure
1. **Acquire** — collect the artifact: screenshots, code, API docs, workflow JSON, prompt text, or live behavior observations.
2. **Decompose** — identify the atomic capabilities: inputs, outputs, decision points, state, failure modes, integrations.
3. **Abstract** — strip implementation details; express each capability as a reusable procedure with guardrails.
4. **Re-emit** — write `SKILL.md` (banner + frontmatter + sections) under `brain-stack/skills/ultra-ai-v2/<name>/`; add supporting scripts only if the skill needs them.
5. **Register** — add to CATALOG, verify skill-registry scan picks it up (`name@version` id), surface in `/brain-stack` skills tab.
6. **Verify** — invoke the new skill on a real task; run `skill-check`/`skill-audit`; iterate.

## Guardrails
- Never exfiltrate proprietary source — patterns and ideas only.
- New skills inherit platform guardrails: policy engine, audit logging, data-classification.
- One capability per skill; compose via references, not duplication.
