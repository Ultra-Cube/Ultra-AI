// Copyright (c) Ultra Cube Tech — All rights reserved  [UCUBETECH]

import { NextResponse } from "next/server";

import { APPS, type AppDef } from "./catalog";

async function probe(app: AppDef) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 2000);
  const started = Date.now();
  try {
    const res = await fetch(`${app.baseUrl}${app.healthPath}`, {
      signal: ctrl.signal,
      cache: "no-store",
      redirect: "manual",
    });
    return {
      id: app.id, name: app.name, category: app.category,
      baseUrl: app.baseUrl,
      embedUrl: app.embedPath ? `${app.baseUrl}${app.embedPath}` : null,
      apiBase: app.apiBase ?? null,
      requiresConfirm: app.requiresConfirm,
      description: app.description,
      status: res.ok || res.status === 401 || res.status === 403 ? "online" : "degraded",
      httpStatus: res.status,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      id: app.id, name: app.name, category: app.category,
      baseUrl: app.baseUrl,
      embedUrl: app.embedPath ? `${app.baseUrl}${app.embedPath}` : null,
      apiBase: app.apiBase ?? null,
      requiresConfirm: app.requiresConfirm,
      description: app.description,
      status: "offline", httpStatus: null, latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const apps = await Promise.all(APPS.map(probe));
  return NextResponse.json({ apps });
}
