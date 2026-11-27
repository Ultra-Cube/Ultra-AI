---
name: classify-user-intent-task
description: "Task prompt that classifies a user message into one of a fixed set of intents. Returns strict JSON. Good template for building fast intent routers."
---

Classify the following user message into exactly one intent from this list: {intents}.

Message:
<message>
{message}
</message>

Return ONLY valid JSON, no prose, matching:

```json
{
  "intent": "one_of_the_listed_intents",
  "confidence": 0.0,
  "reasoning": "one short sentence"
}
```

If the message doesn't match any listed intent, use "other" as the intent and set confidence to 0.0.