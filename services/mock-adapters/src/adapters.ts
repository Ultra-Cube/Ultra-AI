/**
 * Mock adapter definitions for the imported Ultra-AI sub-projects.
 *
 * Each adapter emulates a real microservice: it keeps a start time so uptime
 * grows over the process lifetime, counts probe requests, and rotates through a
 * small set of operational states so the platform sees honest, moving data
 * instead of a hardcoded 'imported' label.
 */

export interface AdapterDefinition {
  id: string;
  name: string;
  type:
    | 'gateway'
    | 'assistant'
    | 'intelligence'
    | 'desktop'
    | 'financial'
    | 'multimodal'
    | 'world-model'
    | 'animation';
  description: string;
}

export const ADAPTER_DEFINITIONS: AdapterDefinition[] = [
  {
    id: '9router',
    name: '9router',
    type: 'gateway',
    description: 'Model routing gateway that fans requests out to downstream AI systems',
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    type: 'assistant',
    description: 'General-purpose coding and automation assistant',
  },
  {
    id: 'jarvis',
    name: 'JARVIS',
    type: 'intelligence',
    description: 'Ambient intelligence and orchestration agent',
  },
  {
    id: 'webui',
    name: 'WebUI Desktop',
    type: 'desktop',
    description: 'Desktop web interface shell for the platform',
  },
  {
    id: 'quant-mind',
    name: 'QuantMind',
    type: 'financial',
    description: 'Quantitative finance modelling and signal engine',
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    type: 'multimodal',
    description: 'Multimodal reasoning model for text, image and audio',
  },
  {
    id: 'biome',
    name: 'Biome',
    type: 'world-model',
    description: 'World-model simulation and environment reasoning engine',
  },
  {
    id: 'godmode',
    name: 'GodMode Animation',
    type: 'animation',
    description: 'Generative animation and motion synthesis service',
  },
];

export type RuntimeStatus = 'running' | 'degraded' | 'busy';

/** Rotating operational states — mostly healthy, occasionally busy/degraded. */
const STATUS_CYCLE: RuntimeStatus[] = [
  'running',
  'running',
  'busy',
  'running',
  'degraded',
  'running',
];

interface AdapterRuntime {
  startedAt: number;
  requests: number;
}

const runtimes = new Map<string, AdapterRuntime>();

export function getAdapter(id: string): AdapterDefinition | undefined {
  return ADAPTER_DEFINITIONS.find((a) => a.id === id);
}

function runtimeFor(id: string): AdapterRuntime {
  let rt = runtimes.get(id);
  if (!rt) {
    rt = { startedAt: Date.now(), requests: 0 };
    runtimes.set(id, rt);
  }
  return rt;
}

export interface HealthResponse {
  id: string;
  name: string;
  type: string;
  status: RuntimeStatus;
  healthy: boolean;
  uptimeSeconds: number;
  timestamp: string;
}

export interface StatusResponse extends HealthResponse {
  description: string;
  metrics: {
    requests: number;
    requestsPerMinute: number;
    activeConnections: number;
    memoryMb: number;
    cpuPercent: number;
    latencyMs: number;
  };
  version: string;
}

/** Deterministic-ish rotating status based on uptime so it visibly changes. */
function currentStatus(uptimeSeconds: number): RuntimeStatus {
  const bucket = Math.floor(uptimeSeconds / 10);
  return STATUS_CYCLE[bucket % STATUS_CYCLE.length];
}

export function buildHealth(def: AdapterDefinition): HealthResponse {
  const rt = runtimeFor(def.id);
  rt.requests += 1;
  const uptimeSeconds = Math.floor((Date.now() - rt.startedAt) / 1000);
  const status = currentStatus(uptimeSeconds);
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    status,
    healthy: status !== 'degraded',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
  };
}

export function buildStatus(def: AdapterDefinition): StatusResponse {
  const health = buildHealth(def);
  const rt = runtimeFor(def.id);
  const uptimeMinutes = Math.max(health.uptimeSeconds / 60, 1 / 60);
  return {
    ...health,
    description: def.description,
    metrics: {
      requests: rt.requests,
      requestsPerMinute: Math.round(rt.requests / uptimeMinutes),
      activeConnections: 1 + Math.floor(Math.random() * 25),
      memoryMb: 64 + Math.floor(Math.random() * 448),
      cpuPercent: Math.round(Math.random() * 100),
      latencyMs: 5 + Math.floor(Math.random() * 120),
    },
    version: '0.1.0',
  };
}
