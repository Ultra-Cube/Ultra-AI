---
name: agentskills-standard
description: Author and validate skills against the Agent Skills standard (agentskills.io): SKILL.md frontmatter, directory layout, progressive disclosure.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Any skill creation; skill audits.

## Ultra-AI context
- Project-authored skills live in ultra-ai-v2/skills/<name>/SKILL.md (33 skills, App. D catalog of ULTRA_AI_SUPER_PROMPT.md) and plugin mirror ultra-ai-v2/plugin/ultra-ai-builder/skills/.
- ~2,269 third-party SKILL.md packs under .devin/skills/ are NOT part of the v2 corpus — do not confuse scopes (coverage.md distinguishes them).
- Format: YAML frontmatter (name, description) + progressive-disclosure body; runtime-neutral so Hermes Agent, Claude Code, or AGENTS.md-compatible runtimes can consume.
- Deepening rule: every skill must cite memory/facts sources; stubs marked IDEAL must graduate to SPEC/STUB/WORKING/VERIFIED with evidence. Facts: ultra-ai-v2/memory/facts/docs-classification-batch3.md, ultra-ai-v2/memory/facts/docs-classification-batch4.md.
