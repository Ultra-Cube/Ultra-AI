---
name: skill-authoring
description: Author SKILL.md files in agentskills.io format: frontmatter (name, description with triggers, platforms, version), body <=500 lines, long reference in references/.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Creating or updating any skill in ultra-ai-v2/skills/ or plugin skills/.

## Format
Frontmatter: name, description (include trigger phrases), platforms, version.
Body sections: When to use, Procedure/Steps, Verification, Failure modes, References.
Keep SKILL.md <= 500 lines; put long material in references/.

## Verification
- Frontmatter lint passes; directory name == name field.
- Skill is runtime-neutral (works for Hermes and Claude Code).

## Failure modes
- Vendor-specific syntax; missing triggers; oversized files.

## References
- agentskills.io spec; existing repo skills under skills/ and .devin/skills/
