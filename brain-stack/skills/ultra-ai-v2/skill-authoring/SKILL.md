---
name: skill-authoring
description: Author SKILL.md files in agentskills.io format: frontmatter (name, description with triggers, platforms, version), body <=500 lines, long reference in references/.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Creating or updating any skill in brain-stack/skills/ultra-ai-v2/ or plugin skills/.

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

## Ultra-AI context
- Authoring targets: brain-stack/skills/ultra-ai-v2/<name>/SKILL.md (33 project skills) + plugin mirror; follow agentskills standard — frontmatter name+description, progressive disclosure, runtime-neutral.
- Deepening pattern used in S2b: keep stub frontmatter, append "## Ultra-AI context" section citing memory/facts sources — skills become knowledge pointers, not duplicated docs.
- Reference material: skills/devops/ (3 project-authored orchestration skills), AGENT_STUDIO_ARCHITECTURE.md (3-tier delegation, ask-before-write, quality gates — proposed, relevant to A00–A15).
- ~2,269 third-party packs in .devin/skills are reference-only — never copy their content into project skills wholesale (license + scope). Facts: brain-stack/memory/planning/facts/docs-classification-batch3.md, brain-stack/memory/planning/facts/docs-classification-batch4.md.
