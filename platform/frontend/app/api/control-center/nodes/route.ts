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

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ServiceDef = { id: string; label: string; url: string };

const SERVICES: ServiceDef[] = [
  {
    id: 'core-api',
    label: 'Core API',
    url: process.env.CORE_API_URL ?? 'http://127.0.0.1:4000/health',
  },
  {
    id: 'desktop-bridge',
    label: 'Desktop Bridge',
    url: process.env.DESKTOP_BRIDGE_HEALTH_URL ?? 'http://127.0.0.1:4000/zeroai/edge/status',
  },
  {
    id: 'zeroai-edge',
    label: 'ZeroAI Edge',
    url: process.env.ZEROAI_EDGE_URL ?? 'http://127.0.0.1:4100/health',
  },
  {
    id: 'web',
    label: 'Web UI',
    url:
      process.env.WEB_SELF_URL ??
      'http://127.0.0.1:3000/api/control-center/health',
  },
];

async function probe(
  url: string
): Promise<{ status: 'up' | 'down'; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    return { status: res.ok ? 'up' : 'down', latencyMs: Date.now() - start };
  } catch {
    return { status: 'down', latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const nodes = await Promise.all(
    SERVICES.map(async (s) => ({ ...s, ...(await probe(s.url)) }))
  );
  return NextResponse.json({ nodes });
}
