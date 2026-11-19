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

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';

/**
 * Embedded workspace surface (P2-06) — proxies core-api `/workspace/*`,
 * which calls the desktop bridge `workspace.*` JSON-RPC methods backed by
 * the OpenHands sidecar client.
 *
 * GET  → health + session list (degrades to connected:false when offline)
 * POST → open a session; body: { workspacePath, title?, initialTask?, agent? }
 */
export async function GET() {
  try {
    const [healthRes, sessionsRes] = await Promise.all([
      fetch(`${API_URL}/workspace/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${API_URL}/workspace/sessions`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }),
    ]);
    const health = healthRes.ok
      ? await healthRes.json()
      : { connected: false, bridge: 'offline', health: { reachable: false } };
    const sessions = sessionsRes.ok
      ? await sessionsRes.json()
      : { connected: false, bridge: 'offline', sessions: [] };
    return NextResponse.json({
      connected: health.connected === true && sessions.connected === true,
      bridge: health.bridge ?? 'offline',
      health: health.health ?? { reachable: false },
      sessions: sessions.sessions ?? [],
    });
  } catch {
    return NextResponse.json({
      connected: false,
      bridge: 'offline',
      health: { reachable: false },
      sessions: [],
    });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/workspace/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { connected: false, bridge: 'offline', error: 'core-api unreachable' },
      { status: 503 }
    );
  }
}
