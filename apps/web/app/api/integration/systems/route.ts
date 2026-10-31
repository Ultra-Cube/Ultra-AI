import { NextResponse } from 'next/server';

/**
 * Integration systems route.
 *
 * Status is derived by probing the mock-adapters service
 * (services/mock-adapters, default http://localhost:4100) rather than being
 * hardcoded. When an adapter can't be reached the system is reported as
 * 'offline' so the catalog stays honest instead of claiming 'imported'.
 */

const MOCK_ADAPTERS_URL =
  process.env.MOCK_ADAPTERS_URL || 'http://localhost:4100';

type SystemStatus =
  | 'running'
  | 'stopped'
  | 'configured'
  | 'imported'
  | 'degraded'
  | 'offline';

interface SystemDefinition {
  id: string;
  name: string;
  type: string;
  port?: number;
  dependencies: string[];
}

// Catalog of sub-projects. Status is resolved dynamically at request time.
const systemCatalog: SystemDefinition[] = [
  { id: '9router', name: '9router', type: 'gateway', port: 20128, dependencies: [] },
  { id: 'openclaw', name: 'OpenClaw', type: 'assistant', dependencies: ['9router'] },
  { id: 'jarvis', name: 'JARVIS', type: 'intelligence', dependencies: ['9router'] },
  { id: 'webui', name: 'WebUI Desktop', type: 'desktop', dependencies: ['9router'] },
  { id: 'quant-mind', name: 'QuantMind', type: 'financial', dependencies: ['9router'] },
  { id: 'kimi-k2.5', name: 'Kimi K2.5', type: 'multimodal', dependencies: ['9router'] },
  { id: 'biome', name: 'Biome', type: 'world-model', dependencies: ['9router'] },
  { id: 'godmode', name: 'GodMode Animation', type: 'animation', dependencies: ['9router'] },
];

async function probeStatus(systemId: string): Promise<SystemStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(
      `${MOCK_ADAPTERS_URL}/adapters/${encodeURIComponent(systemId)}/health`,
      { signal: controller.signal, cache: 'no-store' }
    );
    if (!res.ok) {
      return 'offline';
    }
    const body = (await res.json()) as { status?: string; healthy?: boolean };
    if (body.status === 'degraded' || body.healthy === false) {
      return 'degraded';
    }
    return 'running';
  } catch {
    return 'offline';
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const systems = await Promise.all(
    systemCatalog.map(async (def) => ({
      ...def,
      status: await probeStatus(def.id),
    }))
  );

  const countBy = (status: SystemStatus) =>
    systems.filter((s) => s.status === status).length;

  return NextResponse.json({
    systems,
    health: {
      total: systems.length,
      running: countBy('running'),
      degraded: countBy('degraded'),
      offline: countBy('offline'),
      configured: countBy('configured'),
      imported: countBy('imported'),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, systemId } = body;

  // Placeholder - would call actual integration service
  return NextResponse.json({
    message: `${action} ${systemId} ready for integration`,
    action,
    systemId,
  });
}
