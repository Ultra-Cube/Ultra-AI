// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
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

type Ctx = { params: { id: string } };

/** GET /api/workspace/{id} — single session status. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const res = await fetch(
      `${API_URL}/workspace/sessions/${encodeURIComponent(params.id)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { connected: false, bridge: 'offline', error: 'core-api unreachable' },
      { status: 503 }
    );
  }
}

/** DELETE /api/workspace/{id} — close a session (destructive; UI confirms). */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const res = await fetch(
      `${API_URL}/workspace/sessions/${encodeURIComponent(params.id)}`,
      {
        method: 'DELETE',
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { connected: false, bridge: 'offline', error: 'core-api unreachable' },
      { status: 503 }
    );
  }
}
