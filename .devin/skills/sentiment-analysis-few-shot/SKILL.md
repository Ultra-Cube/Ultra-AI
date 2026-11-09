---
name: sentiment-analysis-few-shot
description: "Three-example few-shot prompt for sentiment classification. Handles positive / negative / neutral with reasoning. Template you can extend for domain-specific classes."
---

Classify the sentiment of the input as positive, negative, or neutral. Include one-line reasoning.

Example 1:
Input: "This is the best product I've ever bought."
Output: {"sentiment": "positive", "reasoning": "Superlative praise, no qualifiers."}

Example 2:
Input: "It arrived broken and support hasn't replied in five days."
Output: {"sentiment": "negative", "reasoning": "Concrete failure plus unresolved escalation."}

Example 3:
Input: "The package arrived on Tuesday."
Output: {"sentiment": "neutral", "reasoning": "Factual statement, no evaluative content."}

Now classify:
Input: "{input}"
Output: