// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

import { AGENT_TEAMS, getAgentTeam } from '@ultra-ai/hermes-runtime';
import type { FastifyInstance } from 'fastify';

/**
 * Hermes agent-team routes (R5/R9).
 *
 * Exposes the declarative team roster from hermes-runtime (Dot, Muse,
 * Grok Bot, SkillTree, AnyModelBot) so the /hermes dashboard and Open WebUI
 * can render live team state. Runtime liveness is reported separately by the
 * engine supervisor; these endpoints describe configuration, not health.
 */
export async function hermesRoutes(app: FastifyInstance) {
  app.get('/hermes/teams', async () => {
    return { teams: AGENT_TEAMS };
  });

  app.get<{ Params: { id: string } }>(
    '/hermes/teams/:id',
    async (request, reply) => {
      const team = getAgentTeam(request.params.id as never);
      if (!team) {
        return reply.code(404).send({ error: 'unknown team' });
      }
      return { team };
    }
  );
}
