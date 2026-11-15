import { NextRequest, NextResponse } from 'next/server';

const HERMES_API = process.env.HERMES_API_URL || 'http://127.0.0.1:8642';
const HERMES_KEY = process.env.HERMES_API_KEY || '';

async function proxy(req: NextRequest, path: string[]) {
  const target = `${HERMES_API}/${path.join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (HERMES_KEY) headers['authorization'] = `Bearer ${HERMES_KEY}`;
  const upstream = req.method === 'GET' || req.method === 'HEAD'
    ? await fetch(target, { headers, cache: 'no-store' })
    : await fetch(target, { method: req.method, headers, body: await req.text() });
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try { return await proxy(req, params.path); }
  catch { return NextResponse.json({ error: 'hermes-api unreachable' }, { status: 502 }); }
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  try { return await proxy(req, params.path); }
  catch { return NextResponse.json({ error: 'hermes-api unreachable' }, { status: 502 }); }
}
