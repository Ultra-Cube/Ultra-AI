// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import type { ManagedAgent } from '@/renderer/utils/model/agentTypes';

export type AgentAvailabilityFilter = 'all' | 'available' | 'unavailable';

const isAgentAvailable = (agent: ManagedAgent): boolean => agent.status === 'online';

export const getAgentAvailabilityFilterStats = (agents: ManagedAgent[]) => ({
  all: agents.length,
  available: agents.filter(isAgentAvailable).length,
  unavailable: agents.filter((agent) => !isAgentAvailable(agent)).length,
});

export const filterAgentsByAvailability = (agents: ManagedAgent[], filter: AgentAvailabilityFilter): ManagedAgent[] => {
  if (filter === 'available') {
    return agents.filter(isAgentAvailable);
  }
  if (filter === 'unavailable') {
    return agents.filter((agent) => !isAgentAvailable(agent));
  }
  return agents;
};
