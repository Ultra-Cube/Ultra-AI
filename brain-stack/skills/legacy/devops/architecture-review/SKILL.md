---
name: architecture-review
description: Orchestrates an architecture decision through the ADR workflow, gathers context, delegates to chief-architect for options, runs architecture gates, produces ADR doc
platforms: [darwin, linux, win32]
---

# Architecture Review Skill

Orchestrates architecture decision-making through a structured ADR (Architecture Decision Record) workflow. Gathers context, delegates to chief-architect for strategic options, runs architecture feasibility and review gates, and produces an accepted ADR document. Enforces ask-before-write protocol throughout.

## When to Use

- Need to make a significant architecture decision (technology choice, system design, data model)
- Feature requires architectural changes or new patterns
- Considering trade-offs between multiple technical approaches
- Want to document architecture decisions for future reference
- Resolving technical conflicts or constraints

## Prerequisites

- Ultra-AI agent studio system at `/opt/data/Ultra-AI`
- Chief Architect agent (Tier 1) available
- ADR template and numbering system (docs/architecture/adr-NNN-title.md)
- Context about the decision needed (problem statement, constraints, requirements)

## Input Context Required

```yaml
decision:
  title: "Caching Strategy for API"
  problem: "API response times exceed 200ms under load; 80% of requests are reads"
  constraints:
    - "Must support multi-region deployment"
    - "Budget: $500/month for caching infrastructure"
    - "Must handle 10K requests/second at peak"
  requirements:
    - "Read latency < 50ms"
    - "Write-through or write-behind consistency"
    - "TTL-based expiration"
  context:
    - "Current stack: Node.js, PostgreSQL"
    - "Deployment: AWS (us-east-1, eu-west-1)"
    - "Team experience: Redis, Memcached"
```

## Workflow

### Phase 1: Context Gathering

**Goal:** Collect all information needed for informed architecture decision

1. **Capture decision request:**
   - Read user's architecture question or requirement
   - Extract problem statement
   - Note any explicitly stated constraints or requirements

2. **Ask clarifying questions:**
   ```
   Essential context needed:
   - What problem are we solving? (performance, scalability, maintainability, etc.)
   - What are the hard constraints? (budget, timeline, team skills, regulations)
   - What are the functional requirements? (specific capabilities needed)
   - What is the scale? (users, requests/sec, data volume, growth rate)
   - What is the impact? (which systems/teams affected, breaking changes?)
   - What decisions are already made? (existing ADRs, tech stack, patterns)
   
   Present questions to user and collect answers
   ```

3. **Gather existing context:**
   ```
   Read relevant existing artifacts:
   - Related ADRs (docs/architecture/adr-*.md)
   - Current architecture docs (docs/architecture/)
   - Technical approach from stories (if part of feature work)
   - System constraints (performance budgets, security requirements)
   - Technology inventory (what's already in use)
   ```

4. **Structure decision context:**
   ```
   Organize into decision brief:
   
   Decision Brief: [TITLE]
   
   Problem Statement:
   [Clear description of what needs to be decided and why]
   
   Hard Constraints:
   - [Non-negotiable requirements]
   - [Budget/timeline limits]
   - [Technical limitations]
   - [Regulatory/compliance requirements]
   
   Functional Requirements:
   - [Specific capabilities needed]
   - [Performance targets]
   - [Quality attributes (reliability, security, etc.)]
   
   Scale & Context:
   - Current scale: [metrics]
   - Target scale: [growth projection]
   - Affected systems: [list]
   - Team capabilities: [relevant skills]
   
   Related ADRs:
   - [ADR-XXX: relevant previous decisions]
   ```

5. **Checkpoint:** User confirms decision brief is complete and accurate

---

### Phase 2: Architecture Feasibility Assessment

**Goal:** Validate that solving this problem is technically feasible

6. **Prepare feasibility context:**
   ```
   Extract for ARCH-FEASIBILITY gate:
   - Feature name/description
   - Requirements list
   - Constraints
   - Performance budgets (if applicable)
   - Security requirements (if applicable)
   - Test strategy (planned)
   ```

7. **Run ARCH-FEASIBILITY gate:**
   ```
   Execute ARCH-FEASIBILITY gate with feature context:
   
   Checks:
   - Requirements clearly specified and achievable
   - Performance budgets defined (for performance-critical features)
   - Security requirements explicit (for auth/user features)
   - Constraints reasonable (not over-constrained)
   - Test strategy planned
   
   Verdicts: VIABLE | CONCERNS | HIGH_RISK | NOT_ASSESSED
   
   If NOT_ASSESSED:
   - Missing required inputs (gate specifies what's missing)
   - Gather missing information
   - Re-run gate
   
   If HIGH_RISK:
   - Show blockers to user
   - Options:
     a. Relax constraints
     b. Reduce scope
     c. Accept risk with mitigation plan
   - User decides how to proceed
   
   If CONCERNS:
   - Show recommendations
   - Address concerns or proceed with awareness
   - User decides
   
   If VIABLE:
   - Proceed to option generation
   ```

8. **Checkpoint:** Feasibility gate passes (VIABLE or CONCERNS with plan) before proceeding

---

### Phase 3: Option Generation

**Goal:** Chief Architect generates 2-3 viable options with trade-offs

9. **Delegate to Chief Architect (Tier 1):**
   ```
   delegate_task(
     agent: "chief-architect",
     task: "Generate architecture options for decision: [TITLE]
     
     Decision Brief:
     [paste full decision brief from Phase 1]
     
     Feasibility Assessment:
     [paste gate result from Phase 2]
     
     Instructions:
     1. Generate 2-3 viable architecture options
     2. For each option, provide:
        - Approach summary (2-3 sentences)
        - Pros (specific benefits)
        - Cons (specific drawbacks and risks)
        - Cost estimate (if applicable)
        - Implementation complexity (low/medium/high)
        - Key trade-offs
     3. Recommend ONE option with clear rationale
     4. DO NOT make the decision autonomously
     5. Present options for user to choose
     
     Output format:
     
     ## Option 1: [Name] (Recommended/Not Recommended)
     **Approach:** [description]
     **Pros:**
     - [benefit 1]
     - [benefit 2]
     **Cons:**
     - [drawback 1]
     - [drawback 2]
     **Cost:** [estimate]
     **Complexity:** [low/medium/high]
     **Trade-offs:** [key decisions this option makes]
     
     [Repeat for Options 2 and 3]
     
     ## Recommendation
     I recommend Option [N] because [rationale tied to requirements and constraints].
     However, the final decision should consider [additional factors user might prioritize]."
   )
   ```

10. **Present options to user:**
    ```
    Show Chief Architect's analysis:
    - All options with full details
    - Trade-off comparison
    - Recommendation with rationale
    
    Ask: "Which architecture option do you prefer?"
    
    Additional questions:
    - "Do you need any options clarified?"
    - "Are there alternative approaches we should consider?"
    - "Do any constraints need adjustment?"
    ```

11. **Capture user decision:**
    ```
    Record:
    - Selected option (1, 2, 3, or custom)
    - User's rationale (if provided)
    - Any modifications to selected option
    - Rejected options (and why, if stated)
    ```

---

### Phase 4: Architecture Review Gate

**Goal:** Validate the chosen architecture meets standards

12. **Prepare architecture review context:**
    ```
    Build StoryContext for ARCH-REVIEW gate:
    - Title: [Decision title]
    - Description: [Problem statement + chosen solution]
    - Technical approach: [Selected option details]
    - ADR references: [Related ADRs]
    - Type: "feature" (or appropriate type)
    - Dependencies: [Affected systems]
    - Open questions: [Any remaining unknowns]
    ```

13. **Run ARCH-REVIEW gate:**
    ```
    Execute ARCH-REVIEW gate:
    
    Checks:
    - Technical approach documented (from chosen option)
    - ADR references cited (related decisions)
    - Open questions resolved (no TBD/TODO markers)
    - Dependencies reasonable (not over-complex)
    
    Verdicts: APPROVE | REVISE | REJECT | NOT_ASSESSED
    
    If NOT_ASSESSED:
    - Missing required input (technical approach)
    - Should not happen at this phase - escalate
    
    If REJECT:
    - Show blockers (e.g., unresolved questions, missing ADRs)
    - Options:
       a. Resolve blockers (answer questions, create dependency ADRs)
       b. Return to Chief Architect for revised option
       c. Escalate to user for decisions on open questions
    - Address blockers
    - Re-run gate
    
    If REVISE:
    - Show recommendations (e.g., reference ADRs, simplify dependencies)
    - Delegate back to Chief Architect to address
    - Re-run gate after revisions
    
    If APPROVE:
    - Architecture meets standards
    - Proceed to ADR creation
    ```

14. **Checkpoint:** Architecture review gate passes (APPROVE) before documenting

---

### Phase 5: ADR Document Creation

**Goal:** Document the architecture decision in a structured ADR

15. **Determine ADR number:**
    ```
    Find next ADR number:
    - List existing ADRs in docs/architecture/
    - Pattern: adr-NNN-title.md
    - Find highest NNN
    - Next ADR = NNN + 1
    
    Example: If adr-023-jwt-auth.md exists, next is adr-024-[slug].md
    ```

16. **Generate ADR slug:**
    ```
    Create URL-friendly slug from title:
    - Lowercase
    - Replace spaces with hyphens
    - Remove special characters
    - Max 50 characters
    
    Example: "Caching Strategy for API" → "caching-strategy-for-api"
    ```

17. **Delegate to Technical Writer (Tier 3) for ADR drafting:**
    ```
    delegate_task(
      agent: "technical-writer",
      task: "Write Architecture Decision Record: [TITLE]
      
      ADR Number: [NNN]
      ADR Filename: adr-[NNN]-[slug].md
      
      Decision Context:
      [paste decision brief from Phase 1]
      
      Options Considered:
      [paste all options from Chief Architect]
      
      Chosen Option: Option [N]
      User Rationale: [if provided]
      
      Architecture Review: APPROVED
      Feasibility: [VIABLE/CONCERNS with details]
      
      Please write ADR following this structure:
      
      # ADR-[NNN]: [Title]
      
      **Status:** Proposed  
      **Date:** [YYYY-MM-DD]  
      **Deciders:** [Chief Architect, User, other stakeholders]  
      **Technical Story:** [Link to story/epic if applicable]  
      
      ## Context
      [Problem statement, constraints, requirements from decision brief]
      
      ## Decision
      We will [chosen option summary].
      
      [Detailed explanation of chosen approach]
      
      ## Considered Options
      
      ### Option 1: [Name]
      [Brief summary, pros/cons]
      
      ### Option 2: [Name]
      [Brief summary, pros/cons]
      
      [Continue for all options]
      
      ## Decision Rationale
      [Why we chose this option, how it meets requirements, trade-offs accepted]
      
      ## Consequences
      
      ### Positive
      - [Benefit 1]
      - [Benefit 2]
      
      ### Negative
      - [Cost/drawback 1]
      - [Cost/drawback 2]
      
      ### Risks
      - [Risk 1 and mitigation]
      - [Risk 2 and mitigation]
      
      ## Implementation Notes
      [Specific guidance for implementers, gotchas, dependencies]
      
      ## Related Decisions
      - [ADR-XXX]: [How it relates]
      
      ## References
      - [Documentation, blog posts, papers cited]
      
      ---
      
      DO NOT write the file yet - show me the draft for approval."
    )
    ```

18. **Review ADR draft:**
    ```
    Present draft to user:
    - Show complete ADR content
    - Highlight key sections (decision, rationale, consequences)
    
    Ask:
    - "Does this ADR accurately capture the decision?"
    - "Any corrections or additions needed?"
    - "Ready to write this to docs/architecture/adr-[NNN]-[slug].md?"
    ```

19. **Write ADR file:**
    ```
    After user approval:
    
    Technical Writer asks:
    "May I write this ADR to docs/architecture/adr-[NNN]-[slug].md?"
    
    User confirms: "yes"
    
    Write file to docs/architecture/adr-[NNN]-[slug].md
    
    Set status: Proposed (will change to Accepted after implementation validates it)
    ```

---

### Phase 6: Change Impact Assessment

**Goal:** Understand the blast radius of implementing this decision

20. **Identify affected systems:**
    ```
    Based on chosen architecture option, identify:
    - Code modules that need changes
    - APIs that need updates
    - Databases/schemas affected
    - Infrastructure changes required
    - Teams that need coordination
    - Deployment/rollout considerations
    ```

21. **Prepare change impact context:**
    ```
    Build ChangesetContext for ARCH-CHANGE-IMPACT gate:
    - Files: [estimated list of affected files/modules]
    - Description: [summary of changes required]
    - Impacted systems: [list from above]
    - Breaking changes: [yes/no with details]
    - Migration required: [yes/no with details]
    - Rollback plan: [if breaking changes]
    ```

22. **Run ARCH-CHANGE-IMPACT gate:**
    ```
    Execute ARCH-CHANGE-IMPACT gate:
    
    Assesses:
    - Number of files affected
    - Breaking changes (requires migration + rollback plan)
    - Number of systems impacted
    - Migration requirements
    
    Verdicts: LOW_IMPACT | MEDIUM_IMPACT | HIGH_IMPACT | NOT_ASSESSED
    
    If HIGH_IMPACT:
    - Must have migration plan
    - Must have rollback plan
    - Coordinate testing across impacted systems
    - Consider phased rollout
    
    If MEDIUM_IMPACT:
    - Document rollback procedure recommended
    - Standard coordination sufficient
    
    If LOW_IMPACT:
    - Limited scope, standard process
    ```

23. **Present impact assessment:**
    ```
    Show user:
    - Impact level (LOW/MEDIUM/HIGH)
    - Affected systems and teams
    - Migration requirements (if any)
    - Rollback plan (if needed)
    - Coordination needs
    - Implementation risk factors
    
    For HIGH_IMPACT:
    Ask: "Given the high impact, should we:
    - Proceed with full implementation?
    - Phase the rollout (pilot → gradual → full)?
    - Reduce scope to minimize impact?"
    ```

---

### Phase 7: Implementation Planning

**Goal:** Define next steps for implementing the architecture decision

24. **Generate implementation checklist:**
    ```
    Based on chosen option and impact assessment, create:
    
    Implementation Checklist for ADR-[NNN]:
    
    □ Pre-implementation:
      □ Create user stories for implementation work
      □ Update technical approach in affected stories
      □ Coordinate with affected teams: [list]
      □ Provision infrastructure (if needed): [details]
    
    □ Implementation:
      □ [Specific task 1 from chosen option]
      □ [Specific task 2]
      □ [Continue for key implementation steps]
    
    □ Testing:
      □ [Type-specific tests needed]
      □ Integration tests across affected systems
      □ Performance validation (if performance-related)
      □ Security review (if security-related)
    
    □ Documentation:
      □ Update architecture diagrams
      □ Update API documentation
      □ Update developer guides
      □ Team training (if new technology)
    
    □ Deployment:
      □ Migration script (if data migration)
      □ Rollback procedure tested
      □ Monitoring/alerting configured
      □ Phased rollout plan (if high impact)
    
    □ Post-deployment:
      □ Validate decision in production
      □ Update ADR status: Proposed → Accepted
      □ Document lessons learned
    ```

25. **Identify stories needing this ADR:**
    ```
    If this ADR was triggered by feature work:
    - List stories that depend on this decision
    - Update stories to reference: ADR-[NNN]
    - Ensure technical approach aligns with chosen option
    - Unblock stories now that architecture is decided
    ```

26. **Set up validation criteria:**
    ```
    Define "success" for this decision:
    
    "We'll know ADR-[NNN] was the right choice if:
    - [Measurable outcome 1 from requirements]
    - [Measurable outcome 2]
    - [Performance target met]
    - [Cost stays within budget]
    - [etc.]
    
    Measure after: [timeframe, e.g., 2 weeks post-deployment]"
    
    Add to ADR as validation criteria
    ```

---

### Phase 8: Finalization & Communication

**Goal:** Communicate decision and enable implementation

27. **Update ADR index:**
    ```
    If docs/architecture/README.md or ADR index exists:
    - Add entry for ADR-[NNN]
    - Link to file
    - Brief one-line summary
    - Status: Proposed
    ```

28. **Generate decision summary:**
    ```
    Create concise summary:
    
    Architecture Decision: [TITLE]
    ADR: docs/architecture/adr-[NNN]-[slug].md
    Status: Proposed (pending implementation)
    
    Decision: [One-sentence summary of chosen option]
    
    Impact: [LOW/MEDIUM/HIGH_IMPACT]
    Affected: [Systems/teams]
    
    Next Steps:
    1. [Most immediate action]
    2. [Second priority]
    3. [etc.]
    
    Implementation tracked in: [story IDs or epic reference]
    ```

29. **Notify affected stakeholders:**
    ```
    Identify who needs to know:
    - Domain leads for affected systems (backend-lead, frontend-lead, etc.)
    - Tech Lead (for cross-cutting decisions)
    - Engineering Manager (for high-impact decisions)
    - Implementing teams
    
    For orchestrated workflows:
    - Return ADR reference to kanban-orchestrator
    - Orchestrator notifies relevant agents
    
    For standalone use:
    - Present summary to user
    - User responsible for team communication
    ```

30. **Mark decision complete:**
    ```
    Architecture review complete:
    ✅ Decision made and documented in ADR-[NNN]
    ✅ Architecture gates passed (FEASIBLE, APPROVED)
    ✅ Impact assessed ([VERDICT])
    ✅ Implementation plan ready
    ✅ Stakeholders identified
    
    Status: Proposed (will become Accepted after implementation proves decision)
    ```

---

## Quality Gate Enforcement Points

| Phase | Gate | Blocking | Purpose |
|-------|------|----------|---------|
| 1 | User Approval | Yes | Validate decision brief is complete |
| 2 | ARCH-FEASIBILITY | Yes | Validate technical viability |
| 4 | ARCH-REVIEW | Yes | Validate architecture meets standards |
| 6 | ARCH-CHANGE-IMPACT | Advisory | Assess implementation risk |

---

## Agent Selection Logic

**Strategic Tier (Tier 1):**
- `chief-architect` → Generates architecture options, analyzes trade-offs, makes recommendations

**Supporting Tier (Tier 3):**
- `technical-writer` → Writes ADR document following standard structure

**Review/Validation:**
- Quality gates execute programmatically (no agent needed)

**Escalation (if needed):**
- `engineering-manager` → Coordinates high-impact decisions across teams
- `product-director` → Resolves product-vs-technical conflicts

---

## Escalation Paths

**Feasibility HIGH_RISK:**
```
architecture-review skill → User → Chief Architect (revisit constraints/requirements)
```

**Review gate REJECT:**
```
architecture-review skill → Chief Architect (resolve open questions) → User decision
```

**High-impact coordination:**
```
architecture-review skill → Engineering Manager (orchestrate cross-team) → Domain Leads
```

**Product-technical conflict:**
```
Chief Architect + Product Director → User decision
```

---

## Ask-Before-Write Enforcement

**ADR document is the only write operation:**

1. **Draft always shown first:**
   ```
   Technical Writer: "Here is the complete ADR draft:
   
   [full ADR content]
   
   Does this accurately capture the decision?"
   
   [Wait for user review and approval]
   ```

2. **Explicit write permission:**
   ```
   Technical Writer: "May I write this to docs/architecture/adr-[NNN]-[slug].md?"
   
   [Wait for user "yes"]
   ```

3. **No autonomous decisions:**
   - Chief Architect proposes options → user chooses
   - Never write ADR without user reviewing content
   - Never mark ADR as "Accepted" without implementation proof

---

## Example Execution

**User:** "Should we use Redis or Memcached for API caching?"

**Execution:**

1. **Context Gathering:**
   - Ask: "What's the use case? Scale? Persistence needs?"
   - User: "Session data + API cache, 10K RPS, sessions need persistence"
   - Decision brief compiled

2. **Feasibility:**
   - Run ARCH-FEASIBILITY: VIABLE (requirements clear, achievable)

3. **Option Generation:**
   - Chief Architect generates 3 options:
     - Option 1: Redis (recommended) - persistence, rich types, pub/sub
     - Option 2: Memcached - simpler, faster pure KV, no persistence
     - Option 3: Hybrid - Memcached for cache, Redis for sessions
   - User chooses: "Redis - persistence is important"

4. **Architecture Review:**
   - Run ARCH-REVIEW: APPROVE (approach clear, no open questions)

5. **ADR Creation:**
   - Technical Writer drafts ADR-024-redis-caching.md
   - User reviews: "Looks good"
   - User approves write
   - ADR written to docs/architecture/

6. **Impact Assessment:**
   - Run ARCH-CHANGE-IMPACT: MEDIUM_IMPACT (infrastructure + backend changes)
   - Present: "Need to provision Redis, update backend services"

7. **Implementation Planning:**
   - Checklist: provision Redis, update config, implement caching layer, add monitoring
   - Update stories: reference ADR-024
   - Notify backend-lead and devops-lead

8. **Complete:**
   - ADR-024 status: Proposed
   - Ready for implementation

**Result:** Architecture decision documented, gates passed, implementation ready, team aligned

---

## ADR Status Lifecycle

```
Proposed → (implementation happens) → Accepted
                                    ↓
                              (if proven wrong)
                                    ↓
                            Deprecated/Superseded
```

**Status meanings:**
- **Proposed:** Decision made, documented, awaiting implementation validation
- **Accepted:** Implemented and validated in production; decision proven correct
- **Deprecated:** Replaced by newer decision; documented for historical context
- **Superseded:** Explicitly replaced by ADR-XXX; link to replacement

**This skill creates ADRs in "Proposed" state.** After implementation proves the decision works, status manually updated to "Accepted".

---

## Notes

- **When to create ADR:** Significant decisions that affect system structure, major features, technology choices, or set precedents
- **When to skip ADR:** Trivial choices, temporary solutions, purely local changes (use decision log instead)
- **ADR vs decision log:** ADRs for architectural decisions; decision log (docs/decisions.md) for minor choices
- **Multiple related decisions:** Create separate ADRs for distinct choices; link them in "Related Decisions"
- **Consensus building:** For controversial decisions, Chief Architect facilitates discussion, but user makes final call
- **Retrospective ADRs:** Can document past decisions for historical record; mark status as "Accepted" with implementation date

---

## Success Criteria

✅ Decision context fully gathered and validated  
✅ Architecture feasibility confirmed (VIABLE or CONCERNS with plan)  
✅ 2-3 options generated with clear trade-offs  
✅ User chose option with informed decision  
✅ Architecture review passed (APPROVE)  
✅ ADR document written and approved by user  
✅ Change impact assessed  
✅ Implementation plan ready  
✅ Stakeholders identified and ready to be notified  
✅ Ask-before-write maintained throughout
