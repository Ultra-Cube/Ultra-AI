import type { PolicyDecision, PolicyPort, ZeroAIRequest } from './types';

/**
 * Default local-first policy — the OpenClaw decision point.
 *
 * Ordered rules (first match wins):
 *  1. explicit `escalate` hint or escalation keywords  → Ultra gateway
 *  2. registered sensitive patterns                     → confirmation gate
 *  3. matching local tool                              → local-tool
 *  4. matching workflow                                → workflow (n8n etc.)
 *  5. default                                          → local-model
 *
 * Escalation is conditional; local execution is the default. A gateway that
 * is unavailable forces a fallback to local-model rather than failing.
 */

export interface PolicyRule {
  id: string;
  match: (req: ZeroAIRequest, text: string) => boolean;
  decide: (req: ZeroAIRequest) => Omit<
    PolicyDecision,
    'requiresConfirmation'
  > & {
    requiresConfirmation?: boolean;
  };
}

export interface PolicyEngineOptions {
  /** Extra sensitive patterns; matched case-insensitively as substrings. */
  sensitivePatterns?: string[];
  /** Keywords that force escalation to Ultra. */
  escalatePatterns?: string[];
  /** Target ids used in decisions. */
  targets?: { model?: string; gateway?: string };
}

const DEFAULT_SENSITIVE = [
  'delete',
  'remove',
  'format',
  'shutdown',
  'reboot',
  'rm -rf',
  'drop table',
  'send email',
  'transfer',
  'payment',
  'password',
];

const DEFAULT_ESCALATE = [
  'ultra ai',
  'ultra-ai',
  'cloud',
  'distributed',
  'escalate',
  'offload',
];

function hasAny(text: string, patterns: string[]): string[] {
  const t = text.toLowerCase();
  return patterns.filter((p) => t.includes(p.toLowerCase()));
}

export class PolicyEngine implements PolicyPort {
  private readonly sensitive: string[];
  private readonly escalate: string[];
  private readonly modelTarget: string;
  private readonly gatewayTarget: string;

  constructor(opts: PolicyEngineOptions = {}) {
    this.sensitive = opts.sensitivePatterns ?? DEFAULT_SENSITIVE;
    this.escalate = opts.escalatePatterns ?? DEFAULT_ESCALATE;
    this.modelTarget = opts.targets?.model ?? 'default-local';
    this.gatewayTarget = opts.targets?.gateway ?? 'ultra-gateway';
  }

  /** Exposed for the router's confirmation gate. */
  sensitiveFlagsFor(text: string): string[] {
    return hasAny(text, this.sensitive);
  }

  async decide(req: ZeroAIRequest): Promise<PolicyDecision> {
    const text = req.text.toLowerCase();

    // Rule: explicit or keyword escalation
    if (req.hint === 'escalate' || hasAny(text, this.escalate).length > 0) {
      return {
        route: 'escalate',
        target: this.gatewayTarget,
        reason: 'Request requires Ultra AI scale or was explicitly escalated',
        requiresConfirmation: false,
        rule: 'escalation',
      };
    }

    // Rule: workflow hint
    if (req.hint === 'workflow') {
      return {
        route: 'workflow',
        target:
          (req.metadata?.workflowId as string | undefined) ??
          'default-workflow',
        reason: 'User requested a repeatable workflow',
        requiresConfirmation: false,
        rule: 'workflow-hint',
      };
    }

    // Rule: tool hint
    if (req.hint === 'local-tool') {
      return {
        route: 'local-tool',
        target:
          (req.metadata?.toolName as string | undefined) ?? 'default-tool',
        reason: 'User requested a local device action',
        requiresConfirmation: this.sensitiveFlagsFor(text).length > 0,
        rule: 'tool-hint',
      };
    }

    // Default: local model — local-first
    return {
      route: 'local-model',
      target: this.modelTarget,
      reason: 'Resolved locally by the default model lane',
      requiresConfirmation: this.sensitiveFlagsFor(text).length > 0,
      rule: 'local-default',
    };
  }
}
