---
name: kanban-orchestrator
description: Orchestrates a feature from epic breakdown through implementation to done, delegates to appropriate tier agents, runs quality gates at checkpoints
platforms: [darwin, linux, win32]
---

# Kanban Orchestrator Skill

Orchestrates complete feature development from epic breakdown through implementation to "Done", coordinating across the Ultra-AI agent studio's three-tier hierarchy. Enforces ask-before-write protocol, runs quality gates at decision points, and manages delegation to appropriate specialists.

## When to Use

- User provides a feature epic or large requirement
- Need to coordinate across multiple domains (backend, frontend, ML, etc.)
- Require structured breakdown from vision through implementation
- Want quality gates enforced at each checkpoint

## Prerequisites

- Ultra-AI agent studio system available at `/opt/data/Ultra-AI`
- Agent registry with 30+ specialized agents
- Quality gate system implemented
- User approval required for all significant decisions (ask-before-write)

## Workflow

### Phase 1: Epic Understanding & Vision

**Goal:** Clarify the feature request and establish product vision

1. **Capture the epic:**
   - Read user's feature request
   - Identify scope, goals, constraints
   - Note any explicit requirements (performance, security, UX)

2. **Delegate to Product Director (Tier 1):**
   ```
   delegate_task(
     agent: "product-director",
     task: "Define product vision and strategic direction for: [EPIC_TITLE]
     
     User Request: [original request]
     
     Please:
     1. Clarify requirements with user (ask questions)
     2. Define success criteria: 'We'll know this was right if...'
     3. Identify constraints (technical, business, timeline)
     4. Present 2-3 strategic approaches with trade-offs
     5. DO NOT make autonomous decisions - get user approval on direction
     
     Output format:
     - Vision statement
     - Success criteria (measurable)
     - Strategic options (2-3 with trade-offs)
     - Recommended approach with rationale"
   )
   ```

3. **Present vision to user:**
   - Show Product Director's strategic options
   - Ask user to choose approach
   - Document chosen direction

4. **Checkpoint:** User approves product direction before proceeding

---

### Phase 2: Epic Breakdown

**Goal:** Break epic into implementable stories with clear acceptance criteria

5. **Delegate to Product Manager (Tier 2):**
   ```
   delegate_task(
     agent: "product-manager",
     task: "Break down epic into user stories with acceptance criteria
     
     Epic: [EPIC_TITLE]
     Approved Direction: [chosen approach from Phase 1]
     
     Please:
     1. Decompose into 3-8 user stories
     2. Write acceptance criteria for each (observable, testable)
     3. Identify dependencies between stories
     4. Suggest implementation order
     5. Estimate size (S/M/L or hours)
     6. Flag stories requiring architectural decisions
     
     Story format:
     - Title: As a [user], I want [goal] so that [benefit]
     - Acceptance Criteria: [list of verifiable outcomes]
     - Type: [feature|api|ui|data|ml|config|refactor|bug]
     - Dependencies: [other story IDs]
     - Estimate: [S/M/L]
     - Requires ADR: [yes/no]
     
     DO NOT implement - only plan and specify."
   )
   ```

6. **Present breakdown to user:**
   - Show story breakdown with estimates
   - Highlight dependencies and ADR requirements
   - Ask: "Does this breakdown match your expectations?"

7. **Checkpoint:** User approves story breakdown before proceeding

---

### Phase 3: Architecture & Technical Design

**Goal:** Resolve architectural decisions and design technical approach

8. **Identify stories requiring architecture review:**
   - Filter stories with `Requires ADR: yes`
   - Group by architectural concern

9. **For each architectural decision needed:**
   
   a. **Run architecture-review skill** (delegate to separate skill):
   ```
   Use the architecture-review skill to orchestrate ADR workflow:
   - Gathers context
   - Delegates to chief-architect for options
   - Runs ARCH-FEASIBILITY and ARCH-REVIEW gates
   - Produces accepted ADR document
   ```
   
   b. **Checkpoint:** User approves architecture before proceeding

10. **Delegate to Tech Lead (Tier 2) for technical breakdown:**
    ```
    delegate_task(
      agent: "tech-lead",
      task: "Review stories and define technical approach
      
      Stories: [list of approved stories]
      Approved ADRs: [list of ADR references]
      
      Please:
      1. Identify domains affected (backend, frontend, ML, infrastructure)
      2. Define technical approach for each story
      3. Propose API contracts for cross-domain boundaries
      4. Flag technical risks or constraints
      5. Recommend implementation order considering dependencies
      
      Output for each story:
      - Domains affected: [backend/frontend/ml/infra/design]
      - Technical approach: [brief description]
      - API contracts: [if applicable]
      - Open technical questions: [list or none]
      - Risk level: [low/medium/high]
      
      DO NOT implement - propose architecture for approval."
    )
    ```

11. **Run ARCH-REVIEW gate:**
    ```
    For each story with technical approach:
    - Execute ARCH-REVIEW gate (check for technical approach, ADR references, open questions)
    - Verdicts: APPROVE | REVISE | REJECT
    
    If REJECT or REVISE:
    - Show blockers to user
    - Tech Lead addresses issues
    - Re-run gate
    ```

12. **Checkpoint:** All stories pass ARCH-REVIEW gate before proceeding

---

### Phase 4: Spec Readiness

**Goal:** Ensure each story is ready for implementation

13. **For each story, run SPEC-READY gate:**
    ```
    Execute SPEC-READY gate checking:
    - Design completeness (requirements, acceptance criteria, testable)
    - Architecture completeness (ADRs cited, technical approach, dependencies)
    - Scope clarity (estimate, boundaries, dependencies resolved)
    - No open questions or TBD markers
    
    Verdicts: READY | NEEDS_WORK | BLOCKED
    
    If NEEDS_WORK:
    - Delegate back to Product Manager or Tech Lead to fill gaps
    - Re-run gate after updates
    
    If BLOCKED:
    - Escalate blocker to user
    - Resolve dependency or external blocker
    - Re-run gate
    ```

14. **Checkpoint:** All stories reach READY verdict before implementation

---

### Phase 5: Implementation Orchestration

**Goal:** Coordinate implementation across stories and domains

15. **Create implementation queue:**
    - Order stories by dependencies and Tech Lead recommendation
    - Group parallel-implementable stories

16. **For each story in queue:**
    
    a. **Delegate to kanban-worker skill:**
    ```
    Use kanban-worker skill to implement the story:
    - Story context (title, acceptance criteria, technical approach, type)
    - Delegates to appropriate specialist agent (api-developer, frontend-dev, ml-engineer, etc.)
    - Runs CODE-REVIEW gate before marking done
    - Returns implementation result with test evidence
    ```
    
    b. **Monitor progress:**
    - Track story status (ready → in-progress → review → done)
    - Flag blockers immediately
    - Coordinate cross-domain dependencies
    
    c. **Handle escalations:**
    ```
    If kanban-worker escalates issue:
    - Identify escalation type (technical, product, cross-domain, scope)
    - Route to appropriate Tier 1 agent (chief-architect, product-director, engineering-manager)
    - Present options to user
    - Cascade resolution back to kanban-worker
    ```

17. **Cross-domain coordination:**
    ```
    When story affects multiple domains (e.g., backend + frontend):
    - Tech Lead coordinates domain leads
    - Each domain lead reviews their portion
    - Shared boundaries (API contracts) agreed before implementation
    - Integration testing after both complete
    ```

---

### Phase 6: Story Acceptance

**Goal:** Validate each completed story meets acceptance criteria

18. **For each completed story:**
    
    a. **Collect test evidence:**
    - Unit tests + results
    - Integration tests + results  
    - Type-specific evidence (API tests for API story, component tests for UI story, etc.)
    - Coverage metrics
    
    b. **Run ACCEPTANCE gate:**
    ```
    Execute ACCEPTANCE gate checking:
    - Each acceptance criterion verified
    - Test evidence complete (by story type)
    - Code review passed
    - No security warnings
    - Documentation updated (if needed)
    - No unplanned scope changes
    
    Verdicts: ACCEPTED | REVISIONS_NEEDED | REJECTED
    
    If REVISIONS_NEEDED:
    - Delegate back to implementing agent with specific fixes
    - Re-run after fixes
    
    If REJECTED:
    - Escalate to Product Manager and Tech Lead
    - Determine root cause (wrong approach, spec mismatch, etc.)
    - User decides: rework or cancel
    ```
    
    c. **User confirms acceptance:**
    - Show test evidence and gate results
    - Ask: "Does this story meet your expectations?"
    - Mark ACCEPTED only after user confirmation

---

### Phase 7: Epic Completion

**Goal:** Validate entire epic is complete and production-ready

19. **Integration verification:**
    ```
    Delegate to QA Engineer (Tier 3):
    "Run end-to-end integration tests across all implemented stories.
    
    Stories completed: [list]
    
    Please:
    1. Execute integration test suite
    2. Test cross-story workflows
    3. Validate acceptance criteria at epic level
    4. Document test evidence
    5. Report any integration issues
    
    Output: Test results + evidence + issues (if any)"
    ```

20. **Run RELEASE-READY gate:**
    ```
    Execute RELEASE-READY gate checking:
    - All stories ACCEPTED
    - Integration tests passing
    - No critical or high-priority bugs
    - Documentation complete
    - Security scan passed (if applicable)
    
    Verdicts: READY | CONCERNS | BLOCKED
    
    If CONCERNS or BLOCKED:
    - Present issues to user
    - Prioritize fixes
    - Re-run gate after resolution
    ```

21. **Impact assessment:**
    ```
    Run ARCH-CHANGE-IMPACT gate:
    - List all modified files
    - Breaking changes flagged
    - Migration requirements documented
    - Rollback plan defined (if breaking changes)
    
    Verdicts: LOW_IMPACT | MEDIUM_IMPACT | HIGH_IMPACT
    
    Present impact assessment to user
    ```

22. **Final user confirmation:**
    - Show epic completion summary:
      - Stories implemented: [count]
      - Test coverage: [percentage]
      - Quality gates: [all passed]
      - Change impact: [verdict]
    - Ask: "Ready to mark epic complete?"

23. **Epic Done:**
    - Update epic status to DONE
    - Generate summary report
    - Archive working artifacts

---

## Quality Gate Enforcement Points

| Phase | Gate | Blocking | Purpose |
|-------|------|----------|---------|
| 2 | User Approval | Yes | Validate epic breakdown |
| 3 | ARCH-FEASIBILITY | Yes | Validate technical viability |
| 3 | ARCH-REVIEW | Yes | Validate architecture decisions |
| 4 | SPEC-READY | Yes | Ensure story readiness |
| 5 | CODE-REVIEW | Yes | Validate implementation quality |
| 6 | ACCEPTANCE | Yes | Validate story completion |
| 7 | RELEASE-READY | Yes | Validate epic readiness |
| 7 | ARCH-CHANGE-IMPACT | Advisory | Assess deployment risk |

---

## Agent Selection Logic

**Tier 1 (Strategic):**
- `product-director` → Product vision, feature prioritization, strategic direction
- `chief-architect` → Architecture decisions, technology choices (via architecture-review skill)
- `engineering-manager` → Cross-domain conflicts, scope/priority escalations

**Tier 2 (Department Leads):**
- `product-manager` → Epic breakdown, user stories, acceptance criteria
- `tech-lead` → Technical approach, code architecture, cross-domain coordination
- `backend-lead` → Backend system design, API contracts
- `frontend-lead` → Frontend architecture, component design
- `ml-architect` → ML system design, model selection
- `design-lead` → Design system, UX patterns

**Tier 3 (Specialists):**
- Via `kanban-worker` skill → delegates to appropriate specialist based on story type

---

## Escalation Paths

**Technical Issue:**
```
Specialist → Lead → Tech Lead → Chief Architect → User
```

**Product Ambiguity:**
```
Implementer → Product Manager → Product Director → User
```

**Cross-Domain Conflict:**
```
Lead A + Lead B → Tech Lead or Engineering Manager → User
```

**Scope/Priority:**
```
Any Agent → Engineering Manager → User
```

---

## Ask-Before-Write Enforcement

**Never write without explicit user approval:**

1. **Proposals always precede implementation:**
   - Product Director proposes vision options → user chooses
   - Product Manager proposes story breakdown → user approves
   - Tech Lead proposes technical approach → user approves
   - Specialists propose implementation → user approves → write

2. **Multi-file changes require explicit confirmation:**
   ```
   Agent: "May I write these changes?
   - docs/stories/user-profile-page.md (new)
   - docs/architecture/adr-023-user-data-model.md (new)
   - apps/api/src/users/profile.ts (new)
   
   Approve?"
   
   Wait for user "yes" before writing
   ```

3. **Major decisions always surfaced:**
   - Architecture choices
   - Breaking changes
   - Cross-domain impacts
   - Scope changes

---

## Example Usage

**User:** "Add a recommendation engine that suggests products based on user behavior"

**Orchestrator execution:**

1. **Phase 1:** Product Director clarifies: ML-based or rule-based? Real-time or batch? User chooses ML + real-time
2. **Phase 2:** Product Manager breaks into 6 stories: data collection, feature engineering, model training, API endpoint, frontend integration, A/B testing
3. **Phase 3:** Chief Architect creates ADR for ML architecture (feature store, model serving, monitoring)
4. **Phase 4:** All stories pass SPEC-READY gate
5. **Phase 5:** 
   - Story 1 → Data Engineer implements data pipeline
   - Story 2 → Data Scientist implements feature engineering
   - Story 3 → ML Engineer trains recommendation model
   - Story 4 → API Developer builds serving endpoint
   - Story 5 → Frontend Developer adds recommendation widget
   - Story 6 → MLOps Engineer sets up A/B testing
6. **Phase 6:** Each story passes ACCEPTANCE gate with test evidence
7. **Phase 7:** Integration tests pass, RELEASE-READY, user approves

**Result:** Complete feature delivered with quality gates enforced, ask-before-write maintained, proper documentation, test evidence

---

## Notes

- **Adapt to project scale:** For small features, some phases can be lightweight (e.g., skip ADR for trivial changes)
- **Parallel work:** Stories without dependencies can be implemented in parallel via multiple kanban-worker instances
- **Workflow mode awareness:** In "minimal" mode, some gates are advisory; in "full" mode, all gates are blocking
- **Session continuity:** Track progress in session state; orchestrator can resume if interrupted
- **User in control:** Every significant decision (vision, breakdown, architecture, implementation) requires user approval

---

## Success Criteria

✅ Epic broken down into clear, implementable stories  
✅ All architecture decisions documented in ADRs  
✅ Each story has acceptance criteria and test evidence  
✅ Quality gates enforced at each phase  
✅ Ask-before-write protocol maintained throughout  
✅ User approves all significant decisions  
✅ Integration tests validate cross-story functionality  
✅ Epic marked DONE only after user confirmation
