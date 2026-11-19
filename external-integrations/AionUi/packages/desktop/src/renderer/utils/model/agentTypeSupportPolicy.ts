// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

const DEPRECATED_RUNTIME_AGENT_TYPES = new Set(['openclaw-gateway', 'nanobot', 'remote', 'gemini']);

export function isDeprecatedRuntimeAgentType(agentType?: string | null): boolean {
  return Boolean(agentType && DEPRECATED_RUNTIME_AGENT_TYPES.has(agentType));
}

export function resolveSupportedConversationType(backend?: string | null): 'acp' | 'aionrs' {
  return backend === 'aionrs' ? 'aionrs' : 'acp';
}
