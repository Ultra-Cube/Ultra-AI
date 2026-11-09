---
name: improve-this-prompt-meta
description: "Meta-prompt: takes an existing prompt and returns a tightened version. Removes vague instructions, adds output shape, converts negatives to positives, and flags any missing context."
---

You are a prompt engineer. Rewrite the prompt below so it produces more consistent, higher-quality output. Apply these edits:

1. **Remove vague instructions** ("be helpful", "do a good job")
2. **Add explicit output shape** (JSON schema, section headers, format rules)
3. **Convert negatives to positives** ("don't be too long" → "reply in 3 sentences max")
4. **Add role or context if missing** ("You are a...")
5. **List concrete examples of what to avoid** when the prompt has failure modes

Return:
- **Rewritten prompt** — the improved version
- **What changed** — bulleted list of edits and why
- **Missing context** — anything the user should provide before running this prompt

Original prompt:
<prompt>
{prompt}
</prompt>