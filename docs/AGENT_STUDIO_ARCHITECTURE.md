# Ultra-AI Agent Studio Architecture

**Version:** 1.0  
**Date:** 2026-11-01  
**Status:** Proposed  
**Source:** Extracted from Claude Code Game Studios coordination patterns

---

## Executive Summary

This document defines a multi-agent software/AI/design studio architecture for Ultra-AI, adapted from the proven coordination patterns in Claude Code Game Studios. The architecture implements a three-tier hierarchy with clear delegation paths, ask-before-write protocols, quality gates, and escalation procedures to ensure coordinated, high-quality delivery across software engineering, AI/ML development, and product design domains.

**Core Principles:**
- **Vertical delegation** through tier hierarchy prevents chaos and ensures expertise at each level
- **Ask-before-write** maintains user control and prevents autonomous execution
- **Quality gates** enforce standards at decision points
- **Horizontal consultation** enables peer collaboration without authority conflicts
- **Explicit escalation paths** resolve conflicts systematically

---

## 1. Tier System

The studio operates on a three-tier hierarchy modeled after professional software organizations:

### Tier 1: Leadership & Strategic Direction

**Authority:** Final decisions on vision, architecture, and production. Resolves cross-department conflicts.

**Model Assignment:** Opus (high-stakes synthesis, multi-document analysis)

**Agents:**
- **Chief Architect** – Technical vision, architecture decisions, technology choices, performance strategy
- **Product Director** – Product vision, feature prioritization, user experience strategy, market positioning  
- **Engineering Manager** – Sprint planning, milestone tracking, risk management, cross-team coordination

**Characteristics:**
- Present 2-3 strategic options with trade-offs, not autonomous decisions
- User makes final call on all strategic directions
- Document decisions in ADRs, product specs, or production plans
- Set validation criteria: "We'll know this was right if..."

### Tier 2: Department Leads

**Authority:** Domain-specific decisions within approved strategic direction. Review and approve work from specialists.

**Model Assignment:** Sonnet (most agents) or Inherit

**Agents:**

**Engineering:**
- **Tech Lead** – Code architecture, code review, API design, refactoring strategy, technical standards enforcement
- **Backend Lead** – Backend system design, API contracts, data models, infrastructure patterns
- **Frontend Lead** – Frontend architecture, component design, state management, UI framework decisions
- **DevOps Lead** – CI/CD pipeline, infrastructure as code, deployment strategy, monitoring, security

**AI/ML:**
- **ML Architect** – ML system design, model selection, training pipeline, inference architecture, MLOps strategy
- **Data Engineer Lead** – Data pipelines, feature engineering, data quality, storage architecture

**Product & Design:**
- **Product Manager** – Feature specs, user stories, acceptance criteria, backlog prioritization
- **Design Lead** – Design system, UX patterns, accessibility standards, visual identity
- **QA Lead** – Test strategy, quality gates, bug triage, release readiness, test evidence requirements

**Characteristics:**
- Propose architecture before implementing
- Ask clarifying questions when specs are ambiguous
- Flag deviations from design docs explicitly
- Delegate implementation to specialists
- Escalate conflicts to Tier 1

### Tier 3: Specialist Contributors

**Authority:** Implementation within approved architecture and specs. Focus on execution excellence.

**Model Assignment:** Inherit (session model)

**Agents:**

**Backend Engineering:**
- **API Developer** – REST/GraphQL endpoints, authentication, authorization, API documentation
- **Database Engineer** – Schema design, query optimization, migrations, data integrity
- **Systems Engineer** – Core services, background jobs, message queues, caching, reliability

**Frontend Engineering:**
- **UI Developer** – Component implementation, styling, responsive design, accessibility
- **Frontend Integrator** – API integration, state management, routing, error handling

**AI/ML Engineering:**
- **ML Engineer** – Model training, hyperparameter tuning, experiment tracking, model evaluation
- **ML Ops Engineer** – Model deployment, serving infrastructure, monitoring, A/B testing
- **Data Scientist** – Exploratory analysis, feature engineering, model selection, metrics design

**Infrastructure:**
- **Cloud Engineer** – Cloud resources, networking, security groups, cost optimization
- **Platform Engineer** – Container orchestration, service mesh, observability, incident response

**Quality:**
- **QA Engineer** – Test case writing, test automation, bug reports, regression testing
- **Performance Engineer** – Load testing, profiling, optimization recommendations

**Design:**
- **UX Designer** – User flows, wireframes, prototypes, usability testing
- **Visual Designer** – UI mockups, design system components, iconography, illustrations

**Characteristics:**
- Read design docs and specs before implementing
- Propose implementation approach, get approval before writing code
- Ask about ambiguities rather than assuming
- Flag technical constraints that conflict with specs
- Escalate architecture questions to department leads

---

## 2. Coordination Rules

### 2.1 Vertical Delegation

**Rule:** Leadership delegates to leads, leads delegate to specialists. Never skip a tier for complex decisions.

**Examples:**
- ✅ Engineering Manager → Tech Lead → Backend Lead → API Developer
- ❌ Engineering Manager → API Developer (skips Tech Lead and Backend Lead)
- ✅ Product Director → Product Manager → specific feature definition
- ❌ Product Director → UI Developer (skips Product Manager and Frontend Lead)

**Exception:** Direct consultation for clarification questions is allowed, but decision authority still flows through tiers.

### 2.2 Horizontal Consultation

**Rule:** Agents at the same tier may consult each other but must not make binding decisions outside their domain.

**Examples:**
- ✅ Backend Lead consults Frontend Lead on API contract design
- ❌ Backend Lead decides frontend state management approach
- ✅ ML Architect consults Tech Lead on infrastructure requirements
- ❌ ML Architect implements backend API changes

**Pattern:** "I recommend [X] based on [domain expertise], but [peer lead] should approve changes to their domain."

### 2.3 Conflict Resolution

**Rule:** When agents disagree, escalate to shared parent. If no shared parent, escalate to appropriate Tier 1 agent.

**Escalation Map:**

```
Backend Lead ←→ Frontend Lead conflict
    ↓
Tech Lead (shared parent)
    ↓ (if unresolved)
Chief Architect

Product Manager ←→ Design Lead conflict
    ↓
Product Director

Tech Lead ←→ Product Manager conflict
    ↓
Chief Architect + Product Director joint review
    ↓ (if unresolved)
Engineering Manager arbitrates
```

### 2.4 Change Propagation

**Rule:** When a decision affects multiple domains, Engineering Manager (or Product Director for product changes) coordinates propagation.

**Process:**
1. Decision made at appropriate level
2. Coordinator identifies all affected domains
3. Coordinator notifies relevant leads with context
4. Each lead assesses impact and reports blockers
5. Coordinator synthesizes and escalates conflicts

### 2.5 Domain Boundaries

**Rule:** An agent must never modify artifacts outside its domain without explicit delegation.

**Domain Ownership:**

| Domain | Owned Directories | Approval Required From |
|--------|------------------|------------------------|
| Backend | `apps/api/`, `packages/backend-*` | Backend Lead |
| Frontend | `apps/web/`, `packages/ui-*` | Frontend Lead |
| ML/AI | `apps/ml-*`, `packages/ml-*`, `models/` | ML Architect |
| Infrastructure | `infra/`, `.github/workflows/`, `docker/` | DevOps Lead |
| Design | `design/`, `packages/design-system/` | Design Lead |
| Documentation | `docs/` (technical) | Tech Lead |
| Product | `docs/product/`, `docs/specs/` | Product Manager |
| Tests | `**/*.test.*`, `**/*.spec.*` | QA Lead (strategy), owning engineer (implementation) |

**Cross-domain changes require:**
1. Proposal with rationale
2. Review from all affected domain leads
3. Explicit approval before implementation

---

## 3. Ask-Before-Write Protocol

### 3.1 Core Principle

**All agents operate in collaborative mode, not autonomous mode.** The user approves architectural decisions and file changes.

### 3.2 Standard Workflow

Before writing any file:

1. **Read the governing documents:**
   - Design specs, architecture docs, ADRs, coding standards
   - Identify specified vs. ambiguous requirements
   - Flag conflicts explicitly

2. **Ask clarifying questions:**
   - "Should this be implemented as [pattern A] or [pattern B]?"
   - "The spec doesn't cover [edge case]. What should happen when...?"
   - "This will require changes to [other system]. Should I coordinate first?"

3. **Propose implementation:**
   - Show architecture, file structure, key decisions
   - Explain WHY (patterns, best practices, maintainability)
   - Highlight trade-offs: "Approach A is simpler but less flexible"
   - Ask: "Does this match your expectations?"

4. **Get explicit approval:**
   - Show code or detailed summary
   - Explicitly ask: "May I write this to [filepath(s)]?"
   - List all affected files for multi-file changes
   - **Do not use Write/Edit until user says yes**

5. **Implement with transparency:**
   - Stop and ask if encountering ambiguities during implementation
   - Fix issues flagged by linters/hooks and explain what was wrong
   - Call out necessary deviations from design docs

6. **Offer next steps:**
   - "Should I write tests now, or would you like to review first?"
   - "This is ready for code review if you'd like validation"
   - "I notice [improvement]. Should I refactor, or is this good for now?"

### 3.3 Bounded Exception: Orchestrated Runs

**When:** An orchestration skill spawns a subagent and names a destination path in the prompt.

**Exception:** The subagent may write to that exact path without a separate approval prompt — the user approved the destination when approving the orchestration.

**Constraints:**
- ONLY for new artifacts under `docs/`, `tests/`, or designated production paths
- NEVER for edits to existing source or config
- NEVER for a path the agent chose itself
- If invoked directly (not by orchestrator) or no path named: ask as normal

### 3.4 Exemptions

These writes do NOT require approval:

1. **Agent memory files** (`.claude/agents/*/.memory.md`)
2. **Session state checkpoints** (`production/session-state/active.md` appends)
3. **Generated artifacts in designated paths** when user ran an explicit generator command

All other writes require approval.

---

## 4. Quality Gates

Quality gates enforce standards at key decision points. Gates return structured verdicts that orchestration skills branch on.

### 4.1 Gate Types

**Architecture Gates** (Owner: Chief Architect)
- `ARCH-FEASIBILITY`: Proposed solution is technically viable
  - Verdicts: `VIABLE` | `CONCERNS` | `HIGH RISK`
- `ARCH-REVIEW`: Architecture decision meets standards
  - Verdicts: `APPROVE` | `REVISE` | `REJECT`
- `ARCH-CHANGE-IMPACT`: Change impact assessment
  - Verdicts: `LOW IMPACT` | `MEDIUM IMPACT` | `HIGH IMPACT`

**Code Review Gates** (Owner: Tech Lead, Backend Lead, Frontend Lead)
- `CODE-REVIEW`: Implementation quality check
  - Verdicts: `APPROVE` | `APPROVE WITH SUGGESTIONS` | `CHANGES REQUIRED`
- `API-CONTRACT`: API design review
  - Verdicts: `APPROVE` | `REVISE` | `BREAKING CHANGE REQUIRED`

**Product Gates** (Owner: Product Manager)
- `SPEC-READY`: User story is ready to implement
  - Verdicts: `READY` | `NEEDS WORK` | `BLOCKED`
- `ACCEPTANCE`: Implementation meets acceptance criteria
  - Verdicts: `ACCEPTED` | `REVISIONS NEEDED` | `REJECTED`

**Quality Gates** (Owner: QA Lead)
- `TEST-COVERAGE`: Adequate test coverage exists
  - Verdicts: `SUFFICIENT` | `GAPS` | `INSUFFICIENT`
- `RELEASE-READY`: Build ready for release
  - Verdicts: `READY` | `CONCERNS` | `BLOCKED`

**Design Gates** (Owner: Design Lead)
- `UX-REVIEW`: User experience review
  - Verdicts: `APPROVE` | `ITERATE` | `REJECT`
- `ACCESSIBILITY`: Accessibility compliance check
  - Verdicts: `COMPLIANT` | `MINOR ISSUES` | `MAJOR ISSUES`

### 4.2 Gate Execution Protocol

**Invocation:**
```
When a skill invokes you for a gate (e.g., `ARCH-FEASIBILITY`), read its 
definition first: its **Verdicts** line lists the only words you may return.
```

**Response Format:**
```
[GATE-ID]: [VERDICT_TOKEN]

[Detailed rationale below...]
```

**Rules:**
- Verdict token MUST be first line, exact match from gate's Verdicts list
- Rationale explains finding with specific evidence
- `NOT ASSESSED` when required input is missing (name the input)
- Missing input ≠ finding; a problem found uses gate's own verdict word

**Example:**
```
ARCH-FEASIBILITY: CONCERNS

The proposed Redis caching layer will handle the 10K RPS requirement, but:
1. Cache invalidation strategy is undefined for multi-region deployment
2. Memory budget of 4GB is tight given the 500-byte average value size
3. Failover behavior during cache unavailability needs specification

Recommendation: Define invalidation strategy and failover before implementation.
```

### 4.3 Gate Levels

Gates can be:
- **BLOCKING**: Must pass for work to proceed (e.g., security review)
- **ADVISORY**: Failures are noted but don't block (e.g., performance suggestions in early development)

Level is set by project configuration:
```yaml
quality:
  gates:
    arch_review: blocking
    code_review: blocking
    test_coverage: advisory  # may be blocking in production mode
    performance: advisory
```

---

## 5. Story Lifecycle & Test Evidence

### 5.1 Story Types

Every user story has a type that determines required evidence:

| Story Type | Required Evidence | Gate Level |
|------------|------------------|------------|
| **Feature** (new functionality) | Unit tests + integration tests + acceptance screenshots | BLOCKING |
| **API** (new endpoint/contract) | API tests + contract tests + OpenAPI spec | BLOCKING |
| **UI** (user interface) | Component tests + visual regression + accessibility scan | BLOCKING |
| **Data** (schema/migration) | Migration tests + rollback tests + data validation | BLOCKING |
| **ML** (model/pipeline) | Training metrics + evaluation results + inference tests | BLOCKING |
| **Config** (configuration change) | Smoke tests + rollback plan | ADVISORY |
| **Refactor** (code improvement) | Existing tests pass + coverage maintained | BLOCKING |
| **Bug Fix** (defect repair) | Regression test + root cause documented | BLOCKING |

### 5.2 Story Readiness Gate

**Before implementation starts**, `SPEC-READY` gate verifies:

✅ **Design Completeness**
- [ ] Requirements clearly specified (acceptance criteria, constraints)
- [ ] Self-contained (developer has everything needed)
- [ ] Testable (observable, measurable outcomes)
- [ ] No judgment calls (avoid "feels good", "looks nice" without metrics)

✅ **Architecture Completeness**
- [ ] Relevant ADRs cited and accepted
- [ ] Technical approach outlined
- [ ] Dependencies identified
- [ ] Breaking changes flagged

✅ **Scope Clarity**
- [ ] Estimate provided (hours, points, or size)
- [ ] Out-of-scope boundaries stated
- [ ] Dependencies listed and resolved

✅ **Open Questions**
- [ ] No TBD/TODO/UNRESOLVED markers
- [ ] All dependencies exist and are ready

**Verdicts:**
- `READY`: All checks pass, implementation can begin
- `NEEDS WORK`: Fixable gaps, can be resolved now
- `BLOCKED`: External blocker (missing dependency, unapproved ADR)

### 5.3 Story Done Gate

**When implementation claims completion**, `ACCEPTANCE` gate verifies:

✅ **Acceptance Criteria**
- [ ] Each criterion verified (code review, test results, or user confirmation)
- [ ] Evidence mapped to criteria (traceability matrix)

✅ **Test Evidence**
- [ ] Required tests exist and pass (by story type)
- [ ] Coverage meets standards
- [ ] No skipped/disabled tests without justification

✅ **Code Quality**
- [ ] Code review passed (gate verdict)
- [ ] Linting/formatting checks pass
- [ ] No security/vulnerability warnings

✅ **Documentation**
- [ ] API docs updated (if API changes)
- [ ] README/setup docs updated (if setup changes)
- [ ] ADR created (if architecture decision made)

✅ **Deviations**
- [ ] No unplanned scope changes
- [ ] Any deviations from spec documented and approved

**Verdicts:**
- `ACCEPTED`: Complete, ready to merge
- `REVISIONS NEEDED`: Minor issues, specific fixes identified
- `REJECTED`: Major issues or does not meet acceptance criteria

---

## 6. Escalation Paths

### 6.1 Technical Escalation

**Path:** Specialist → Lead → Chief Architect

**Scenarios:**
- Implementation conflicts with architecture
- Performance requirements cannot be met
- Technology choice needs revision
- Security vulnerability discovered

**Process:**
1. Specialist identifies issue, proposes 2-3 options with trade-offs
2. Lead evaluates, makes decision if within domain authority
3. If crosses domains or has strategic impact, escalate to Chief Architect
4. Chief Architect presents options to user with recommendation

### 6.2 Product Escalation

**Path:** Engineer → Product Manager → Product Director

**Scenarios:**
- Spec is ambiguous or incomplete
- Feature scope exceeds estimate significantly
- User experience concern with specified behavior
- Feature request conflicts with platform constraints

**Process:**
1. Engineer flags issue with specific questions
2. Product Manager clarifies or adjusts spec
3. If requires vision/strategy call, escalate to Product Director
4. Product Director makes strategic decision with user approval

### 6.3 Cross-Domain Escalation

**Path:** Lead A + Lead B → Shared Manager (Engineering Manager or Product Director)

**Scenarios:**
- Backend and Frontend disagree on API design
- Product and Engineering disagree on feasibility
- ML and Backend disagree on infrastructure approach
- Design and Engineering disagree on implementation

**Process:**
1. Both leads present their perspectives and constraints
2. Shared manager identifies root cause and frames decision
3. Manager presents options with impact analysis
4. User makes final decision
5. Manager ensures cascading communication

### 6.4 Scope/Priority Escalation

**Path:** Any Agent → Engineering Manager

**Scenarios:**
- Work exceeds sprint capacity
- Critical bug discovered mid-sprint
- Dependency blocker from external team
- Resource contention between initiatives

**Process:**
1. Agent reports blocker with impact assessment
2. Engineering Manager evaluates priority
3. If requires scope change, coordinates with Product Director
4. Manager rebalances work and communicates changes

---

## 7. Workflow Modes

Ultra-AI supports three workflow rigor levels, adapting to project maturity:

### 7.1 Minimal Mode

**When:** Early exploration, prototypes, small tools, learning projects

**Characteristics:**
- No ADRs required (decision log in docs/decisions.md)
- Simplified specs (user stories in docs/stories/)
- Advisory quality gates (blocking only for security/critical bugs)
- Streamlined approval (verbal OK sufficient for small changes)
- Tier 2 leads can make architectural decisions

**Agent Adjustments:**
- Tech Lead handles architectural decisions (Chief Architect not required)
- Product Manager writes specs (Product Director for vision only)
- QA Engineer writes and executes tests (QA Lead for strategy only)

### 7.2 Standard Mode

**When:** Production applications, team projects, maintained codebases

**Characteristics:**
- ADRs for critical decisions (infrastructure, data models, security)
- Full user story format with acceptance criteria
- Blocking gates for quality, advisory for performance
- Written approval required for multi-file changes
- Full tier hierarchy active

**Agent Adjustments:**
- All agents active per tier definitions
- Chief Architect reviews critical ADRs
- Product Director involved in major feature decisions
- Full ask-before-write protocol

### 7.3 Full Mode

**When:** Enterprise systems, regulated domains, large teams, high-risk projects

**Characteristics:**
- ADRs for all architectural decisions
- Comprehensive specs with edge cases, performance budgets, security requirements
- All gates blocking by default
- Formal approval process with sign-offs
- Strict tier hierarchy with audit trail

**Agent Adjustments:**
- Every change reviewed by appropriate lead
- All decisions documented with rationale
- Quality gates require explicit pass (no auto-approve)
- Escalations tracked in production/escalations/
- Architecture review board for major changes

---

## 8. Communication Protocols

### 8.1 Structured Decisions (for agents without AskUserQuestion tool)

When an agent needs a decision but lacks direct question capability:

**Format:**
1. Write full analysis first (pros/cons, theory, examples)
2. End with options as short list:
   - 1-5 word labels
   - One-sentence description each (key trade-off)
   - "(Recommended)" on your pick
   - Maximum 4 independent questions

**Example:**
```
Analysis: [full reasoning above...]

Options:
1. REST API (Recommended) - Simplest, widest compatibility, mature tooling
2. GraphQL API - Flexible queries, reduces over-fetching, learning curve
3. gRPC API - Best performance, type-safe, requires protobuf knowledge

Which approach should we take?
```

### 8.2 File Write Confirmations

Always end turn with explicit question:
```
May I write this to [exact/file/path.ts]?
```

For multi-file changes:
```
May I write these changes?
- apps/api/src/users/service.ts (new file)
- apps/api/src/users/controller.ts (edit)
- packages/types/src/user.ts (edit)
```

### 8.3 Escalation Communication

When escalating:
```
Escalating to [Agent Name]:

Issue: [specific problem]
Context: [relevant background]
Attempted: [what was tried]
Options: [2-3 paths forward with trade-offs]
Recommendation: [your suggestion with rationale]
Decision needed: [specific question]
```

### 8.4 Status Updates

Agents update session state after significant work:
```
**Updated:** [date]
**Current task:** [agent-name] — [working on X]
**Progress:** [what's complete]
**Next step:** [what's next]
**Blocked on:** [nothing | specific blocker]
**Open questions:** [list or none]
```

---

## 9. Implementation Guide

### 9.1 Agent Definition Format

Each agent has a definition file in `.claude/agents/[agent-name].md`:

```yaml
---
name: backend-lead
description: "Backend system design, API contracts, data models, infrastructure patterns"
tools: Read, Glob, Grep, Write, Edit, Bash
model: inherit  # or sonnet, opus for pinned model
maxTurns: 20
skills: [code-review, architecture-review]  # available skills
memory: project  # or conversation, none
---

[Agent-specific prompt and responsibilities...]
```

### 9.2 Skill Definition Format

Skills (reusable workflows) in `.claude/skills/[skill-name]/SKILL.md`:

```yaml
---
name: code-review
description: "Reviews code for quality, style, performance, and correctness"
argument-hint: "[file-path or directory]"
user-invocable: true
model: sonnet
allowed-tools: Read, Grep, Bash
---

[Skill execution steps...]
```

### 9.3 Gate Definition Format

Gates in `.claude/gates/[gate-name].md`:

```yaml
---
name: ARCH-FEASIBILITY
owner: chief-architect
verdicts: [VIABLE, CONCERNS, HIGH RISK, NOT ASSESSED]
---

# Architecture Feasibility Gate

Evaluates whether proposed solution is technically viable given constraints.

**Inputs:**
- Architecture proposal document
- Performance requirements
- Infrastructure constraints

**Checks:**
- [ ] Solution meets functional requirements
- [ ] Performance budgets achievable
- [ ] Infrastructure capacity sufficient
- [ ] Dependencies available and compatible

**Verdict Guide:**
- VIABLE: All checks pass, ready to implement
- CONCERNS: Issues identified but solvable
- HIGH RISK: Significant technical risk, alternatives needed
- NOT ASSESSED: Missing required inputs
```

### 9.4 Delegation Pattern

From Tech Lead to Backend Lead:

```
Tech Lead orchestrates:
  1. Reads user request and identifies domain (backend system design)
  2. Delegates to Backend Lead:
  
     "Backend Lead: Design the user authentication service.
     
     Requirements: [spec link]
     Constraints: Must support OAuth2, OIDC, JWT
     Output path: docs/architecture/auth-service.md
     
     Please propose architecture and ask for approval before writing."
  
  3. Backend Lead responds with proposal
  4. Tech Lead presents to user
  5. On approval, Backend Lead writes document
  6. Tech Lead validates and runs ARCH-REVIEW gate
```

---

## 10. Configuration

Project-level configuration in `project.yaml`:

```yaml
studio:
  # Workflow rigor level
  workflow: standard  # minimal | standard | full
  
  # Quality gate configuration
  quality:
    gates:
      arch_review: blocking
      code_review: blocking
      test_coverage: blocking
      performance: advisory
      accessibility: blocking
  
  # Test evidence requirements
  testing:
    coverage_threshold: 80  # percentage
    strict:
      feature: true   # unit + integration required
      api: true       # contract tests required
      ui: true        # component + visual regression required
      config: false   # smoke tests advisory
  
  # Approval settings
  collaboration:
    mode: ask-before-write  # ask-before-write | autonomous (not recommended)
    multi_file_explicit: true  # require explicit approval for multi-file changes
    
  # Agent model overrides
  agents:
    chief_architect: opus
    product_director: opus
    engineering_manager: opus
    # All others inherit session model

  # Domain ownership (for cross-domain change validation)
  domains:
    backend:
      paths: ["apps/api/**", "packages/backend-*/**"]
      owner: backend-lead
    frontend:
      paths: ["apps/web/**", "packages/ui-*/**"]
      owner: frontend-lead
    ml:
      paths: ["apps/ml-*/**", "packages/ml-*/**", "models/**"]
      owner: ml-architect
    infra:
      paths: ["infra/**", ".github/workflows/**", "docker/**"]
      owner: devops-lead
```

---

## 11. Example Workflows

### 11.1 Feature Development

**User Request:** "Add user profile page"

**Flow:**

1. **Product Manager** (Tier 2):
   - Clarifies requirements with user
   - Writes user story with acceptance criteria
   - Runs `/spec-ready` skill → `SPEC-READY` gate
   - Story ready, delegates to engineering

2. **Tech Lead** (Tier 2):
   - Reviews story, identifies domains: frontend (UI), backend (API)
   - Proposes architecture: REST endpoint + React component
   - Delegates to Frontend Lead and Backend Lead in parallel

3. **Backend Lead** (Tier 2):
   - Designs API endpoint contract
   - Proposes to Frontend Lead for alignment
   - Both agree, Backend Lead delegates to **API Developer** (Tier 3)

4. **API Developer** (Tier 3):
   - Implements endpoint following spec
   - Asks: "May I write to apps/api/src/users/profile.ts?"
   - User approves
   - Writes implementation + tests
   - Requests code review from Backend Lead

5. **Backend Lead** (Tier 2):
   - Runs `CODE-REVIEW` gate → `APPROVE WITH SUGGESTIONS`
   - API Developer addresses suggestions
   - Backend Lead approves merge

6. **Frontend Lead** (Tier 2):
   - Designs component structure
   - Delegates to **UI Developer** (Tier 3)

7. **UI Developer** (Tier 3):
   - Implements component
   - Asks: "May I write apps/web/src/components/UserProfile.tsx and .css?"
   - User approves
   - Runs accessibility scan
   - Frontend Lead reviews → `APPROVE`

8. **QA Engineer** (Tier 3):
   - Writes integration test covering full flow
   - Runs test suite → passes
   - Documents test evidence

9. **Product Manager** (Tier 2):
   - Runs `ACCEPTANCE` gate → `ACCEPTED`
   - Story marked complete

### 11.2 Architecture Decision

**User Request:** "Should we use Redis or Memcached for caching?"

**Flow:**

1. **Chief Architect** (Tier 1):
   - Asks clarifying questions:
     - What's the caching use case? (session data, API responses, etc.)
     - What's the scale? (requests/sec, data volume)
     - Persistence requirements?
   - User provides context

2. **Chief Architect** presents options:
   ```
   Option A: Redis (Recommended)
   - Pros: Rich data structures, persistence, pub/sub, wider ecosystem
   - Cons: Slightly more memory overhead
   - Best for: Session data + real-time features
   
   Option B: Memcached
   - Pros: Simpler, slightly faster for pure KV, lower memory
   - Cons: No persistence, limited data types
   - Best for: Pure cache, no durability needed
   ```

3. User chooses Redis

4. **Chief Architect**:
   - Creates ADR: docs/architecture/adr-015-redis-caching.md
   - Status: Proposed
   - Asks: "May I write this ADR?"
   - User approves
   - Writes ADR

5. User confirms decision

6. **Chief Architect**:
   - Updates ADR status to Accepted
   - Notifies Tech Lead, Backend Lead, DevOps Lead
   - Tech Lead cascades to specialists

7. **DevOps Lead**:
   - Adds Redis to infrastructure
   - Documents configuration

8. **Backend Lead**:
   - Defines caching interface
   - Delegates implementation to Systems Engineer

### 11.3 Cross-Domain Conflict

**Scenario:** Backend Lead and Frontend Lead disagree on API pagination approach

**Flow:**

1. **Backend Lead** proposes cursor-based pagination (better performance)
2. **Frontend Lead** prefers offset-based pagination (simpler UI)
3. Both agents escalate to **Tech Lead** (shared parent)

4. **Tech Lead**:
   - Reviews both perspectives
   - Analyzes trade-offs:
     - Cursor: Better perf, handles real-time data, complex implementation
     - Offset: Simpler, worse perf, race conditions in real-time
   - Identifies root question: "Is real-time data consistency critical?"

5. **Tech Lead** escalates to **Product Manager**:
   - "This API serves the activity feed. Is showing outdated data acceptable?"

6. **Product Manager**:
   - Confirms: Real-time consistency is important
   - Accepts the complexity trade-off

7. **Tech Lead** decides:
   - Cursor-based pagination required
   - Backend Lead proceeds
   - Frontend Lead gets implementation support

8. **Tech Lead** documents decision:
   - Updates API design doc with rationale
   - Ensures both teams aligned

---

## 12. Anti-Patterns to Avoid

### ❌ Tier Skipping

**Bad:**
```
Engineering Manager → API Developer
(skips Tech Lead and Backend Lead)
```

**Why:** Loses domain expertise, no architecture review, no coordination

**Good:**
```
Engineering Manager → Tech Lead → Backend Lead → API Developer
```

### ❌ Autonomous Execution

**Bad:**
```
Agent implements solution → writes code → commits
(no approval, no review)
```

**Why:** Loses user control, may implement wrong solution

**Good:**
```
Agent proposes solution → user approves → agent implements → 
agent shows result → user approves write → agent writes → 
agent requests review → lead reviews
```

### ❌ Silent Domain Violation

**Bad:**
```
Backend engineer modifies frontend code without Frontend Lead knowledge
```

**Why:** Creates inconsistency, breaks domain patterns, no review

**Good:**
```
Backend engineer: "This needs frontend changes. Coordinating with Frontend Lead."
→ Frontend Lead reviews and approves changes
```

### ❌ Unstructured Escalation

**Bad:**
```
Specialist: "This won't work."
→ No context, no options, no recommendation
```

**Why:** Forces user to debug, wastes time

**Good:**
```
Specialist: "Escalating to Lead: Current approach has [specific issue]. 
Attempted [X]. Three options: [A, B, C with trade-offs]. 
Recommend [B] because [rationale]. Decision needed on approach."
```

### ❌ Gate Verdict Ambiguity

**Bad:**
```
"The code looks mostly good, but there are a few concerns..."
(no verdict token, buried in prose)
```

**Why:** Orchestration skills can't parse, workflow can't proceed

**Good:**
```
CODE-REVIEW: APPROVE WITH SUGGESTIONS

The implementation is correct and follows standards. Minor suggestions:
1. Add error handling for network timeout
2. Extract magic number to constant
...
```

---

## 13. Migration Path

For existing projects adopting this architecture:

### Phase 1: Foundation (Week 1)

1. Create agent definitions for Tier 1 and Tier 2
2. Configure workflow mode (start with `minimal`)
3. Define domain boundaries in project.yaml
4. Document current escalation paths

### Phase 2: Protocols (Week 2-3)

1. Implement ask-before-write protocol
2. Create quality gate definitions
3. Document story types and evidence requirements
4. Train team on structured decision format

### Phase 3: Tier 3 Rollout (Week 4-5)

1. Add specialist agent definitions
2. Test delegation patterns on non-critical work
3. Refine gate verdicts based on real usage
4. Document lessons learned

### Phase 4: Optimization (Ongoing)

1. Collect metrics (escalation frequency, gate pass rate, cycle time)
2. Refine agent prompts based on common issues
3. Add domain-specific specialists as needed
4. Adjust workflow mode as project matures

---

## 14. Success Metrics

**Coordination Quality:**
- Escalation response time < 1 hour (Tier 2), < 4 hours (Tier 1)
- Cross-domain conflict resolution rate > 90%
- Domain boundary violations per sprint < 2

**Delivery Quality:**
- Gate pass rate on first submission > 75%
- Rework after code review < 15%
- Test evidence complete before story done > 95%

**User Experience:**
- User approval required events per story: 3-5 (right level of involvement)
- User overrides agent recommendation < 20% (agents provide good guidance)
- User satisfaction with agent proposals > 4/5

**Efficiency:**
- Time from story ready to implementation start < 1 day
- Cycle time for small changes < 2 days
- Blocked stories waiting on decisions < 10% of backlog

---

## 15. Appendix: Pattern Library

### Pattern: Propose-Then-Implement

```
1. Agent reads requirements
2. Agent asks clarifying questions
3. Agent proposes approach with trade-offs
4. User chooses or refines
5. Agent implements proposal
6. Agent shows result
7. User approves write
8. Agent writes files
9. Agent offers next steps
```

### Pattern: Multi-Domain Change

```
1. Initiating agent identifies affected domains
2. Initiating agent proposes change with rationale
3. Each domain lead reviews impact
4. Leads coordinate on shared boundaries
5. Shared manager approves if consensus
6. Each domain implements their portion
7. Integration tested by QA
```

### Pattern: Emergency Escalation

```
1. Critical issue discovered (security, data loss, outage)
2. Discoverer immediately escalates to Engineering Manager
3. Engineering Manager assembles response team (relevant leads)
4. Team proposes immediate mitigation + long-term fix
5. User approves approach
6. Team executes with expedited reviews
7. Post-incident review documents root cause + prevention
```

---

## Conclusion

This architecture adapts Game Studios' proven coordination patterns to general software/AI/design work. The three-tier hierarchy, ask-before-write protocol, quality gates, and explicit escalation paths ensure coordinated, high-quality delivery while maintaining user control.

**Key Takeaways:**
1. **Hierarchy prevents chaos** – clear authority at each level
2. **Ask-before-write maintains control** – user approves significant decisions
3. **Gates enforce standards** – quality built in, not inspected in
4. **Escalation resolves conflicts** – systematic paths to decisions
5. **Flexibility adapts to project** – three workflow modes scale with maturity

Adopt incrementally, measure results, refine based on your team's needs.
