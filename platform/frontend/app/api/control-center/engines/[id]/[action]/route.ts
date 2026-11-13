import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';

const ACTIONS = new Set(['start', 'stop', 'probe']);

/**
 * Engine lifecycle control proxy —
 * POST /api/control-center/engines/{id}/{action}
 *
 * Forwards to core-api `POST /engines/:id/:action`, which calls the desktop
 * bridge `engines.*` JSON-RPC methods. Sensitive operations: the caller
 * (control-center UI) must require explicit user confirmation first.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const { id, action } = params;

  if (!id || !ACTIONS.has(action)) {
    return NextResponse.json(
      { error: 'invalid engine action' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${API_URL}/engines/${encodeURIComponent(id)}/${action}`,
      {
        method: 'POST',
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
