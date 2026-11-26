// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗       ║
// ║ ██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║       ║
// ║ ██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║       ║
// ║ ╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║      ║
// ║  ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║       ║
// ║   ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝       ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/**
 * Agent team profiles for the Ultra AI Hermes runtime (R9 / V3-P2.6).
 *
 * Declarative roster for the five named teams. Activation happens via the
 * Hermes api_server profiles and the n8n workflows listed per team.
 * Human-readable reference: brain-stack/agents/teams.md
 */

export type AgentTeamId =
  | 'dot'
  | 'muse'
  | 'grok-bot'
  | 'skilltree'
  | 'anymodelbot';

export interface AgentTeamProfile {
  id: AgentTeamId;
  displayName: string;
  role: string;
  trigger: string;
  deliverable: string;
  engine: 'hermes' | 'openclaw' | 'n8n';
  n8nWorkflow: string;
}

export const AGENT_TEAMS: readonly AgentTeamProfile[] = [
  {
    id: 'dot',
    displayName: 'Dot',
    role: 'Ongoing operations assistant',
    trigger: 'continuous / scheduled',
    deliverable: 'Daily status digest, anomaly flags',
    engine: 'hermes',
    n8nWorkflow: 'dot-daily-review',
  },
  {
    id: 'muse',
    displayName: 'Muse',
    role: 'Personal assistant',
    trigger: 'on-demand chat',
    deliverable: 'Personal task help, notes, reminders',
    engine: 'hermes',
    n8nWorkflow: 'muse-personal-tasks',
  },
  {
    id: 'grok-bot',
    displayName: 'Grok Bot',
    role: 'AI-team coordinator',
    trigger: 'event (PR / issue / model event)',
    deliverable: 'Coordination summaries, routing decisions',
    engine: 'hermes',
    n8nWorkflow: 'grok-bot-team-coord',
  },
  {
    id: 'skilltree',
    displayName: 'SkillTree',
    role: 'Per-department teams',
    trigger: 'scheduled per department',
    deliverable: 'Department skill audits, capability reports',
    engine: 'openclaw',
    n8nWorkflow: 'skilltree-dept-teams',
  },
  {
    id: 'anymodelbot',
    displayName: 'AnyModelBot',
    role: 'Background code review',
    trigger: 'CI hook / schedule',
    deliverable: 'Review findings, model-quality scores',
    engine: 'openclaw',
    n8nWorkflow: 'anymodelbot-code-review',
  },
] as const;

export function getAgentTeam(id: AgentTeamId): AgentTeamProfile | undefined {
  return AGENT_TEAMS.find((team) => team.id === id);
}
