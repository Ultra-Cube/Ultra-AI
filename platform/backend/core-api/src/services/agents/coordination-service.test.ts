import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { AgentStaffStore } from './agent-staff-store';
import { CoordinationService } from './coordination-service';

function setupTestEnvironment() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coordination-'));
  const storePath = path.join(tempDir, 'state.json');
  const staffStore = new AgentStaffStore(storePath);
  const service = new CoordinationService(staffStore);

  return { service, staffStore, tempDir };
}

describe('CoordinationService', () => {
  describe('validateDelegation - Tier Delegation Rules', () => {
    it('allows valid downward delegation from T1 to T2', () => {
      const { service } = setupTestEnvironment();
      const result = service.validateDelegation(
        'chief-architect',
        'tech-lead',
        {
          title: 'Review API architecture',
          complexity: 'complex',
        }
      );

      if (!result.valid) {
        console.log('Validation failed:', result.reason);
      }
      expect(result.valid).toBe(true);
    });

    it('allows valid downward delegation from T2 to T3', () => {
      const { service } = setupTestEnvironment();
      const result = service.validateDelegation(
        'backend-lead',
        'database-engineer',
        {
          title: 'Implement user schema',
          complexity: 'simple',
        }
      );

      expect(result.valid).toBe(true);
    });

    it('rejects same-tier delegation', () => {
      const { service } = setupTestEnvironment();
      const result = service.validateDelegation(
        'backend-lead',
        'frontend-lead',
        {
          title: 'Design API contract',
        }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('same-tier');
      expect(result.suggestion).toContain('horizontal consultation');
    });

    it('rejects upward delegation', () => {
      const { service } = setupTestEnvironment();
      const result = service.validateDelegation(
        'database-engineer',
        'backend-lead',
        {
          title: 'Complex architecture decision',
        }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot delegate upward');
      expect(result.suggestion).toContain('Escalate');
    });

    it('rejects tier-skipping for complex tasks', () => {
      const { service } = setupTestEnvironment();
      const result = service.validateDelegation(
        'chief-architect',
        'database-engineer',
        {
          title: 'Redesign entire data model',
          complexity: 'complex',
        }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot skip tiers');
      expect(result.suggestion).toBeDefined();
    });

    it('validates reporting chain', () => {
      const { service } = setupTestEnvironment();
      // api-developer reports to backend-lead via escalation chain
      const result = service.validateDelegation(
        'backend-lead',
        'api-developer',
        {
          title: 'Implement endpoint',
        }
      );

      expect(result.valid).toBe(true);
    });

    it('handles non-existent agents', () => {
      const { service } = setupTestEnvironment();
      const result = service.validateDelegation('non-existent', 'tech-lead', {
        title: 'Task',
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not found');
    });
  });

  describe('escalate - Escalation Paths', () => {
    it('escalates from specialist to lead', () => {
      const { service, staffStore } = setupTestEnvironment();
      const agents = staffStore.getAgents();
      const agent = agents[0];

      const task = staffStore.assignTask({
        title: 'Schema conflicts with API design',
        agentId: agent.id,
        priority: 'high',
      });

      const result = service.escalate({
        taskId: task!.id,
        fromAgentId: 'database-engineer',
        reason: 'technical-blocker',
        context: 'Cannot proceed without architectural decision',
      });

      expect(result.escalatedTo).toBe('backend-lead');
      expect(result.escalationPath).toContain('database-engineer');
      expect(result.escalationPath).toContain('backend-lead');
      expect(result.requiresUserDecision).toBe(false);
    });

    it('escalates cross-domain conflicts to Engineering Manager', () => {
      const { service, staffStore } = setupTestEnvironment();
      const agents = staffStore.getAgents();
      const agent = agents[0];

      const task = staffStore.assignTask({
        title: 'Backend-Frontend API disagreement',
        agentId: agent.id,
      });

      const result = service.escalate({
        taskId: task!.id,
        fromAgentId: 'backend-lead',
        reason: 'cross-domain',
        context: 'Frontend Lead disagrees on API design',
      });

      expect(result.escalatedTo).toBe('engineering-manager');
      expect(result.escalationPath).toContain('engineering-manager');
      expect(result.requiresUserDecision).toBe(true);
    });

    it('escalates architecture concerns to Chief Architect', () => {
      const { service, staffStore } = setupTestEnvironment();
      const agents = staffStore.getAgents();
      const agent = agents[0];

      const task = staffStore.assignTask({
        title: 'Performance issue requires architecture change',
        agentId: agent.id,
      });

      const result = service.escalate({
        taskId: task!.id,
        fromAgentId: 'backend-lead',
        reason: 'architecture-concern',
        context: 'Current architecture cannot meet performance requirements',
        options: ['Microservices', 'Caching layer', 'Database sharding'],
        recommendation: 'Caching layer - least invasive',
      });

      expect(result.escalatedTo).toBe('chief-architect');
      expect(result.requiresUserDecision).toBe(true);
    });

    it('marks task as blocked during escalation', () => {
      const { service, staffStore } = setupTestEnvironment();
      // Use a staff agent that exists in the default store
      const agents = staffStore.getAgents();
      const agent = agents[0]; // Atlas

      const task = staffStore.assignTask({
        title: 'Blocked task',
        agentId: agent.id,
      });

      service.escalate({
        taskId: task!.id,
        fromAgentId: 'api-developer',
        reason: 'technical-blocker',
        context: 'Missing dependency',
      });

      const tasks = staffStore.getTasks();
      const updatedTask = tasks.find((t) => t.id === task!.id);
      expect(updatedTask?.status).toBe('blocked');
    });

    it('requires user decision for Tier 1 escalations', () => {
      const { service, staffStore } = setupTestEnvironment();
      const agents = staffStore.getAgents();
      const agent = agents[0];

      const task = staffStore.assignTask({
        title: 'Strategic decision needed',
        agentId: agent.id,
      });

      const result = service.escalate({
        taskId: task!.id,
        fromAgentId: 'tech-lead',
        reason: 'scope-exceeded',
        context: 'Feature requires significant scope expansion',
      });

      expect(result.requiresUserDecision).toBe(true);
      expect(result.escalationPath.length).toBeGreaterThan(1);
    });
  });

  describe('requestApproval - Ask-Before-Write Protocol', () => {
    it('requires lead approval for specialist file writes', () => {
      const { service } = setupTestEnvironment();
      const result = service.requestApproval({
        agentId: 'database-engineer',
        action: 'write-file',
        context: {
          description: 'Create user migration',
          affectedFiles: [
            'platform/backend/core-api/src/db/migrations/001_users.sql',
          ],
          rationale: 'New user table required',
        },
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvers).toContain('backend-lead');
      expect(result.reason).toContain('lead approval');
    });

    it('requires user approval for lead-level changes', () => {
      const { service } = setupTestEnvironment();
      const result = service.requestApproval({
        agentId: 'backend-lead',
        action: 'write-file',
        context: {
          description: 'Refactor core service',
          affectedFiles: ['platform/backend/core-api/src/services/core.ts'],
        },
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvers).toContain('user');
    });

    it('exempts agent memory files from approval', () => {
      const { service } = setupTestEnvironment();
      const result = service.requestApproval({
        agentId: 'tech-lead',
        action: 'write-file',
        context: {
          description: 'Update agent memory',
          affectedFiles: ['.claude/agents/tech-lead/.memory.md'],
        },
      });

      expect(result.requiresApproval).toBe(false);
      expect(result.reason).toContain('exempt');
    });

    it('exempts session state files from approval', () => {
      const { service } = setupTestEnvironment();
      const result = service.requestApproval({
        agentId: 'api-developer',
        action: 'write-file',
        context: {
          description: 'Update session checkpoint',
          affectedFiles: ['production/session-state/active.md'],
        },
      });

      expect(result.requiresApproval).toBe(false);
    });

    it('requires Chief Architect review for architecture changes', () => {
      const { service } = setupTestEnvironment();
      const result = service.requestApproval({
        agentId: 'tech-lead',
        action: 'modify-architecture',
        context: {
          description: 'Switch to event-driven architecture',
          rationale: 'Better scalability and decoupling',
          tradeoffs: [
            'Increased complexity',
            'Better scalability',
            'Eventual consistency',
          ],
        },
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvers).toContain('chief-architect');
      expect(result.approvers).toContain('user');
    });

    it('requires all domain leads for cross-domain changes', () => {
      const { service } = setupTestEnvironment();
      const result = service.requestApproval({
        agentId: 'backend-lead',
        action: 'cross-domain-change',
        context: {
          description: 'API contract change affecting frontend',
          affectedFiles: [
            'platform/backend/core-api/src/endpoints/users.ts',
            'platform/frontend/src/api/users.ts',
          ],
        },
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvers).toContain('user');
      // Should identify frontend and backend domains
      expect(result.approvers.length).toBeGreaterThan(1);
    });

    it('requires supervisor approval for deletions', () => {
      const { service } = setupTestEnvironment();
      const result = service.requestApproval({
        agentId: 'ui-developer',
        action: 'delete-file',
        context: {
          description: 'Remove deprecated component',
          affectedFiles: ['platform/frontend/src/components/OldButton.tsx'],
        },
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvers).toContain('frontend-lead');
    });

    it('requires DevOps Lead for deployments', () => {
      const { service } = setupTestEnvironment();

      const result = service.requestApproval({
        agentId: 'backend-lead',
        action: 'deploy',
        context: {
          description: 'Deploy to production',
        },
      });

      expect(result.requiresApproval).toBe(true);
      expect(result.approvers).toContain('devops-lead');
      expect(result.approvers).toContain('user');
    });
  });

  describe('consultPeers - Horizontal Consultation', () => {
    it('finds same-tier peers in related domains', () => {
      const { service } = setupTestEnvironment();
      const result = service.consultPeers({
        agentId: 'backend-lead',
        decision: 'API contract design',
        context: 'Need to agree on response format',
        domains: ['frontend', 'api'],
      });

      expect(result.peers.length).toBeGreaterThan(0);
      expect(result.peers.some((p) => p.id === 'frontend-lead')).toBe(true);
    });

    it('identifies cross-domain consultations', () => {
      const { service } = setupTestEnvironment();
      const result = service.consultPeers({
        agentId: 'backend-lead',
        decision: 'Choose authentication strategy',
        context: 'Need product input on UX implications',
        domains: ['product', 'feature'],
      });

      expect(result.crossDomain).toBe(true);
      expect(result.requiredReviewers.length).toBeGreaterThan(0);
    });

    it('requires domain owner review for cross-domain decisions', () => {
      const { service } = setupTestEnvironment();
      const result = service.consultPeers({
        agentId: 'backend-lead',
        decision: 'Database schema will affect UI structure',
        context: 'Schema change impacts frontend data models',
        domains: ['frontend', 'component'],
      });

      expect(result.crossDomain).toBe(true);
      expect(result.requiredReviewers).toContain('frontend-lead');
    });

    it('returns empty peers for same-domain consultation', () => {
      const { service } = setupTestEnvironment();
      const result = service.consultPeers({
        agentId: 'backend-lead',
        decision: 'Internal backend refactoring',
        context: 'Reorganize service layer',
        domains: ['backend'],
      });

      expect(result.crossDomain).toBe(false);
      expect(result.requiredReviewers.length).toBe(0);
    });

    it('excludes the requesting agent from peer list', () => {
      const { service } = setupTestEnvironment();
      const result = service.consultPeers({
        agentId: 'backend-lead',
        decision: 'Technical decision',
        context: 'Need peer input',
        domains: ['frontend', 'backend'],
      });

      expect(result.peers.every((p) => p.id !== 'backend-lead')).toBe(true);
    });
  });

  describe('propagateChange - Domain Boundaries & Change Propagation', () => {
    it('notifies all affected domain leads', () => {
      const { service } = setupTestEnvironment();
      const result = service.propagateChange(
        {
          domain: 'backend',
          description: 'API versioning strategy change',
          initiator: 'chief-architect',
          affectedArtifacts: ['platform/backend/core-api/src/routes/*'],
        },
        ['backend', 'frontend', 'documentation']
      );

      expect(result.notifiedAgents.length).toBeGreaterThan(0);
      expect(result.affectedDomains).toEqual([
        'backend',
        'frontend',
        'documentation',
      ]);
    });

    it('uses Engineering Manager as coordinator for technical changes', () => {
      const { service } = setupTestEnvironment();
      const result = service.propagateChange(
        {
          domain: 'backend',
          description: 'Database migration strategy',
          initiator: 'backend-lead',
        },
        ['backend', 'infrastructure']
      );

      expect(result.coordinatorId).toBe('engineering-manager');
    });

    it('uses Product Director as coordinator for product changes', () => {
      const { service } = setupTestEnvironment();
      const result = service.propagateChange(
        {
          domain: 'product',
          description: 'Feature prioritization change',
          initiator: 'product-manager',
        },
        ['product', 'design']
      );

      expect(result.coordinatorId).toBe('product-director');
    });

    it('identifies multiple affected domains from file paths', () => {
      const { service } = setupTestEnvironment();
      const result = service.propagateChange(
        {
          domain: 'backend',
          description: 'Major refactoring',
          initiator: 'tech-lead',
          affectedArtifacts: [
            'platform/backend/core-api/src/services/user.ts',
            'platform/frontend/src/api/users.ts',
            'infra/kubernetes/api-deployment.yaml',
            'docs/api/users.md',
          ],
        },
        ['backend', 'frontend', 'infrastructure', 'documentation']
      );

      expect(result.affectedDomains.length).toBe(4);
      expect(result.affectedDomains).toContain('backend');
      expect(result.affectedDomains).toContain('frontend');
      expect(result.affectedDomains).toContain('infrastructure');
      expect(result.affectedDomains).toContain('documentation');
    });

    it('notifies only Tier 2 leads, not all agents', () => {
      const { service } = setupTestEnvironment();

      const result = service.propagateChange(
        {
          domain: 'backend',
          description: 'Change affecting multiple teams',
          initiator: 'tech-lead',
        },
        ['backend', 'frontend']
      );

      // Should notify leads (T2), not specialists (T3)
      expect(result.notifiedAgents.length).toBeGreaterThan(0);
      // Verify at least backend-lead and frontend-lead are notified
      expect(result.notifiedAgents).toContain('backend-lead');
      expect(result.notifiedAgents).toContain('frontend-lead');
    });
  });
});
