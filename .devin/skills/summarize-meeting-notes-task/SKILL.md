---
name: summarize-meeting-notes-task
description: "Task prompt that turns raw meeting notes into a structured summary — decisions, action items with owners, open questions, and a one-line TL;DR."
---

Turn the following meeting notes into a structured summary:

<notes>
{notes}
</notes>

Output exactly this shape:

**TL;DR:** One sentence, max 20 words.

**Decisions:**
- Bullet each decision, in the past tense.

**Action items:**
- [ ] Owner — action — due date if mentioned.

**Open questions:**
- Bullet each unresolved point.

Do not invent decisions or owners that aren't in the source. If nothing was decided, say "No decisions this meeting."