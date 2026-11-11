---
name: kanban-orchestration
description: Task board and dispatch: maintain ULTRA_AI_TODO.md as the visible board, issue Task Cards to crew agents A00-A15, enforce one-owner-per-path and contract-first handoffs.
platforms: [hermes, claude-code, generic]
version: 0.1.0
---

## When to use
Dispatching work to the multi-agent crew; updating phase/task status.

## Procedure
1. Mirror ULTRA_AI_TODO.md into host todo tool.
2. Issue Task Card: ID, title, owner, deps, owned paths, inputs (memory ids, skills), contracts, DoD, gates, estimate, evidence required.
3. Parallel only when owned paths do not overlap.
4. Handoffs via contracts/ (OpenAPI/JSON Schema), never shared private code.
5. Update board after each task: checkbox + status word (IDEAL/SPEC/STUB/WORKING/VERIFIED) + evidence link.

## Verification
- Every in-flight task has a Task Card with non-overlapping owned paths.
- Board reflects reality; no silent deviations (ADR required for plan changes).

## Failure modes
- Two agents writing same path; status claimed without evidence; plan drift without ADR.

## References
- ULTRA_AI_SUPER_PROMPT.md sections 4, 6; ULTRA_AI_TODO.md
