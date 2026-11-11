---
name: kanban-worker
description: Implements a single story/task by delegating to the right specialist agent, runs code-review and quality gates before marking done
platforms: [darwin, linux, win32]
---

# Kanban Worker Skill

Implements a single user story or task by delegating to the appropriate specialist agent (api-developer, frontend-dev, ml-engineer, etc.), running code review and quality gates before marking the story done. Works as the execution engine called by kanban-orchestrator or used standalone for individual stories.

## When to Use

- Implement a single, well-specified user story
- Story has clear acceptance criteria and technical approach defined
- Story passed SPEC-READY gate
- Need specialist expertise (backend, frontend, ML, infrastructure, etc.)

## Prerequisites

- Ultra-AI agent studio system at `/opt/data/Ultra-AI`
- Story context with:
  - Title and description
  - Acceptance criteria (testable, observable)
  - Story type (feature, api, ui, data, ml, config, refactor, bug)
  - Technical approach defined
  - Dependencies resolved
- User approval required for all file writes (ask-before-write)

## Input Context Required

```yaml
story:
  id: "STORY-123"
  title: "Add user authentication API endpoint"
  description: "As a developer, I want a /auth/login endpoint so users can authenticate"
  type: "api"  # feature|api|ui|data|ml|config|refactor|bug
  acceptance_criteria:
    - "POST /api/auth/login accepts email and password"
    - "Returns JWT token on success"
    - "Returns 401 on invalid credentials"
    - "Rate limiting: 5 attempts per minute"
  technical_approach: "Fastify route with bcrypt password validation, JWT signing, Redis rate limiter"
  domains: ["backend"]
  dependencies: []  # Must be resolved before starting
  adr_references: ["ADR-012-jwt-authentication"]
```

## Workflow

### Phase 1: Story Analysis & Agent Selection

**Goal:** Understand the story and select the right specialist

1. **Validate story readiness:**
   - Check acceptance criteria exist and are testable
   - Verify technical approach is defined
   - Confirm dependencies are resolved
   - Ensure ADR references are valid (if applicable)

2. **Select specialist agent based on story type:**

   **Backend stories (api, data, refactor with backend code):**
   ```
   Type: api → api-developer
   Type: data, schema changes → database-engineer
   Type: backend services, jobs, caching → systems-engineer
   Type: general backend → backend-developer
   ```

   **Frontend stories (ui, feature with frontend):**
   ```
   Type: ui, components → ui-developer
   Type: ui + API integration → frontend-integrator
   Type: general frontend → frontend-developer
   ```

   **ML/AI stories (ml, data pipelines):**
   ```
   Type: ml, model training → ml-engineer
   Type: ml deployment → mlops-engineer
   Type: data analysis, features → data-scientist
   Type: data pipelines → data-engineer
   ```

   **Infrastructure stories (config, deployment):**
   ```
   Type: cloud resources → cloud-engineer
   Type: CI/CD, automation → devops-engineer
   Type: containers, platform → platform-engineer
   Type: security, auth implementation → security-engineer
   ```

   **Quality & Design stories:**
   ```
   Type: testing → qa-engineer
   Type: performance → performance-engineer
   Type: UX design → ux-designer
   Type: visual design → visual-designer
   ```

3. **Identify domain lead for review:**
   - Backend → backend-lead
   - Frontend → frontend-lead
   - ML → ml-architect
   - Infrastructure → devops-lead
   - Design → design-lead

---

### Phase 2: Implementation Delegation

**Goal:** Specialist implements the story following ask-before-write protocol

4. **Delegate to selected specialist:**
   ```
   delegate_task(
     agent: "[selected-specialist]",
     task: "Implement story: [STORY_TITLE]
     
     Story ID: [ID]
     Type: [TYPE]
     
     Description: [DESCRIPTION]
     
     Acceptance Criteria:
     [list each criterion with checkbox]
     
     Technical Approach: [APPROACH]
     
     ADR References: [list ADRs to read]
     
     Instructions:
     1. Read referenced ADRs and existing code to understand patterns
     2. Propose implementation approach (file structure, key decisions)
     3. Ask clarifying questions if spec is ambiguous
     4. Get user approval on approach before coding
     5. Implement following the approved architecture
     6. Write tests for each acceptance criterion
     7. Show implementation and ask: 'May I write these files?'
     8. Wait for explicit user approval before writing
     9. After writing, run tests and report results
     
     Required test evidence for story type '[TYPE]':
     [list type-specific test requirements from table below]
     
     DO NOT write any files without explicit user approval.
     DO NOT skip tests - test evidence is required.
     ASK about edge cases not covered in acceptance criteria."
   )
   ```

5. **Monitor implementation:**
   - Track specialist's progress
   - Surface questions to user immediately
   - Enforce ask-before-write at every file operation
   - Capture file changes for review

6. **Handle ambiguities:**
   ```
   If specialist identifies ambiguity or spec gap:
   - Surface to user immediately
   - Get clarification or decision
   - Update story context if scope changes
   - Resume implementation with clarified direction
   ```

---

### Phase 3: Test Evidence Collection

**Goal:** Ensure appropriate tests exist for the story type

7. **Verify test evidence based on story type:**

   | Story Type | Required Test Evidence |
   |------------|------------------------|
   | **feature** | Unit tests + integration tests + acceptance screenshots/demo |
   | **api** | API tests (request/response) + contract tests + OpenAPI spec updated |
   | **ui** | Component tests + visual regression (snapshots) + accessibility scan (WCAG) |
   | **data** | Migration tests (up/down) + rollback tests + data validation checks |
   | **ml** | Training metrics logged + evaluation results + inference tests (sample predictions) |
   | **config** | Smoke tests (services start) + rollback plan documented |
   | **refactor** | Existing tests pass + coverage maintained or improved |
   | **bug** | Regression test (reproduces bug, now passes) + root cause documented |

8. **Run test suite:**
   ```
   Specialist executes tests and collects evidence:
   - Test framework output (pass/fail counts)
   - Coverage report (line/branch/function percentages)
   - Failed tests (if any) with error messages
   - Screenshots or recordings (for UI tests)
   - Performance metrics (for performance-sensitive features)
   ```

9. **Validate coverage:**
   ```
   Check test coverage meets thresholds:
   - New code: ≥80% coverage (lines)
   - Critical paths: 100% coverage
   - Edge cases: explicitly tested
   
   If coverage insufficient:
   - Specialist adds missing tests
   - Re-run coverage check
   ```

---

### Phase 4: Code Review Gate

**Goal:** Validate implementation quality before marking done

10. **Prepare code review context:**
    ```
    Collect implementation artifacts:
    - List of files created/modified
    - Code diff (if available)
    - Test results and coverage
    - Lint/formatter output
    - Security scan results (if applicable)
    ```

11. **Delegate to domain lead for review:**
    ```
    delegate_task(
      agent: "[domain-lead]",
      task: "Code review for story: [STORY_TITLE]
      
      Story ID: [ID]
      Implemented by: [specialist-agent]
      
      Files changed:
      [list each file with new/modified/deleted status]
      
      Implementation approach:
      [brief summary from specialist]
      
      Test results:
      - Tests passing: [count]
      - Coverage: [percentage]
      - Test evidence: [type-specific evidence]
      
      Please review for:
      1. Code quality (readability, maintainability, patterns)
      2. Architecture adherence (follows ADRs, tech approach)
      3. Error handling and edge cases
      4. Security concerns (input validation, auth, data exposure)
      5. Performance implications
      6. Documentation (comments, API docs, README updates)
      
      Run CODE-REVIEW gate and return verdict:
      - APPROVE: Ready to merge
      - APPROVE_WITH_SUGGESTIONS: Acceptable, minor suggestions
      - CHANGES_REQUIRED: Issues that must be fixed
      
      Provide specific, actionable feedback."
    )
    ```

12. **Run CODE-REVIEW gate:**
    ```
    Execute CODE-REVIEW gate with context:
    - File path and content
    - Language and purpose
    - Test coverage percentage
    - Lint errors (if any)
    - Security warnings (if any)
    
    Gate returns verdict: APPROVE | APPROVE_WITH_SUGGESTIONS | CHANGES_REQUIRED
    ```

13. **Handle review feedback:**
    ```
    If CHANGES_REQUIRED:
    - Extract specific issues from domain lead feedback
    - Delegate back to specialist with fix list
    - Specialist addresses each issue
    - Re-run CODE-REVIEW gate
    - Loop until APPROVE or APPROVE_WITH_SUGGESTIONS
    
    If APPROVE_WITH_SUGGESTIONS:
    - Present suggestions to user
    - Ask: "Accept as-is or address suggestions?"
    - If user wants suggestions addressed, loop back to specialist
    - Otherwise, proceed to acceptance
    
    If APPROVE:
    - Proceed to acceptance gate
    ```

---

### Phase 5: Story Acceptance

**Goal:** Validate story meets all acceptance criteria and is ready to mark done

14. **Run ACCEPTANCE gate:**
    ```
    Execute ACCEPTANCE gate checking:
    
    ✅ Acceptance Criteria Verified:
    - Each criterion has evidence (test output, screenshot, review confirmation)
    - Traceability: map each criterion to test or verification method
    
    ✅ Test Evidence Complete:
    - Required tests exist per story type (from table above)
    - Coverage meets standards (≥80% for new code)
    - No skipped/disabled tests without justification
    
    ✅ Code Quality:
    - CODE-REVIEW gate passed
    - Linting/formatting checks pass
    - No security or vulnerability warnings
    
    ✅ Documentation:
    - API docs updated (if API changes)
    - README/setup updated (if setup changes)
    - ADR created (if architecture decision made)
    - Inline comments for complex logic
    
    ✅ No Deviations:
    - No unplanned scope changes
    - Any deviations from spec documented and approved by user
    
    Gate returns verdict: ACCEPTED | REVISIONS_NEEDED | REJECTED
    ```

15. **Present acceptance results to user:**
    ```
    Show user:
    - Acceptance gate verdict and reasoning
    - Acceptance criteria checklist (all checked)
    - Test evidence summary
    - Code review outcome
    - Files changed summary
    
    Ask: "Does this implementation meet your expectations?"
    ```

16. **Handle acceptance verdict:**
    ```
    If ACCEPTED + user confirms:
    - Mark story DONE
    - Document completion (timestamp, implementing agent, test evidence location)
    - Return success to orchestrator (if called from kanban-orchestrator)
    
    If REVISIONS_NEEDED:
    - Show specific revisions needed
    - Delegate back to specialist with revision list
    - Re-run acceptance after revisions
    
    If REJECTED:
    - Escalate to Product Manager and Tech Lead
    - Present issue: implementation doesn't meet criteria
    - Options: rework with different approach, split story, cancel
    - User decides next action
    ```

---

### Phase 6: Completion & Handoff

**Goal:** Clean up and prepare story for integration

17. **Generate story completion artifact:**
    ```
    Create completion summary:
    - Story ID and title
    - Implementation date and specialist
    - Files changed (with paths)
    - Test evidence locations
    - Code review verdict and reviewer
    - Acceptance gate verdict
    - User confirmation timestamp
    - Known limitations or follow-up items
    ```

18. **Update story status:**
    ```
    Mark story as DONE in tracking system:
    - Status: DONE
    - Completed by: [specialist-agent]
    - Reviewed by: [domain-lead]
    - Test coverage: [percentage]
    - User accepted: [timestamp]
    ```

19. **Return to orchestrator (if applicable):**
    ```
    If called by kanban-orchestrator, return:
    {
      story_id: "[ID]",
      status: "DONE",
      files_changed: ["file1.ts", "file2.ts", ...],
      test_coverage: 85,
      gate_results: {
        code_review: "APPROVE",
        acceptance: "ACCEPTED"
      },
      completion_time: "[timestamp]"
    }
    ```

---

## Agent Selection Reference

### By Story Type

```
api              → api-developer
ui               → ui-developer
feature (mixed)  → Analyze domains, may need multiple specialists
data/schema      → database-engineer
ml               → ml-engineer
config           → devops-engineer or cloud-engineer
refactor         → Specialist for affected domain
bug              → Specialist for affected domain
```

### By Domain

```
Backend:
- API endpoints, controllers → api-developer
- Database, migrations → database-engineer
- Services, jobs, queues → systems-engineer
- General backend logic → backend-developer

Frontend:
- Components, styling → ui-developer
- State, routing, API calls → frontend-integrator
- General frontend → frontend-developer

ML/AI:
- Model training → ml-engineer
- Model deployment → mlops-engineer
- Data analysis → data-scientist
- Data pipelines → data-engineer

Infrastructure:
- Cloud resources → cloud-engineer
- CI/CD, scripts → devops-engineer
- Containers, K8s → platform-engineer
- Security, auth → security-engineer

Quality:
- Testing → qa-engineer
- Performance → performance-engineer

Design:
- UX flows → ux-designer
- Visual design → visual-designer
```

---

## Escalation Paths

**Specialist encounters issue:**
```
Specialist → Domain Lead → Tech Lead (if cross-domain) → User
```

**Ambiguous specification:**
```
Specialist → Domain Lead → Product Manager → User
```

**Technical blocker:**
```
Specialist → Domain Lead → Tech Lead → Chief Architect → User
```

**Scope change discovered:**
```
Specialist → Domain Lead → Product Manager + Tech Lead → Engineering Manager → User
```

---

## Ask-Before-Write Enforcement

**Critical: Never write without user approval**

1. **Proposal phase:**
   ```
   Specialist: "I propose implementing this as [approach]. 
   This will create/modify these files:
   - platform/backend/core-api/src/auth/login.ts (new)
   - platform/backend/core-api/src/auth/login.test.ts (new)
   - platform/backend/core-api/src/routes.ts (edit - add route)
   
   Does this approach look correct?"
   
   [Wait for user confirmation]
   ```

2. **Implementation phase:**
   ```
   Specialist: "Implementation complete. May I write these files?
   - platform/backend/core-api/src/auth/login.ts (142 lines)
   - platform/backend/core-api/src/auth/login.test.ts (89 lines)
   - platform/backend/core-api/src/routes.ts (add 3 lines)
   
   [Show key code snippets if requested]"
   
   [Wait for explicit "yes" or "approve" from user]
   ```

3. **Never autonomous:**
   - No "I'll just write this small change" → ALWAYS ask
   - No "I assume you want this" → ALWAYS confirm
   - No "This is a trivial fix" → STILL ask

---

## Example Execution

**Story:** Add user profile API endpoint

**Input:**
```yaml
story:
  id: "US-42"
  title: "Add GET /api/users/:id/profile endpoint"
  type: "api"
  acceptance_criteria:
    - "Returns user profile with name, email, avatar"
    - "Returns 404 if user not found"
    - "Returns 401 if not authenticated"
  technical_approach: "Fastify route, query users table, return sanitized profile"
  domains: ["backend"]
```

**Execution:**

1. **Agent selection:** Story type "api" → select `api-developer`

2. **Delegation:**
   ```
   Delegate to api-developer with story context and instructions
   ```

3. **Implementation:**
   - API Developer proposes route handler structure
   - User approves
   - API Developer implements endpoint + tests
   - API Developer asks: "May I write these 2 files?"
   - User approves
   - Files written

4. **Testing:**
   - API Developer runs test suite: 8/8 passing
   - Coverage: 94% (new endpoint fully covered)
   - Evidence: API test demonstrates all 3 acceptance criteria

5. **Code Review:**
   - Delegate to backend-lead for review
   - CODE-REVIEW gate: APPROVE_WITH_SUGGESTIONS (add rate limiting)
   - Present to user: "Accept as-is or add rate limiting?"
   - User: "Accept as-is for now"

6. **Acceptance:**
   - Run ACCEPTANCE gate: ACCEPTED (all criteria met, tests pass, review approved)
   - User confirms: "Looks good"
   - Mark story DONE

7. **Completion:**
   - Generate summary: US-42 implemented by api-developer, 2 files, 94% coverage
   - Return success to orchestrator

**Result:** Story done in 1 iteration, quality gates passed, user in control

---

## Quality Gate Summary

| Gate | Phase | Verdict Options | Blocking |
|------|-------|-----------------|----------|
| CODE-REVIEW | 4 | APPROVE / APPROVE_WITH_SUGGESTIONS / CHANGES_REQUIRED | Yes |
| ACCEPTANCE | 5 | ACCEPTED / REVISIONS_NEEDED / REJECTED | Yes |

Additional type-specific gates may apply:
- API-CONTRACT for API stories
- TEST-COVERAGE for all stories
- ACCESSIBILITY for UI stories
- UX-REVIEW for design stories

---

## Success Criteria

✅ Story implemented by appropriate specialist  
✅ All acceptance criteria verified with evidence  
✅ Tests written and passing (type-specific)  
✅ Code review passed (APPROVE or APPROVE_WITH_SUGGESTIONS)  
✅ Acceptance gate passed  
✅ User confirmed implementation meets expectations  
✅ Ask-before-write enforced throughout  
✅ Story marked DONE with completion artifact

---

## Notes

- **Single responsibility:** This skill implements ONE story. For epics, use kanban-orchestrator
- **Specialist selection is critical:** Wrong specialist = wrong patterns/approach
- **Test evidence non-negotiable:** Cannot mark DONE without required tests for story type
- **User approval required:** Every file write needs explicit user "yes"
- **Resume capability:** Can resume if interrupted (check what files already written)
- **Escalate early:** Don't struggle with blockers - escalate to domain lead immediately
