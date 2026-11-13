import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';

/**
 * Live engine/sidecar state for the control center.
 *
 * Proxies core-api `GET /engines`, which in turn calls the desktop bridge's
 * `engines.list` JSON-RPC method (EngineSupervisor). When the bridge or API is
 * offline the response degrades to `connected:false` so the UI can show a
 * distinct "offline" state instead of an empty list.
 */
export async function GET(request: Request) {
  const probe = new URL(request.url).searchParams.get('probe') === '1';
  const path = probe ? '/engines/probe-all' : '/engines';

  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { connected: false, bridge: 'offline', engines: [], statuses: [] },
        { status: 200 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      connected: false,
      bridge: 'offline',
      engines: [],
      statuses: [],
    });
  }
}
