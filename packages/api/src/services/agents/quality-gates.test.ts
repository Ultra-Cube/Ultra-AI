import {
  archFeasibilityGate,
  archReviewGate,
  archChangeImpactGate,
  codeReviewGate,
  apiContractGate,
  specReadyGate,
  acceptanceGate,
  testCoverageGate,
  releaseReadyGate,
  uxReviewGate,
  accessibilityGate,
  executeGate,
  aggregateGateResults,
  canStoryProceed,
  getBlockingIssues,
  getAllRecommendations,
  type FeatureContext,
  type StoryContext,
  type ChangesetContext,
  type CodeContext,
  type ApiContext,
  type TestContext,
  type ReleaseContext,
  type DesignContext,
} from './quality-gates';

describe('Quality Gates', () => {
  describe('Architecture Gates', () => {
    describe('archFeasibilityGate', () => {
      it('returns VIABLE for complete, well-defined feature', () => {
        const context: FeatureContext = {
          name: 'User Authentication',
          description: 'Implement OAuth2 authentication flow',
          requirements: ['Support OAuth2', 'JWT tokens', 'Refresh tokens'],
          performanceBudget: {
            responseTime: '200ms',
            throughput: '1000 req/s',
            latency: '50ms',
          },
          securityRequirements: ['HTTPS only', 'Token encryption', 'Rate limiting'],
          testStrategy: 'Unit tests + integration tests + security tests',
        };

        const result = archFeasibilityGate(context);

        expect(result.verdict).toBe('VIABLE');
        expect(result.gate).toBe('ARCH_FEASIBILITY');
        expect(result.blockers).toHaveLength(0);
      });

      it('returns CONCERNS when performance budgets are incomplete', () => {
        const context: FeatureContext = {
          name: 'API Gateway',
          description: 'Central API gateway',
          requirements: ['Route requests', 'Load balancing'],
          performanceBudget: {
            responseTime: '100ms',
          },
        };

        const result = archFeasibilityGate(context);

        expect(result.verdict).toBe('CONCERNS');
        expect(result.recommendations.some((r) => r.includes('performance budgets'))).toBe(true);
      });

      it('returns HIGH_RISK when too many constraints exist', () => {
        const context: FeatureContext = {
          name: 'Complex Feature',
          description: 'Complex implementation',
          requirements: ['Requirement 1'],
          constraints: [
            'Constraint 1',
            'Constraint 2',
            'Constraint 3',
            'Constraint 4',
            'Constraint 5',
            'Constraint 6',
          ],
        };

        const result = archFeasibilityGate(context);

        expect(result.verdict).toBe('HIGH_RISK');
        expect(result.blockers.length).toBeGreaterThan(0);
      });

      it('returns NOT_ASSESSED when requirements are missing', () => {
        const context: FeatureContext = {
          name: 'Incomplete Feature',
          description: 'Missing requirements',
          requirements: [],
        };

        const result = archFeasibilityGate(context);

        expect(result.verdict).toBe('NOT_ASSESSED');
        expect(result.blockers.some((b) => b.includes('Requirements must be defined'))).toBe(true);
      });
    });

    describe('archReviewGate', () => {
      it('returns APPROVE for well-documented story with ADRs', () => {
        const context: StoryContext = {
          id: 'story-1',
          title: 'Add caching layer',
          description: 'Implement Redis caching',
          acceptanceCriteria: ['Cache hits measured', 'TTL configured'],
          technicalApproach: 'Use Redis with write-through pattern',
          adrReferences: ['ADR-001-caching-strategy'],
          dependencies: ['Redis installation'],
        };

        const result = archReviewGate(context);

        expect(result.verdict).toBe('APPROVE');
        expect(result.blockers).toHaveLength(0);
      });

      it('returns REJECT when open questions exist', () => {
        const context: StoryContext = {
          id: 'story-2',
          title: 'Database migration',
          description: 'Migrate to PostgreSQL',
          technicalApproach: 'Multi-phase migration',
          openQuestions: ['How to handle downtime?', 'Rollback strategy?'],
        };

        const result = archReviewGate(context);

        expect(result.verdict).toBe('REJECT');
        expect(result.blockers.length).toBeGreaterThan(0);
        expect(result.blockers.some((b) => b.includes('open questions'))).toBe(
          true
        );
      });

      it('returns NOT_ASSESSED when technical approach is missing', () => {
        const context: StoryContext = {
          id: 'story-3',
          title: 'Feature X',
          description: 'Build feature X',
        };

        const result = archReviewGate(context);

        expect(result.verdict).toBe('NOT_ASSESSED');
        expect(result.reasoning).toContain('technical approach not specified');
      });
    });

    describe('archChangeImpactGate', () => {
      it('returns LOW_IMPACT for small changesets', () => {
        const context: ChangesetContext = {
          files: ['src/utils/helper.ts', 'src/utils/helper.test.ts'],
          description: 'Add utility function',
        };

        const result = archChangeImpactGate(context);

        expect(result.verdict).toBe('LOW_IMPACT');
      });

      it('returns MEDIUM_IMPACT for moderate changesets', () => {
        const context: ChangesetContext = {
          files: Array.from({ length: 15 }, (_, i) => `file${i}.ts`),
          description: 'Refactor module',
        };

        const result = archChangeImpactGate(context);

        expect(result.verdict).toBe('MEDIUM_IMPACT');
      });

      it('returns HIGH_IMPACT for breaking changes without migration plan', () => {
        const context: ChangesetContext = {
          files: ['api/v1/users.ts'],
          description: 'Breaking API change',
          breakingChanges: true,
          migrationRequired: false,
        };

        const result = archChangeImpactGate(context);

        expect(result.verdict).toBe('HIGH_IMPACT');
        expect(result.blockers.some((b) => b.includes('migration plan'))).toBe(true);
      });
    });
  });

  describe('Code Review Gates', () => {
    describe('codeReviewGate', () => {
      it('returns APPROVE for clean code with good coverage', () => {
        const context: CodeContext = {
          filePath: 'src/services/auth.ts',
          content: 'export function authenticate() { return true; }',
          language: 'typescript',
          purpose: 'Authentication service',
          testCoverage: 85,
        };

        const result = codeReviewGate(context);

        expect(result.verdict).toBe('APPROVE');
        expect(result.blockers).toHaveLength(0);
      });

      it('returns CHANGES_REQUIRED when lint errors exist', () => {
        const context: CodeContext = {
          filePath: 'src/bad.ts',
          content: 'const x = 1',
          language: 'typescript',
          purpose: 'Test file',
          lintErrors: ['Missing semicolon', 'Unused variable'],
        };

        const result = codeReviewGate(context);

        expect(result.verdict).toBe('CHANGES_REQUIRED');
        expect(result.blockers.length).toBeGreaterThan(0);
      });

      it('returns CHANGES_REQUIRED when security warnings exist', () => {
        const context: CodeContext = {
          filePath: 'src/insecure.ts',
          content: 'eval(userInput)',
          language: 'typescript',
          purpose: 'Dangerous code',
          securityWarnings: ['Use of eval() with user input'],
        };

        const result = codeReviewGate(context);

        expect(result.verdict).toBe('CHANGES_REQUIRED');
        expect(result.blockers.some((b) => b.includes('Security'))).toBe(true);
      });

      it('returns APPROVE_WITH_SUGGESTIONS for low coverage', () => {
        const context: CodeContext = {
          filePath: 'src/utils.ts',
          content: 'export const add = (a, b) => a + b;',
          language: 'typescript',
          purpose: 'Utilities',
          testCoverage: 65,
        };

        const result = codeReviewGate(context);

        expect(result.verdict).toBe('APPROVE_WITH_SUGGESTIONS');
        expect(result.recommendations.some((r) => r.includes('coverage'))).toBe(
          true
        );
      });
    });

    describe('apiContractGate', () => {
      it('returns APPROVE for well-defined API', () => {
        const context: ApiContext = {
          endpoint: '/api/users',
          method: 'GET',
          responseSchema: { users: [] },
          documentation: 'Returns list of users',
        };

        const result = apiContractGate(context);

        expect(result.verdict).toBe('APPROVE');
      });

      it('returns BREAKING_CHANGE_REQUIRED for unversioned breaking changes', () => {
        const context: ApiContext = {
          endpoint: '/api/users',
          method: 'POST',
          breaking: true,
          versioned: false,
        };

        const result = apiContractGate(context);

        expect(result.verdict).toBe('BREAKING_CHANGE_REQUIRED');
        expect(result.blockers.some((b) => b.includes('API versioning'))).toBe(true);
      });
    });
  });

  describe('Product Gates', () => {
    describe('specReadyGate', () => {
      it('returns READY for complete user story', () => {
        const context: StoryContext = {
          id: 'story-1',
          title: 'Add user profile',
          description: 'Users can edit their profile',
          acceptanceCriteria: ['User can update name', 'Changes are saved'],
          estimateHours: 4,
          type: 'feature',
        };

        const result = specReadyGate(context);

        expect(result.verdict).toBe('READY');
      });

      it('returns BLOCKED when open questions exist', () => {
        const context: StoryContext = {
          id: 'story-2',
          title: 'Complex feature',
          description: 'Build something',
          acceptanceCriteria: ['It works'],
          openQuestions: ['How should errors be handled?'],
        };

        const result = specReadyGate(context);

        expect(result.verdict).toBe('BLOCKED');
        expect(result.blockers.some((b) => b.includes('Open questions'))).toBe(
          true
        );
      });

      it('returns NEEDS_WORK when acceptance criteria missing', () => {
        const context: StoryContext = {
          id: 'story-3',
          title: 'Feature',
          description: 'Description here',
        };

        const result = specReadyGate(context);

        expect(result.verdict).toBe('NEEDS_WORK');
        expect(result.blockers.some((b) => b.includes('Acceptance criteria'))).toBe(true);
      });
    });

    describe('acceptanceGate', () => {
      it('returns ACCEPTED when criteria met and tests pass', () => {
        const context: StoryContext = {
          id: 'story-1',
          title: 'Feature complete',
          description: 'Done',
          acceptanceCriteria: ['Works as expected'],
          type: 'feature',
        };

        const testResults: TestContext = {
          totalTests: 10,
          passingTests: 10,
          failingTests: 0,
          coverage: { lines: 85, branches: 80, functions: 90, statements: 85 },
          testTypes: { unit: 8, integration: 2, e2e: 0 },
        };

        const result = acceptanceGate(context, testResults);

        expect(result.verdict).toBe('ACCEPTED');
      });

      it('returns REJECTED when tests are failing', () => {
        const context: StoryContext = {
          id: 'story-2',
          title: 'Feature',
          description: 'Incomplete',
          acceptanceCriteria: ['Works'],
        };

        const testResults: TestContext = {
          totalTests: 10,
          passingTests: 8,
          failingTests: 2,
          coverage: { lines: 80, branches: 75, functions: 80, statements: 80 },
          testTypes: { unit: 8, integration: 2, e2e: 0 },
        };

        const result = acceptanceGate(context, testResults);

        expect(result.verdict).toBe('REJECTED');
        expect(result.blockers.some((b) => b.includes('failing'))).toBe(true);
      });
    });
  });

  describe('Quality Gates', () => {
    describe('testCoverageGate', () => {
      it('returns SUFFICIENT for good coverage', () => {
        const context: TestContext = {
          totalTests: 50,
          passingTests: 50,
          failingTests: 0,
          coverage: { lines: 85, branches: 80, functions: 90, statements: 85 },
          testTypes: { unit: 40, integration: 8, e2e: 2 },
        };

        const result = testCoverageGate(context);

        expect(result.verdict).toBe('SUFFICIENT');
      });

      it('returns GAPS when coverage is below target but above minimum', () => {
        const context: TestContext = {
          totalTests: 20,
          passingTests: 20,
          failingTests: 0,
          coverage: { lines: 70, branches: 65, functions: 75, statements: 72 },
          testTypes: { unit: 18, integration: 2, e2e: 0 },
        };

        const result = testCoverageGate(context);

        expect(result.verdict).toBe('GAPS');
        expect(result.recommendations.length).toBeGreaterThan(0);
      });

      it('returns INSUFFICIENT when coverage is below minimum', () => {
        const context: TestContext = {
          totalTests: 10,
          passingTests: 10,
          failingTests: 0,
          coverage: { lines: 50, branches: 45, functions: 55, statements: 52 },
          testTypes: { unit: 10, integration: 0, e2e: 0 },
        };

        const result = testCoverageGate(context);

        expect(result.verdict).toBe('INSUFFICIENT');
        expect(result.blockers.length).toBeGreaterThan(0);
      });
    });

    describe('releaseReadyGate', () => {
      it('returns READY for successful release candidate', () => {
        const context: ReleaseContext = {
          version: '1.2.0',
          changes: ['Feature A', 'Bug fix B'],
          testResults: {
            totalTests: 100,
            passingTests: 100,
            failingTests: 0,
            coverage: {
              lines: 85,
              branches: 80,
              functions: 90,
              statements: 85,
            },
            testTypes: { unit: 80, integration: 15, e2e: 5 },
          },
          buildStatus: 'passing',
          securityScanPassed: true,
          documentationUpdated: true,
        };

        const result = releaseReadyGate(context);

        expect(result.verdict).toBe('READY');
      });

      it('returns BLOCKED when build is failing', () => {
        const context: ReleaseContext = {
          version: '1.2.0',
          changes: ['Feature A'],
          testResults: {
            totalTests: 100,
            passingTests: 100,
            failingTests: 0,
            coverage: {
              lines: 85,
              branches: 80,
              functions: 90,
              statements: 85,
            },
            testTypes: { unit: 80, integration: 15, e2e: 5 },
          },
          buildStatus: 'failing',
          securityScanPassed: true,
          documentationUpdated: true,
        };

        const result = releaseReadyGate(context);

        expect(result.verdict).toBe('BLOCKED');
        expect(result.blockers.some((b) => b.includes('Build is failing'))).toBe(true);
      });

      it('returns BLOCKED when security scan failed', () => {
        const context: ReleaseContext = {
          version: '1.2.0',
          changes: ['Feature A'],
          testResults: {
            totalTests: 100,
            passingTests: 100,
            failingTests: 0,
            coverage: {
              lines: 85,
              branches: 80,
              functions: 90,
              statements: 85,
            },
            testTypes: { unit: 80, integration: 15, e2e: 5 },
          },
          buildStatus: 'passing',
          securityScanPassed: false,
          documentationUpdated: true,
        };

        const result = releaseReadyGate(context);

        expect(result.verdict).toBe('BLOCKED');
        expect(result.blockers.some((b) => b.includes('Security'))).toBe(true);
      });
    });
  });

  describe('Design Gates', () => {
    describe('uxReviewGate', () => {
      it('returns APPROVE for complete UX design', () => {
        const context: DesignContext = {
          component: 'Login Form',
          userFlow: 'User enters credentials -> validates -> redirects',
          usabilityNotes: 'Clear error messages, auto-focus on first field',
          visualDesignLink: 'https://figma.com/design-123',
          responsiveDesign: true,
        };

        const result = uxReviewGate(context);

        expect(result.verdict).toBe('APPROVE');
      });

      it('returns REJECT when responsive design is missing', () => {
        const context: DesignContext = {
          component: 'Dashboard',
          userFlow: 'User views dashboard',
          responsiveDesign: false,
        };

        const result = uxReviewGate(context);

        expect(result.verdict).toBe('REJECT');
        expect(result.blockers.some((b) => b.includes('Responsive design'))).toBe(true);
      });
    });

    describe('accessibilityGate', () => {
      it('returns COMPLIANT when all accessibility checks pass', () => {
        const context: DesignContext = {
          component: 'Navigation Menu',
          userFlow: 'User navigates site',
          accessibilityChecklist: [
            'Keyboard navigation tested',
            'Screen reader compatible',
            'Color contrast verified',
            'Focus indicators visible',
            'Semantic HTML used',
            'ARIA labels added',
          ],
        };

        const result = accessibilityGate(context);

        expect(result.verdict).toBe('COMPLIANT');
      });

      it('returns MAJOR_ISSUES when many checks are missing', () => {
        const context: DesignContext = {
          component: 'Form',
          userFlow: 'User submits form',
          accessibilityChecklist: ['Some basic testing'],
        };

        const result = accessibilityGate(context);

        expect(result.verdict).toBe('MAJOR_ISSUES');
        expect(result.blockers.length).toBeGreaterThan(0);
      });

      it('returns NOT_ASSESSED when checklist is missing', () => {
        const context: DesignContext = {
          component: 'Button',
          userFlow: 'User clicks button',
        };

        const result = accessibilityGate(context);

        expect(result.verdict).toBe('NOT_ASSESSED');
      });
    });
  });

  describe('Gate Orchestration', () => {
    describe('executeGate', () => {
      it('marks gate as passed when verdict is not in blocking list', () => {
        const gateResult = archFeasibilityGate({
          name: 'Feature',
          description: 'Test',
          requirements: ['Req 1'],
          testStrategy: 'Unit tests',
        });

        const execution = executeGate(gateResult, [
          'HIGH_RISK',
          'NOT_ASSESSED',
        ]);

        expect(execution.passed).toBe(true);
        expect(execution.gate).toBe('ARCH_FEASIBILITY');
      });

      it('marks gate as failed when verdict is in blocking list', () => {
        const gateResult = archFeasibilityGate({
          name: 'Feature',
          description: 'Test',
          requirements: [],
        });

        const execution = executeGate(gateResult, ['NOT_ASSESSED']);

        expect(execution.passed).toBe(false);
      });
    });

    describe('aggregateGateResults', () => {
      it('returns all passed when no failures exist', () => {
        const results = [
          {
            gate: 'ARCH_FEASIBILITY' as const,
            passed: true,
            result: {
              gate: 'ARCH_FEASIBILITY' as const,
              verdict: 'VIABLE' as const,
              reasoning: 'OK',
              blockers: [],
              recommendations: [],
              timestamp: new Date().toISOString(),
            },
          },
          {
            gate: 'CODE_REVIEW' as const,
            passed: true,
            result: {
              gate: 'CODE_REVIEW' as const,
              verdict: 'APPROVE' as const,
              reasoning: 'OK',
              blockers: [],
              recommendations: [],
              timestamp: new Date().toISOString(),
            },
          },
        ];

        const aggregated = aggregateGateResults(results, ['ARCH_FEASIBILITY']);

        expect(aggregated.allPassed).toBe(true);
        expect(aggregated.canProceed).toBe(true);
        expect(aggregated.blockingFailures).toHaveLength(0);
      });

      it('separates blocking and advisory failures', () => {
        const results = [
          {
            gate: 'ARCH_FEASIBILITY' as const,
            passed: false,
            result: {
              gate: 'ARCH_FEASIBILITY' as const,
              verdict: 'HIGH_RISK' as const,
              reasoning: 'Risk identified',
              blockers: ['Major risk'],
              recommendations: [],
              timestamp: new Date().toISOString(),
            },
          },
          {
            gate: 'TEST_COVERAGE' as const,
            passed: false,
            result: {
              gate: 'TEST_COVERAGE' as const,
              verdict: 'GAPS' as const,
              reasoning: 'Coverage gaps',
              blockers: [],
              recommendations: ['Add more tests'],
              timestamp: new Date().toISOString(),
            },
          },
        ];

        const aggregated = aggregateGateResults(results, ['ARCH_FEASIBILITY']);

        expect(aggregated.allPassed).toBe(false);
        expect(aggregated.canProceed).toBe(false);
        expect(aggregated.blockingFailures).toHaveLength(1);
        expect(aggregated.advisoryFailures).toHaveLength(1);
      });
    });

    describe('canStoryProceed', () => {
      it('returns true when no blocking failures exist', () => {
        const aggregated = {
          allPassed: false,
          blockingFailures: [],
          advisoryFailures: [
            {
              gate: 'TEST_COVERAGE' as const,
              passed: false,
              result: {
                gate: 'TEST_COVERAGE' as const,
                verdict: 'GAPS' as const,
                reasoning: 'Minor gaps',
                blockers: [],
                recommendations: [],
                timestamp: new Date().toISOString(),
              },
            },
          ],
          passed: [],
          canProceed: true,
          summary: 'Can proceed',
        };

        expect(canStoryProceed(aggregated)).toBe(true);
      });

      it('returns false when blocking failures exist', () => {
        const aggregated = {
          allPassed: false,
          blockingFailures: [
            {
              gate: 'SPEC_READY' as const,
              passed: false,
              result: {
                gate: 'SPEC_READY' as const,
                verdict: 'BLOCKED' as const,
                reasoning: 'Not ready',
                blockers: ['Missing criteria'],
                recommendations: [],
                timestamp: new Date().toISOString(),
              },
            },
          ],
          advisoryFailures: [],
          passed: [],
          canProceed: false,
          summary: 'Blocked',
        };

        expect(canStoryProceed(aggregated)).toBe(false);
      });
    });

    describe('getBlockingIssues', () => {
      it('extracts all blockers from blocking failures', () => {
        const aggregated = {
          allPassed: false,
          blockingFailures: [
            {
              gate: 'CODE_REVIEW' as const,
              passed: false,
              result: {
                gate: 'CODE_REVIEW' as const,
                verdict: 'CHANGES_REQUIRED' as const,
                reasoning: 'Issues found',
                blockers: ['Lint error 1', 'Security warning 1'],
                recommendations: [],
                timestamp: new Date().toISOString(),
              },
            },
          ],
          advisoryFailures: [],
          passed: [],
          canProceed: false,
          summary: 'Issues',
        };

        const issues = getBlockingIssues(aggregated);

        expect(issues.length).toBeGreaterThan(0);
        expect(issues.some((i) => i.includes('CODE_REVIEW'))).toBe(true);
      });
    });

    describe('getAllRecommendations', () => {
      it('collects recommendations from all results', () => {
        const results = [
          {
            gate: 'ARCH_FEASIBILITY' as const,
            passed: true,
            result: {
              gate: 'ARCH_FEASIBILITY' as const,
              verdict: 'CONCERNS' as const,
              reasoning: 'OK with suggestions',
              blockers: [],
              recommendations: ['Add performance tests'],
              timestamp: new Date().toISOString(),
            },
          },
          {
            gate: 'CODE_REVIEW' as const,
            passed: true,
            result: {
              gate: 'CODE_REVIEW' as const,
              verdict: 'APPROVE_WITH_SUGGESTIONS' as const,
              reasoning: 'Good code',
              blockers: [],
              recommendations: ['Improve coverage'],
              timestamp: new Date().toISOString(),
            },
          },
        ];

        const recommendations = getAllRecommendations(results);

        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.some((r) => r.includes('performance'))).toBe(
          true
        );
        expect(recommendations.some((r) => r.includes('coverage'))).toBe(true);
      });
    });
  });
});
