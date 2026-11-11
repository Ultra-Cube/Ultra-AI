import {
  AgentDefinition,
  AgentTier,
  getAgentById,
  getAgentsByTier,
  getSubordinates,
  getEscalationChain,
  AGENT_REGISTRY,
} from './agent-registry';
import { AgentStaffStore } from './agent-staff-store';

/**
 * Coordination Service
 * 
 * Enforces Ultra-AI's agent studio coordination rules:
 * - Tier delegation (vertical hierarchy)
 * - Escalation paths (conflict resolution)
 * - Ask-before-write protocol (approval gates)
 * - Horizontal consultation (peer collaboration)
 * - Domain boundaries (cross-domain change propagation)
 * 
 * Based on AGENT_STUDIO_ARCHITECTURE.md coordination rules.
 */

export type DelegationResult =
  | { valid: true }
  | { valid: false; reason: string; suggestion?: string };

export type EscalationReason =
  | 'conflict'
  | 'technical-blocker'
  | 'cross-domain'
  | 'scope-exceeded'
  | 'architecture-concern';

export interface EscalationRequest {
  taskId: string;
  fromAgentId: string;
  reason: EscalationReason;
  context: string;
  options?: string[];
  recommendation?: string;
}

export interface EscalationResult {
  escalatedTo: string;
  escalationPath: string[];
  requiresUserDecision: boolean;
}

export type ApprovalAction =
  | 'write-file'
  | 'edit-file'
  | 'delete-file'
  | 'modify-architecture'
  | 'change-api-contract'
  | 'deploy'
  | 'cross-domain-change';

export interface ApprovalRequest {
  agentId: string;
  action: ApprovalAction;
  context: {
    description: string;
    affectedFiles?: string[];
    rationale?: string;
    tradeoffs?: string[];
  };
}

export interface ApprovalResult {
  requiresApproval: boolean;
  approvers: string[];
  reason: string;
}

export interface ConsultationRequest {
  agentId: string;
  decision: string;
  context: string;
  domains: string[];
}

export interface ConsultationResult {
  peers: AgentDefinition[];
  crossDomain: boolean;
  requiredReviewers: string[];
}

export interface DomainChange {
  domain: string;
  description: string;
  initiator: string;
  affectedArtifacts?: string[];
}

export interface PropagationResult {
  notifiedAgents: string[];
  affectedDomains: string[];
  coordinatorId: string;
}

export class CoordinationService {
  constructor(private staffStore: AgentStaffStore) {}

  /**
   * Validates delegation from one agent to another according to tier rules.
   * 
   * Rules:
   * - Leadership (Tier 1) delegates to leads (Tier 2)
   * - Leads (Tier 2) delegate to specialists (Tier 3)
   * - Never skip tiers for complex decisions
   * - Same-tier consultation allowed, but not delegation
   */
  validateDelegation(
    fromAgentId: string,
    toAgentId: string,
    task: { title: string; complexity?: 'simple' | 'complex' }
  ): DelegationResult {
    const fromAgent = getAgentById(fromAgentId);
    const toAgent = getAgentById(toAgentId);

    if (!fromAgent) {
      return {
        valid: false,
        reason: `Agent "${fromAgentId}" not found in registry`,
      };
    }

    if (!toAgent) {
      return {
        valid: false,
        reason: `Agent "${toAgentId}" not found in registry`,
      };
    }

    // Check tier hierarchy
    // Lower tier number = higher authority (Tier 1 > Tier 2 > Tier 3)
    const tierDiff = toAgent.tier - fromAgent.tier;

    // Same tier - only consultation allowed, not delegation
    if (tierDiff === 0) {
      return {
        valid: false,
        reason: 'Cannot delegate to same-tier agent. Use consultPeers() for horizontal collaboration.',
        suggestion: 'Use horizontal consultation instead',
      };
    }

    // Upward delegation (escalation) - use escalate() instead
    if (tierDiff < 0) {
      return {
        valid: false,
        reason: 'Cannot delegate upward. Use escalate() for upward communication.',
        suggestion: `Escalate to ${toAgent.name} instead`,
      };
    }

    // Downward delegation
    // For complex tasks, must delegate to immediate subordinate (one tier down)
    if (task.complexity === 'complex' && tierDiff > 1) {
      const chain = getEscalationChain(toAgentId);
      const supervisor = chain.length > 1 ? chain[1] : undefined;
      return {
        valid: false,
        reason: `Cannot skip tiers for complex decisions. Must delegate through ${supervisor?.name || 'intermediate tier'}.`,
        suggestion: supervisor
          ? `Delegate to ${supervisor.name} (Tier ${supervisor.tier}) first`
          : 'Delegate through proper tier hierarchy',
      };
    }

    // Check if toAgent reports to fromAgent (direct or through hierarchy)
    if (!this.isInReportingChain(toAgentId, fromAgentId)) {
      return {
        valid: false,
        reason: `${toAgent.name} does not report to ${fromAgent.name}. Delegation must follow organizational hierarchy.`,
      };
    }

    return { valid: true };
  }

  /**
   * Escalates a task up the hierarchy for conflict resolution or strategic decisions.
   * 
   * Escalation paths:
   * - Specialist → Lead → Leadership
   * - Cross-domain conflicts go to shared parent or Engineering Manager
   */
  escalate(escalation: EscalationRequest): EscalationResult {
    const fromAgent = getAgentById(escalation.fromAgentId);
    if (!fromAgent) {
      throw new Error(`Agent "${escalation.fromAgentId}" not found`);
    }

    const chain = getEscalationChain(escalation.fromAgentId);
    const escalationPath = chain.map((a) => a.id);
    let escalatedTo = chain.length > 1 ? chain[1].id : escalation.fromAgentId;

    // For cross-domain conflicts, escalate to Tier 1
    if (escalation.reason === 'cross-domain') {
      const tier1Agents = getAgentsByTier(1);
      const engineeringManager = tier1Agents.find(
        (a) => a.name === 'Engineering Manager'
      );
      const productDirector = tier1Agents.find(
        (a) => a.name === 'Product Director'
      );

      // Determine which T1 agent based on conflict type
      const tier1Lead =
        fromAgent.department === 'Product & Design'
          ? productDirector
          : engineeringManager;

      if (tier1Lead && !escalationPath.includes(tier1Lead.id)) {
        escalationPath.push(tier1Lead.id);
        escalatedTo = tier1Lead.id;
      }
    }

    // Architecture concerns always go to Chief Architect
    if (escalation.reason === 'architecture-concern') {
      const chiefArchitect = getAgentsByTier(1).find(
        (a) => a.name === 'Chief Architect'
      );
      if (chiefArchitect) {
        if (!escalationPath.includes(chiefArchitect.id)) {
          escalationPath.push(chiefArchitect.id);
        }
        escalatedTo = chiefArchitect.id;  // Always escalate to Chief Architect for arch concerns
      }
    }

    // Tier 1 decisions require user input
    const finalAgent = getAgentById(escalatedTo);
    const requiresUserDecision = finalAgent?.tier === 1;

    // Update task status in staff store
    this.staffStore.updateTaskStatus(escalation.taskId, 'blocked');

    return {
      escalatedTo,
      escalationPath,
      requiresUserDecision,
    };
  }

  /**
   * Implements ask-before-write protocol: determines if an action requires approval.
   * 
   * All file writes require approval unless:
   * - Agent memory files
   * - Session state checkpoints
   * - Generated artifacts in designated paths (when explicitly approved by orchestrator)
   */
  requestApproval(approval: ApprovalRequest): ApprovalResult {
    const agent = getAgentById(approval.agentId);
    if (!agent) {
      throw new Error(`Agent "${approval.agentId}" not found`);
    }

    const approvers: string[] = [];
    let requiresApproval = true;
    let reason = '';

    // Check for exemptions
    const affectedFiles = approval.context.affectedFiles || [];
    const allMemoryOrStateFiles = affectedFiles.every(
      (file) =>
        file.includes('.claude/agents/') ||
        file.includes('.memory.md') ||
        file.includes('production/session-state/')
    );

    if (allMemoryOrStateFiles && affectedFiles.length > 0) {
      requiresApproval = false;
      reason = 'Agent memory and session state files are exempt from approval';
      return { requiresApproval, approvers, reason };
    }

    // Determine approvers based on action type and agent tier
    switch (approval.action) {
      case 'write-file':
      case 'edit-file':
        // Specialists (Tier 3) need lead approval
        if (agent.tier === 3) {
          const supervisor = agent.escalatesTo ? getAgentById(agent.escalatesTo) : undefined;
          if (supervisor) approvers.push(supervisor.id);
          reason = 'Specialist implementations require lead approval';
        } else if (agent.tier === 2) {
          // Leads need user approval for significant changes
          approvers.push('user');
          reason = 'Lead-level changes require user approval';
        } else {
          // Tier 1 always needs user approval
          approvers.push('user');
          reason = 'Strategic-level changes require user approval';
        }
        break;

      case 'delete-file':
        // Deletions always require supervisor or user approval
        const supervisor = agent.escalatesTo ? getAgentById(agent.escalatesTo) : undefined;
        approvers.push(supervisor?.id || 'user');
        reason = 'File deletions require approval from supervisor or user';
        break;

      case 'modify-architecture':
      case 'change-api-contract':
        // Architecture changes require Chief Architect review
        const chiefArchitect = getAgentsByTier(1)
          .find((a) => a.name === 'Chief Architect');
        if (chiefArchitect) approvers.push(chiefArchitect.id);
        approvers.push('user');
        reason = 'Architecture and API changes require Chief Architect review and user approval';
        break;

      case 'cross-domain-change':
        // Cross-domain requires all affected domain leads
        const affectedDomains = this.identifyAffectedDomains(affectedFiles);
        affectedDomains.forEach((domain) => {
          const domainLeads = AGENT_REGISTRY.filter(
            (a) =>
              a.tier === 2 &&
              (a.role.toLowerCase().includes(domain.toLowerCase()) ||
                a.responsibilities.some((r) => r.toLowerCase().includes(domain.toLowerCase())))
          );
          domainLeads.forEach((lead) => approvers.push(lead.id));
        });
        approvers.push('user');
        reason = 'Cross-domain changes require review from all affected domain leads';
        break;

      case 'deploy':
        // Deployments require DevOps Lead and user approval
        const devopsLead = AGENT_REGISTRY
          .find((a) => a.name === 'DevOps Lead');
        if (devopsLead) approvers.push(devopsLead.id);
        approvers.push('user');
        reason = 'Deployments require DevOps Lead and user approval';
        break;
    }

    return {
      requiresApproval,
      approvers: [...new Set(approvers)], // Remove duplicates
      reason,
    };
  }

  /**
   * Facilitates horizontal consultation between same-tier agents.
   * 
   * Agents at the same tier may consult each other but cannot make
   * binding decisions outside their domain.
   */
  consultPeers(consultation: ConsultationRequest): ConsultationResult {
    const agent = getAgentById(consultation.agentId);
    if (!agent) {
      throw new Error(`Agent "${consultation.agentId}" not found`);
    }

    // Find same-tier agents
    const sameTierAgents = getAgentsByTier(agent.tier).filter(
      (a) => a.id !== agent.id
    );

    // Check if consultation crosses domains by looking at responsibilities
    const agentDomains = agent.responsibilities.map(r => r.toLowerCase());
    const requestedDomains = consultation.domains.map(d => d.toLowerCase());
    const crossDomain = requestedDomains.some(
      (d) => !agentDomains.some(ad => ad.includes(d))
    );

    // Find peers who have responsibilities in the requested domains
    const peers = sameTierAgents.filter((peer) =>
      peer.responsibilities.some(r => 
        requestedDomains.some(d => r.toLowerCase().includes(d))
      )
    );

    // If cross-domain, identify required reviewers (domain owners)
    const requiredReviewers: string[] = [];
    if (crossDomain) {
      requestedDomains.forEach((domain) => {
        const domainOwner = sameTierAgents.find((a) =>
          a.responsibilities.some(r => r.toLowerCase().includes(domain))
        );
        if (domainOwner && !requiredReviewers.includes(domainOwner.id)) {
          requiredReviewers.push(domainOwner.id);
        }
      });
    }

    return {
      peers,
      crossDomain,
      requiredReviewers,
    };
  }

  /**
   * Propagates changes across affected domains and notifies dependent agents.
   * 
   * When a decision affects multiple domains, the Engineering Manager or
   * Product Director coordinates propagation.
   */
  propagateChange(change: DomainChange, affectedDomains: string[]): PropagationResult {
    const initiator = getAgentById(change.initiator);
    if (!initiator) {
      throw new Error(`Initiating agent "${change.initiator}" not found`);
    }

    // Determine coordinator based on change type
    const tier1Agents = getAgentsByTier(1);
    const engineeringManager = tier1Agents.find(
      (a) => a.name === 'Engineering Manager'
    );
    const productDirector = tier1Agents.find((a) => a.name === 'Product Director');

    // Product/Design changes coordinated by Product Director, technical by Engineering Manager
    const isProductChange =
      change.domain === 'product' ||
      change.domain === 'design' ||
      affectedDomains.includes('product') ||
      affectedDomains.includes('design');

    const coordinator = isProductChange ? productDirector : engineeringManager;
    if (!coordinator) {
      throw new Error('No coordinator found for change propagation');
    }

    // Find all agents in affected domains (notify Tier 2 leads)
    const notifiedAgents: string[] = [];
    affectedDomains.forEach((domain) => {
      const domainAgents = AGENT_REGISTRY.filter(
        (a) =>
          a.tier === 2 &&
          (a.role.toLowerCase().includes(domain.toLowerCase()) ||
            a.responsibilities.some((r) => r.toLowerCase().includes(domain.toLowerCase())))
      );

      domainAgents.forEach((agent) => {
        if (!notifiedAgents.includes(agent.id)) {
          notifiedAgents.push(agent.id);
        }
      });
    });

    return {
      notifiedAgents,
      affectedDomains,
      coordinatorId: coordinator.id,
    };
  }

  // Helper methods

  // Helper methods

  private isInReportingChain(subordinateId: string, supervisorId: string): boolean {
    const chain = getEscalationChain(subordinateId);
    return chain.some((agent) => agent.id === supervisorId);
  }

  private identifyAffectedDomains(files: string[]): string[] {
    const domains = new Set<string>();

    files.forEach((file) => {
      if (file.includes('apps/api/') || file.includes('packages/backend-')) {
        domains.add('backend');
      }
      if (file.includes('apps/web/') || file.includes('packages/ui-')) {
        domains.add('frontend');
      }
      if (file.includes('apps/ml-') || file.includes('packages/ml-') || file.includes('models/')) {
        domains.add('ml');
      }
      if (
        file.includes('infra/') ||
        file.includes('.github/workflows/') ||
        file.includes('docker/')
      ) {
        domains.add('infrastructure');
      }
      if (file.includes('design/') || file.includes('packages/design-system/')) {
        domains.add('design');
      }
      if (file.includes('docs/')) {
        domains.add('documentation');
      }
    });

    return Array.from(domains);
  }
}
