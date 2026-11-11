# Facts — Remaining docs classification (S2b batch 3)

## Status legend: VERIFIED = claims match BUILD_PLAN/live state; ASPIRATIONAL = inflated/unverified; STALE = superseded by later docs; OPS = operational how-to.

## Root files
- FINAL-PROJECT-SUMMARY.md, FINAL-SUMMARY.md, PRODUCTION-RELEASE.md (Aug 8 2026): claim "production ready v1.0.0", 12 integrated AI systems, 40 commits. ASPIRATIONAL/STALE — predates BUILD_PLAN verification; inflated vs actual stub state.
- PROJECT-CATALOG.md (708L): product catalog of packages (api-gateway "40+ providers", RTK "40% token reduction"). ASPIRATIONAL marketing.
- PROJECT_STRUCTURE.md: describes intended tree incl. services/, apps/desktop, apps/mobile, packages/{shared,ui-core,desktop-core}. Partially aspirational (services/, mobile absent).
- QUICK-START.md, USER-GUIDE.md: generic guides; STALE relative to actual run commands in BUILD_PLAN/LOCAL_RUN_GUIDE.
- README-template.md: Enterprise Project Template v2.1.0 extracted from Ultra-Core — standalone template tool.
- TASKS-CHECKLIST.md: completed phases 1–4 (imports: 9router, JARVIS, openclaw, WebUI-desktop; api-gateway; auth; provider UI); pending: OpenClaw/JARVIS integration, Electron, hardening. Matches FINAL-SUMMARY.
- CODE_OF_CONDUCT.md, CONTRIBUTING.md: standard community docs.
- ULTRA_AI_*.md (5) + DOC_CONVERSION_MAP.csv + scripts/preservation.sh: v2 planning artifacts (already known).

## docs/ top-level (status reports & guides)
- AGENT_STUDIO_ARCHITECTURE.md (1125L, 2026-11-01, "Proposed"): 3-tier multi-agent studio adapted from Claude Code Game Studios — vertical delegation, ask-before-write, quality gates, horizontal consult, escalation. RELEVANT to A00–A15 crew design.
- API_DOCUMENTATION.md: REST API v1 design (auth/tasks), developer-experience strategy. ASPIRATIONAL spec.
- CONSOLIDATED_ENGINEERING_SPEC.md (201L): mined 63 docs → runtime topology table, ZeroAI edge stack paths, feature matrix, 7 doc conflicts, MVP checklist. KEY REFERENCE — cite as consolidated spec.
- DEPLOYMENT_DEVOPS_STRATEGY.md (1215L): multi-cloud AWS/GCP, EKS/GKE, IaC, K8s. ASPIRATIONAL scale.
- DOCUMENTATION_INDEX.md: index of 18 docs / 9,287 lines (March 2026). STALE index.
- PROJECT_GOVERNANCE_FRAMEWORK.md (574L): org structure BOD→CEO/CTO/CPO/CFO→depts. Corporate/governance doc.
- LEGAL_COMPLIANCE_FRAMEWORK.md (407L): regulatory landscape for distributed AI + blockchain rewards, multi-jurisdiction. ASPIRATIONAL; blockchain angle deferred.
- docs/README.md: documentation landing page.
- ROADMAP_NEXT_PHASES.md: claims "all 12 phases complete, 112/112 features, 104/104 tests" then proposes phases 6–12 (analytics, caching, multi-tenancy, fine-tuning, crypto, i18n, marketplace). CONTRADICTS itself and BUILD_PLAN (which found stubs). FLAG as inflated.
- UPSTREAM_INTEGRATION_INVENTORY.md (60L, 2026-10-31): 8 fadhel-sh upstream forks under external/ back catalog sub-projects; integration-service.ts probes ${MOCK_ADAPTERS_URL}/adapters/${id}/health (default :4100, 1.5s timeout); every sub-project depends on 9router as keystone health gate. VERIFIED-USEFUL ops fact.
- IMPLEMENTATION_READINESS.md: mostly business/funding plan (hiring, budgets) — not engineering.
- RESOURCE_ACQUISITION_STRATEGY.md: $2.5–3.5M seed funding strategy. Business doc.
- Phase reports (PHASE6/8/9/10/11, PHASES_6_9_SUMMARY, SESSION_*, TEST_RESULTS_REPORT, INTEGRATION_VERIFICATION_REPORT, API_ENDPOINT_TESTING_GUIDE, FEATURES_IMPLEMENTED, COMPLETION_REPORT, IMPLEMENTATION_SUMMARY, PROJECT_ENHANCEMENT_SUMMARY): March 5 2026 session reports claiming phases 6–11 implemented (analytics, caching, multi-tenancy, monitoring). Treat as historical claims; BUILD_PLAN (Aug 2026) is later and more reliable.
- POC_VALIDATION_STRATEGY.md, DEPLOYMENT_SCRIPTS.md, DOCKER_SETUP.md, PRODUCTION_DEPLOYMENT.md, PERFORMANCE_MONITORING_STRATEGY.md: strategy/how-to docs; ops-relevant patterns.

## docs/planning/ (July 1 2026 — NEWEST planning set, most authoritative pre-v2)
- DEVELOPMENT_ROADMAP.md, PROJECT_STATUS_REPORT.md, CRITICAL_ISSUES.md, REMAINING_TASKS.md, COMPLETION_STATUS.md, DEPLOYMENT_TIMELINE.md: all normalized to THREE-PHASE program: Phase1 Core Infrastructure (ZeroAI control surface, API/docs alignment), Phase2 Distributed Network (workflow orchestration, voice, memory, routing, distributed boundary), Phase3 Advanced Features. Canonical table referenced: PROJECT_PHASES_AND_STATUS.md (check existence). Key risks noted: documentation drift, local/distributed boundary clarity. These docs are the bridge between legacy repo and v2 plan.

## docs/operations/, docs/phases/, docs/reports/
- LOCAL_RUN_GUIDE.md: live URLs localhost:3000/zeroai — matches BUILD_PLAN verified stack.
- DOCKER_*: docker build/test verification, cheatsheet, K8s commands, PHASE_19_K8S_GUIDE, PHASE_18/19 checklists+reports: infra artifacts, K8s manifests exist as YAML.
- SESSION reports: code-quality audit + Docker/K8s implementation sessions.

## docs/business/ (4 files)
- business-model.md: AI-as-a-Service + decentralized computing + blockchain incentives; multiple revenue streams. Business canvas.
- competitive-analysis.md: vs OpenAI Platform etc.
- go-to-market.md: phased market entry timeline.
- market-analysis.md: AI market $214.6B (2024) → $1.39T (2030), CAGR 37.3%.

## docs/security/, docs/ui/, docs/ux-design/
- security-framework.md (755L): defense-in-depth for distributed AI processing, data privacy, network integrity.
- zeroai-ui-spec.md (78L): ZeroAI = control surface not chat window; local-first obvious; state visibility, sensitive-action confirmation, pre/post inspection.
- user-personas.md (420L): personas incl. "Alex Chen solo developer"; role-based workspaces.
- user-journeys.md (491L): journey maps per persona; contains mermaid block 13 (already extracted to diagrams/).

## docs/ai-workspace/, docs/reference/
- ai-workspace/: EMPTY dir.
- reference/PROJECT_DOCUMENTATION_INDEX.md (23L): entry points list.

## .github/copilot-instructions.md
- Mission: Ultra AI = AI-native OS that adapts to user; runs on Gate-OS; part of Ultra Zone open-source community. STALE-ish (pre-v2 framing) but confirms Gate-OS relationship.

## Key cross-cutting findings
1. docs/planning/ (July 2026, 3-phase) is the newest authoritative legacy planning set → feeds v2 phasing.
2. BUILD_PLAN.md (Aug 2026) is the most reliable statement of actual working state.
3. Massive inflation pattern: many docs claim "100% complete" while BUILD_PLAN found stubs — record as systemic doc-drift risk (already in CRITICAL_ISSUES.md).
4. Blockchain/CS-currency appears in README, business-model, legal docs as core — all superseded by owner deferral decision; keep as future-phase references only.
