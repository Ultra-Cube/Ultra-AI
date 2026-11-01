/**
 * Quality Gate System for Ultra-AI Agent Studio
 *
 * Implements 5 gate types (Architecture, CodeReview, Product, Quality, Design)
 * with structured verdict logic. Gates enforce standards at key decision points
 * and return verdicts that orchestration skills can branch on.
 *
 * Source: docs/AGENT_STUDIO_ARCHITECTURE.md § 4. Quality Gates
 */

// ============================================================================
// Types & Enums
// ============================================================================

export type GateVerdict = 'VIABLE' | 'CONCERNS' | 'HIGH_RISK' | 'NOT_ASSESSED';

export type GateType =
  | 'ARCH_FEASIBILITY'
  | 'ARCH_REVIEW'
  | 'ARCH_CHANGE_IMPACT'
  | 'CODE_REVIEW'
  | 'API_CONTRACT'
  | 'SPEC_READY'
  | 'ACCEPTANCE'
  | 'TEST_COVERAGE'
  | 'RELEASE_READY'
  | 'UX_REVIEW'
  | 'ACCESSIBILITY';

export type ArchFeasibilityVerdict = 'VIABLE' | 'CONCERNS' | 'HIGH_RISK' | 'NOT_ASSESSED';
export type ArchReviewVerdict = 'APPROVE' | 'REVISE' | 'REJECT' | 'NOT_ASSESSED';
export type ArchChangeImpactVerdict = 'LOW_IMPACT' | 'MEDIUM_IMPACT' | 'HIGH_IMPACT' | 'NOT_ASSESSED';
export type CodeReviewVerdict = 'APPROVE' | 'APPROVE_WITH_SUGGESTIONS' | 'CHANGES_REQUIRED' | 'NOT_ASSESSED';
export type ApiContractVerdict = 'APPROVE' | 'REVISE' | 'BREAKING_CHANGE_REQUIRED' | 'NOT_ASSESSED';
export type SpecReadyVerdict = 'READY' | 'NEEDS_WORK' | 'BLOCKED' | 'NOT_ASSESSED';
export type AcceptanceVerdict = 'ACCEPTED' | 'REVISIONS_NEEDED' | 'REJECTED' | 'NOT_ASSESSED';
export type TestCoverageVerdict = 'SUFFICIENT' | 'GAPS' | 'INSUFFICIENT' | 'NOT_ASSESSED';
export type ReleaseReadyVerdict = 'READY' | 'CONCERNS' | 'BLOCKED' | 'NOT_ASSESSED';
export type UxReviewVerdict = 'APPROVE' | 'ITERATE' | 'REJECT' | 'NOT_ASSESSED';
export type AccessibilityVerdict = 'COMPLIANT' | 'MINOR_ISSUES' | 'MAJOR_ISSUES' | 'NOT_ASSESSED';

export type AnyGateVerdict =
  | ArchFeasibilityVerdict
  | ArchReviewVerdict
  | ArchChangeImpactVerdict
  | CodeReviewVerdict
  | ApiContractVerdict
  | SpecReadyVerdict
  | AcceptanceVerdict
  | TestCoverageVerdict
  | ReleaseReadyVerdict
  | UxReviewVerdict
  | AccessibilityVerdict;

export interface GateResult<V = AnyGateVerdict> {
  gate: GateType;
  verdict: V;
  reasoning: string;
  blockers: string[];
  recommendations: string[];
  timestamp: string;
}

// ============================================================================
// Context Types (input to gates)
// ============================================================================

export interface StoryContext {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  type?: 'feature' | 'api' | 'ui' | 'data' | 'ml' | 'config' | 'refactor' | 'bug';
  dependencies?: string[];
  estimateHours?: number;
  technicalApproach?: string;
  adrReferences?: string[];
  openQuestions?: string[];
}

export interface FeatureContext {
  name: string;
  description: string;
  requirements: string[];
  constraints?: string[];
  performanceBudget?: Record<string, string>;
  securityRequirements?: string[];
  testStrategy?: string;
}

export interface ChangesetContext {
  files: string[];
  description: string;
  impactedSystems?: string[];
  breakingChanges?: boolean;
  migrationRequired?: boolean;
  rollbackPlan?: string;
}

export interface CodeContext {
  filePath: string;
  content: string;
  language: string;
  purpose: string;
  testCoverage?: number;
  lintErrors?: string[];
  securityWarnings?: string[];
}

export interface ApiContext {
  endpoint: string;
  method: string;
  requestSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  breaking?: boolean;
  versioned?: boolean;
  documentation?: string;
}

export interface TestContext {
  totalTests: number;
  passingTests: number;
  failingTests: number;
  coverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  testTypes: {
    unit: number;
    integration: number;
    e2e: number;
  };
  skippedTests?: number;
}

export interface ReleaseContext {
  version: string;
  changes: string[];
  testResults: TestContext;
  buildStatus: 'passing' | 'failing' | 'pending';
  securityScanPassed: boolean;
  documentationUpdated: boolean;
  migrationsReady?: boolean;
}

export interface DesignContext {
  component: string;
  userFlow: string;
  accessibilityChecklist?: string[];
  usabilityNotes?: string;
  visualDesignLink?: string;
  responsiveDesign?: boolean;
}

// ============================================================================
// Architecture Gates
// ============================================================================

/**
 * ARCH-FEASIBILITY: Evaluates whether proposed solution is technically viable
 */
export function archFeasibilityGate(context: FeatureContext): GateResult<ArchFeasibilityVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: ArchFeasibilityVerdict = 'VIABLE';

  // Check for missing required inputs
  if (!context.requirements || context.requirements.length === 0) {
    return {
      gate: 'ARCH_FEASIBILITY',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: requirements not specified',
      blockers: ['Requirements must be defined before feasibility assessment'],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Check performance budgets
  if (context.performanceBudget) {
    const criticalMetrics = ['responseTime', 'throughput', 'latency'];
    const missingMetrics = criticalMetrics.filter((m) => !context.performanceBudget![m]);
    if (missingMetrics.length > 0) {
      verdict = 'CONCERNS';
      recommendations.push(`Define performance budgets for: ${missingMetrics.join(', ')}`);
    }
  }

  // Check security requirements
  if (context.securityRequirements && context.securityRequirements.length === 0) {
    if (context.description.toLowerCase().includes('auth') || context.description.toLowerCase().includes('user')) {
      verdict = 'CONCERNS';
      recommendations.push('Security requirements should be explicitly defined for user/auth features');
    }
  }

  // Check constraints
  if (context.constraints && context.constraints.length > 5) {
    verdict = 'HIGH_RISK';
    blockers.push('High number of constraints may indicate overly complex solution');
    recommendations.push('Consider breaking down into smaller, more focused features');
  }

  // Check test strategy
  if (!context.testStrategy) {
    if (verdict === 'VIABLE') verdict = 'CONCERNS';
    recommendations.push('Test strategy should be defined before implementation');
  }

  const reasoning = `Feasibility assessment for "${context.name}": ${
    verdict === 'VIABLE'
      ? 'Solution meets functional requirements and is technically viable'
      : verdict === 'CONCERNS'
        ? 'Solution is viable but has areas requiring attention'
        : 'Significant technical risks identified'
  }`;

  return {
    gate: 'ARCH_FEASIBILITY',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * ARCH-REVIEW: Architecture decision meets standards
 */
export function archReviewGate(context: StoryContext): GateResult<ArchReviewVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: ArchReviewVerdict = 'APPROVE';

  // Check for technical approach
  if (!context.technicalApproach) {
    return {
      gate: 'ARCH_REVIEW',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: technical approach not specified',
      blockers: ['Technical approach must be documented before architecture review'],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Check ADR references for architectural decisions
  if (!context.adrReferences || context.adrReferences.length === 0) {
    if (context.type === 'feature' || context.type === 'api') {
      verdict = 'REVISE';
      recommendations.push('Major features should reference relevant ADRs or create new ones');
    }
  }

  // Check for unresolved questions
  if (context.openQuestions && context.openQuestions.length > 0) {
    verdict = 'REJECT';
    blockers.push(`${context.openQuestions.length} open questions must be resolved`);
    context.openQuestions.forEach((q) => blockers.push(`  - ${q}`));
  }

  // Check dependencies
  if (context.dependencies && context.dependencies.length > 3) {
    if (verdict === 'APPROVE') verdict = 'REVISE';
    recommendations.push('High number of dependencies. Consider architectural simplification.');
  }

  const reasoning = `Architecture review for "${context.title}": ${
    verdict === 'APPROVE'
      ? 'Architecture meets standards and is ready for implementation'
      : verdict === 'REVISE'
        ? 'Architecture needs minor revisions before approval'
        : 'Architecture has significant issues requiring redesign'
  }`;

  return {
    gate: 'ARCH_REVIEW',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * ARCH-CHANGE-IMPACT: Change impact assessment
 */
export function archChangeImpactGate(context: ChangesetContext): GateResult<ArchChangeImpactVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: ArchChangeImpactVerdict = 'LOW_IMPACT';

  if (context.files.length === 0) {
    return {
      gate: 'ARCH_CHANGE_IMPACT',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: no files specified',
      blockers: ['File list must be provided for impact assessment'],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Assess file count impact
  if (context.files.length > 10) {
    verdict = 'MEDIUM_IMPACT';
  }
  if (context.files.length > 25) {
    verdict = 'HIGH_IMPACT';
    recommendations.push('Large changeset. Consider breaking into multiple PRs for easier review.');
  }

  // Check for breaking changes
  if (context.breakingChanges) {
    verdict = 'HIGH_IMPACT';
    if (!context.migrationRequired) {
      blockers.push('Breaking changes require migration plan');
    }
    if (!context.rollbackPlan) {
      blockers.push('Breaking changes require rollback plan');
    }
  }

  // Check impacted systems
  if (context.impactedSystems && context.impactedSystems.length > 3) {
    verdict = 'HIGH_IMPACT';
    recommendations.push('Changes affect multiple systems. Coordinate testing across all impacted areas.');
  }

  // Check for migration requirements
  if (context.migrationRequired && !context.rollbackPlan) {
    if (verdict !== 'HIGH_IMPACT') verdict = 'MEDIUM_IMPACT';
    recommendations.push('Document rollback procedure for migrations');
  }

  const reasoning = `Change impact for ${context.files.length} file(s): ${
    verdict === 'LOW_IMPACT'
      ? 'Limited scope, low risk'
      : verdict === 'MEDIUM_IMPACT'
        ? 'Moderate scope, requires standard coordination'
        : 'Wide scope or breaking changes, requires careful coordination'
  }`;

  return {
    gate: 'ARCH_CHANGE_IMPACT',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Code Review Gates
// ============================================================================

/**
 * CODE-REVIEW: Implementation quality check
 */
export function codeReviewGate(context: CodeContext): GateResult<CodeReviewVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: CodeReviewVerdict = 'APPROVE';

  if (!context.content || context.content.trim().length === 0) {
    return {
      gate: 'CODE_REVIEW',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: code content not provided',
      blockers: ['Code content must be provided for review'],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Check lint errors
  if (context.lintErrors && context.lintErrors.length > 0) {
    verdict = 'CHANGES_REQUIRED';
    context.lintErrors.forEach((err) => blockers.push(`Lint error: ${err}`));
  }

  // Check security warnings
  if (context.securityWarnings && context.securityWarnings.length > 0) {
    verdict = 'CHANGES_REQUIRED';
    context.securityWarnings.forEach((warn) => blockers.push(`Security warning: ${warn}`));
  }

  // Check test coverage
  if (context.testCoverage !== undefined) {
    if (context.testCoverage < 60) {
      verdict = 'CHANGES_REQUIRED';
      blockers.push(`Test coverage ${context.testCoverage}% is below minimum threshold of 60%`);
    } else if (context.testCoverage < 80) {
      if (verdict === 'APPROVE') verdict = 'APPROVE_WITH_SUGGESTIONS';
      recommendations.push(`Test coverage ${context.testCoverage}% is below target of 80%`);
    }
  }

  // Check file size
  const lines = context.content.split('\n').length;
  if (lines > 500) {
    if (verdict === 'APPROVE') verdict = 'APPROVE_WITH_SUGGESTIONS';
    recommendations.push(`File has ${lines} lines. Consider breaking into smaller modules for maintainability.`);
  }

  const reasoning = `Code review for "${context.filePath}": ${
    verdict === 'APPROVE'
      ? 'Code meets quality standards'
      : verdict === 'APPROVE_WITH_SUGGESTIONS'
        ? 'Code is acceptable with minor suggestions'
        : 'Code requires changes before approval'
  }`;

  return {
    gate: 'CODE_REVIEW',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * API-CONTRACT: API design review
 */
export function apiContractGate(context: ApiContext): GateResult<ApiContractVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: ApiContractVerdict = 'APPROVE';

  if (!context.endpoint || !context.method) {
    return {
      gate: 'API_CONTRACT',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: endpoint or method not specified',
      blockers: ['API endpoint and method must be specified'],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Check for breaking changes
  if (context.breaking) {
    verdict = 'BREAKING_CHANGE_REQUIRED';
    if (!context.versioned) {
      blockers.push('Breaking changes require API versioning');
    }
    blockers.push('Breaking change impact assessment required');
    recommendations.push('Document migration path for API consumers');
  }

  // Check schemas
  if (!context.requestSchema && ['POST', 'PUT', 'PATCH'].includes(context.method)) {
    if (verdict === 'APPROVE') verdict = 'REVISE';
    recommendations.push('Request schema should be defined for mutation endpoints');
  }

  if (!context.responseSchema) {
    if (verdict === 'APPROVE') verdict = 'REVISE';
    recommendations.push('Response schema should be explicitly defined');
  }

  // Check documentation
  if (!context.documentation) {
    if (verdict === 'APPROVE') verdict = 'REVISE';
    recommendations.push('API endpoint should have documentation');
  }

  const reasoning = `API contract review for ${context.method} ${context.endpoint}: ${
    verdict === 'APPROVE'
      ? 'API design meets standards'
      : verdict === 'REVISE'
        ? 'API design needs minor improvements'
        : 'Breaking changes require special handling'
  }`;

  return {
    gate: 'API_CONTRACT',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Product Gates
// ============================================================================

/**
 * SPEC-READY: User story is ready to implement
 */
export function specReadyGate(context: StoryContext): GateResult<SpecReadyVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: SpecReadyVerdict = 'READY';

  // Check basic completeness
  if (!context.description || context.description.trim().length === 0) {
    verdict = 'BLOCKED';
    blockers.push('Story description is required');
  }

  // Check acceptance criteria
  if (!context.acceptanceCriteria || context.acceptanceCriteria.length === 0) {
    verdict = 'NEEDS_WORK';
    blockers.push('Acceptance criteria must be defined');
  }

  // Check for open questions
  if (context.openQuestions && context.openQuestions.length > 0) {
    verdict = 'BLOCKED';
    blockers.push('Open questions must be resolved before implementation:');
    context.openQuestions.forEach((q) => blockers.push(`  - ${q}`));
  }

  // Check dependencies
  if (context.dependencies && context.dependencies.length > 0) {
    recommendations.push(`Story has ${context.dependencies.length} dependencies. Verify they are completed.`);
  }

  // Check estimate
  if (context.estimateHours === undefined) {
    if (verdict === 'READY') verdict = 'NEEDS_WORK';
    recommendations.push('Estimate should be provided for planning');
  }

  // Check technical approach for complex stories
  if (context.estimateHours && context.estimateHours > 8 && !context.technicalApproach) {
    if (verdict === 'READY') verdict = 'NEEDS_WORK';
    recommendations.push('Large stories should have technical approach outlined');
  }

  const reasoning = `Spec readiness for "${context.title}": ${
    verdict === 'READY'
      ? 'Story is complete and ready for implementation'
      : verdict === 'NEEDS_WORK'
        ? 'Story has fixable gaps'
        : 'Story is blocked by external dependencies or unresolved questions'
  }`;

  return {
    gate: 'SPEC_READY',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * ACCEPTANCE: Implementation meets acceptance criteria
 */
export function acceptanceGate(
  context: StoryContext,
  testResults?: TestContext
): GateResult<AcceptanceVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: AcceptanceVerdict = 'ACCEPTED';

  // Check acceptance criteria exist
  if (!context.acceptanceCriteria || context.acceptanceCriteria.length === 0) {
    return {
      gate: 'ACCEPTANCE',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: acceptance criteria not defined',
      blockers: ['Acceptance criteria must be defined to verify completion'],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Check test results if provided
  if (testResults) {
    if (testResults.failingTests > 0) {
      verdict = 'REJECTED';
      blockers.push(`${testResults.failingTests} test(s) failing`);
    }

    if (testResults.skippedTests && testResults.skippedTests > 0) {
      if (verdict === 'ACCEPTED') verdict = 'REVISIONS_NEEDED';
      recommendations.push(`${testResults.skippedTests} test(s) skipped. All tests should be enabled.`);
    }

    // Check coverage by story type
    const coverageThreshold = context.type === 'feature' || context.type === 'api' ? 80 : 70;
    if (testResults.coverage.lines < coverageThreshold) {
      if (verdict === 'ACCEPTED') verdict = 'REVISIONS_NEEDED';
      blockers.push(
        `Test coverage ${testResults.coverage.lines}% is below threshold ${coverageThreshold}% for ${context.type} stories`
      );
    }
  }

  const reasoning = `Acceptance check for "${context.title}": ${
    verdict === 'ACCEPTED'
      ? 'Implementation meets all acceptance criteria'
      : verdict === 'REVISIONS_NEEDED'
        ? 'Implementation is mostly complete but needs minor revisions'
        : 'Implementation does not meet acceptance criteria'
  }`;

  return {
    gate: 'ACCEPTANCE',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Quality Gates
// ============================================================================

/**
 * TEST-COVERAGE: Adequate test coverage exists
 */
export function testCoverageGate(context: TestContext): GateResult<TestCoverageVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: TestCoverageVerdict = 'SUFFICIENT';

  // Check coverage metrics
  const { lines, branches, functions, statements } = context.coverage;

  if (lines < 60 || branches < 60 || functions < 60 || statements < 60) {
    verdict = 'INSUFFICIENT';
    if (lines < 60) blockers.push(`Line coverage ${lines}% is below minimum 60%`);
    if (branches < 60) blockers.push(`Branch coverage ${branches}% is below minimum 60%`);
    if (functions < 60) blockers.push(`Function coverage ${functions}% is below minimum 60%`);
    if (statements < 60) blockers.push(`Statement coverage ${statements}% is below minimum 60%`);
  } else if (lines < 80 || branches < 75 || functions < 80 || statements < 80) {
    verdict = 'GAPS';
    if (lines < 80) recommendations.push(`Line coverage ${lines}% is below target 80%`);
    if (branches < 75) recommendations.push(`Branch coverage ${branches}% is below target 75%`);
    if (functions < 80) recommendations.push(`Function coverage ${functions}% is below target 80%`);
    if (statements < 80) recommendations.push(`Statement coverage ${statements}% is below target 80%`);
  }

  // Check test distribution
  const totalTests = context.testTypes.unit + context.testTypes.integration + context.testTypes.e2e;
  if (totalTests === 0) {
    verdict = 'INSUFFICIENT';
    blockers.push('No tests found');
  } else {
    if (context.testTypes.unit === 0) {
      if (verdict === 'SUFFICIENT') verdict = 'GAPS';
      recommendations.push('No unit tests found. Unit tests are essential for maintainability.');
    }
  }

  // Check for skipped tests
  if (context.skippedTests && context.skippedTests > 0) {
    if (verdict === 'SUFFICIENT') verdict = 'GAPS';
    recommendations.push(`${context.skippedTests} test(s) skipped. All tests should be enabled.`);
  }

  const reasoning = `Test coverage assessment: ${
    verdict === 'SUFFICIENT'
      ? 'Coverage meets or exceeds targets'
      : verdict === 'GAPS'
        ? 'Coverage is acceptable but has areas for improvement'
        : 'Coverage is below minimum thresholds'
  }`;

  return {
    gate: 'TEST_COVERAGE',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * RELEASE-READY: Build ready for release
 */
export function releaseReadyGate(context: ReleaseContext): GateResult<ReleaseReadyVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: ReleaseReadyVerdict = 'READY';

  // Check build status
  if (context.buildStatus === 'failing') {
    verdict = 'BLOCKED';
    blockers.push('Build is failing');
  } else if (context.buildStatus === 'pending') {
    verdict = 'BLOCKED';
    blockers.push('Build is still in progress');
  }

  // Check test results
  if (context.testResults.failingTests > 0) {
    verdict = 'BLOCKED';
    blockers.push(`${context.testResults.failingTests} test(s) failing`);
  }

  // Check security scan
  if (!context.securityScanPassed) {
    verdict = 'BLOCKED';
    blockers.push('Security scan failed or not completed');
  }

  // Check documentation
  if (!context.documentationUpdated) {
    if (verdict === 'READY') verdict = 'CONCERNS';
    recommendations.push('Documentation should be updated before release');
  }

  // Check migrations
  if (context.migrationsReady === false) {
    verdict = 'BLOCKED';
    blockers.push('Database migrations not ready');
  }

  // Check test coverage
  if (context.testResults.coverage.lines < 70) {
    if (verdict === 'READY') verdict = 'CONCERNS';
    recommendations.push(`Test coverage ${context.testResults.coverage.lines}% is below recommended 70% for releases`);
  }

  // Check changelog
  if (context.changes.length === 0) {
    if (verdict === 'READY') verdict = 'CONCERNS';
    recommendations.push('No changes documented for this release');
  }

  const reasoning = `Release readiness for v${context.version}: ${
    verdict === 'READY'
      ? 'All checks pass, ready to release'
      : verdict === 'CONCERNS'
        ? 'Ready to release with minor concerns'
        : 'Release is blocked by critical issues'
  }`;

  return {
    gate: 'RELEASE_READY',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Design Gates
// ============================================================================

/**
 * UX-REVIEW: User experience review
 */
export function uxReviewGate(context: DesignContext): GateResult<UxReviewVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: UxReviewVerdict = 'APPROVE';

  if (!context.userFlow || context.userFlow.trim().length === 0) {
    return {
      gate: 'UX_REVIEW',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: user flow not specified',
      blockers: ['User flow must be documented for UX review'],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Check for usability notes
  if (!context.usabilityNotes) {
    verdict = 'ITERATE';
    recommendations.push('Usability considerations should be documented');
  }

  // Check for visual design
  if (!context.visualDesignLink) {
    verdict = 'ITERATE';
    recommendations.push('Visual design mockup should be provided');
  }

  // Check responsive design
  if (context.responsiveDesign === false) {
    verdict = 'REJECT';
    blockers.push('Responsive design is required for all user-facing components');
  }

  const reasoning = `UX review for "${context.component}": ${
    verdict === 'APPROVE'
      ? 'User experience design meets standards'
      : verdict === 'ITERATE'
        ? 'Design needs iteration to meet standards'
        : 'Design has fundamental issues requiring redesign'
  }`;

  return {
    gate: 'UX_REVIEW',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * ACCESSIBILITY: Accessibility compliance check
 */
export function accessibilityGate(context: DesignContext): GateResult<AccessibilityVerdict> {
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let verdict: AccessibilityVerdict = 'COMPLIANT';

  // Check for accessibility checklist
  if (!context.accessibilityChecklist || context.accessibilityChecklist.length === 0) {
    return {
      gate: 'ACCESSIBILITY',
      verdict: 'NOT_ASSESSED',
      reasoning: 'Missing required input: accessibility checklist not provided',
      blockers: ['Accessibility checklist must be completed'],
      recommendations: ['Use WCAG 2.1 Level AA as baseline'],
      timestamp: new Date().toISOString(),
    };
  }

  // Check checklist items
  const requiredItems = [
    'keyboard navigation',
    'screen reader',
    'color contrast',
    'focus indicators',
    'semantic html',
    'aria labels',
  ];

  const checklistLower = context.accessibilityChecklist.map((item) => item.toLowerCase());
  const missingItems = requiredItems.filter((req) => !checklistLower.some((item) => item.includes(req)));

  if (missingItems.length > 2) {
    verdict = 'MAJOR_ISSUES';
    blockers.push(`Missing critical accessibility checks: ${missingItems.join(', ')}`);
  } else if (missingItems.length > 0) {
    verdict = 'MINOR_ISSUES';
    recommendations.push(`Consider checking: ${missingItems.join(', ')}`);
  }

  const reasoning = `Accessibility review for "${context.component}": ${
    verdict === 'COMPLIANT'
      ? 'Meets WCAG 2.1 Level AA standards'
      : verdict === 'MINOR_ISSUES'
        ? 'Mostly compliant with minor issues to address'
        : 'Significant accessibility issues identified'
  }`;

  return {
    gate: 'ACCESSIBILITY',
    verdict,
    reasoning,
    blockers,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Gate Orchestration
// ============================================================================

export interface GateExecutionResult {
  gate: GateType;
  passed: boolean;
  result: GateResult<AnyGateVerdict>;
}

export interface AggregatedGateResults {
  allPassed: boolean;
  blockingFailures: GateExecutionResult[];
  advisoryFailures: GateExecutionResult[];
  passed: GateExecutionResult[];
  canProceed: boolean;
  summary: string;
}

/**
 * Execute a single gate and determine if it passed based on verdict
 */
export function executeGate<V extends AnyGateVerdict>(
  gateResult: GateResult<V>,
  blockingVerdicts: V[]
): GateExecutionResult {
  const passed = !blockingVerdicts.includes(gateResult.verdict);
  return {
    gate: gateResult.gate,
    passed,
    result: gateResult as GateResult<AnyGateVerdict>,
  };
}

/**
 * Aggregate multiple gate results and determine if work can proceed
 */
export function aggregateGateResults(
  results: GateExecutionResult[],
  blockingGates: GateType[] = []
): AggregatedGateResults {
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  const blockingFailures = failed.filter((r) => blockingGates.includes(r.gate));
  const advisoryFailures = failed.filter((r) => !blockingGates.includes(r.gate));

  const allPassed = failed.length === 0;
  const canProceed = blockingFailures.length === 0;

  const summary = `${passed.length}/${results.length} gates passed. ${
    blockingFailures.length > 0
      ? `${blockingFailures.length} blocking failure(s).`
      : advisoryFailures.length > 0
        ? `${advisoryFailures.length} advisory failure(s).`
        : 'All gates passed.'
  }`;

  return {
    allPassed,
    blockingFailures,
    advisoryFailures,
    passed,
    canProceed,
    summary,
  };
}

/**
 * Determine if a story can proceed based on gate results
 */
export function canStoryProceed(gateResults: AggregatedGateResults): boolean {
  return gateResults.canProceed;
}

/**
 * Get blocking issues across all failed gates
 */
export function getBlockingIssues(gateResults: AggregatedGateResults): string[] {
  const issues: string[] = [];
  for (const failure of gateResults.blockingFailures) {
    issues.push(`[${failure.gate}] ${failure.result.reasoning}`);
    issues.push(...failure.result.blockers.map((b) => `  - ${b}`));
  }
  return issues;
}

/**
 * Get all recommendations across gate results
 */
export function getAllRecommendations(results: GateExecutionResult[]): string[] {
  const recommendations: string[] = [];
  for (const result of results) {
    if (result.result.recommendations.length > 0) {
      recommendations.push(`[${result.gate}]`);
      recommendations.push(...result.result.recommendations.map((r) => `  - ${r}`));
    }
  }
  return recommendations;
}
