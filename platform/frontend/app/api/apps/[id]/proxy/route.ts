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

import { NextRequest, NextResponse } from "next/server";

import { getApp } from "../../catalog";

/**
 * Whitelisted read-only proxy into external app APIs.
 *
 * - Only GET requests are forwarded.
 * - The target host must be the app's own baseUrl host (SSRF guard).
 * - The path must start with the app's apiBase when one is declared.
 * - Apps flagged requiresConfirm get a 409 unless the caller passes
 *   ?confirm=1 — an explicit operator acknowledgement.
 * - Request bodies and credentials are never forwarded.
 */

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = getApp(id);
  if (!app) {
    return NextResponse.json({ error: "unknown app" }, { status: 404 });
  }
  if (!app.apiBase) {
    return NextResponse.json(
      { error: `${app.name} exposes no proxied API surface` },
      { status: 400 }
    );
  }
  if (app.requiresConfirm && req.nextUrl.searchParams.get("confirm") !== "1") {
    return NextResponse.json(
      {
        error: `${app.name} requires explicit confirmation for API access`,
        requiresConfirm: true,
      },
      { status: 409 }
    );
  }

  const base = new URL(app.baseUrl);
  const rel = req.nextUrl.searchParams.get("path") ?? "";
  const clean = rel.replace(/^\/+/, "");
  const apiBase = app.apiBase.replace(/\/+$/, "").replace(/^\/+/, "");
  if (apiBase && clean !== apiBase && !clean.startsWith(apiBase + "/")) {
    return NextResponse.json(
      { error: `path must be under ${app.apiBase}` },
      { status: 400 }
    );
  }
  const target = new URL(`${base.origin}/${clean}`);
  if (target.host !== base.host || target.protocol !== base.protocol) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const upstream = await fetch(target, {
      method: "GET",
      signal: ctrl.signal,
      redirect: "manual",
      headers: { accept: "application/json" },
    });
    const body = await upstream.text();
    const headers = new Headers();
    upstream.headers.forEach((v, k) => {
      if (!HOP_BY_HOP.has(k.toLowerCase())) headers.set(k, v);
    });
    headers.set("x-ultra-app", app.id);
    headers.set("x-ultra-proxy", "read-only");
    return new NextResponse(body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `upstream unreachable: ${(err as Error).message}` },
      { status: 502 }
    );
  } finally {
    clearTimeout(t);
  }
}
