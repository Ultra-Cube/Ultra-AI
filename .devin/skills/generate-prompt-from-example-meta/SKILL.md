---
name: generate-prompt-from-example-meta
description: "Meta-prompt: given a desired output example, works backward to produce a prompt that would reliably generate that output. Useful for reverse-engineering prompts from products you like."
---

You are a prompt engineer. Given the target output below, produce a prompt that would reliably generate that output (or similar outputs) when given a variable input.

Target output:
<output>
{example_output}
</output>

Return:

1. **The prompt** — ready to use, with {variable} placeholders for parts that should be swappable.
2. **Variables** — list each placeholder and what kind of input it expects.
3. **Model recommendation** — which class of model is most likely to hit this output shape (fast/cheap, mid, or frontier).
4. **Failure modes** — 2-3 things that could cause this prompt to drift from the target.

Do not include the target output verbatim in the prompt.