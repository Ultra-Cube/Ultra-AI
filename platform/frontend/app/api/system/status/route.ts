import os from 'os';

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Unified system-status endpoint for the web control surface.
 *
 * Replaces the earlier hard-coded placeholders: it probes every layer of the
 * Ultra-AI stack (API, Gateway, Web, and the Hermes/Grafana monitoring stack)
 * and reports real host metrics so the dashboard health strip reflects what is
 * actually running on the machine.
 */

const API_URL = process.env.API_URL || 'http://127.0.0.1:4000';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:20129';
const WEB_URL = process.env.WEB_URL || 'http://127.0.0.1:3000';
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://127.0.0.1:3001';
const N8N_URL = process.env.N8N_URL || 'http://127.0.0.1:5678';
const OMNIROUTE_URL = process.env.OMNIROUTE_URL || 'http://127.0.0.1:20128';
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://127.0.0.1:9090';
const HERMES_DASH_URL = process.env.HERMES_DASH_URL || 'http://127.0.0.1:9119';
const HERMES_API_URL = process.env.HERMES_API_URL || 'http://127.0.0.1:8642';

type ServiceStatus = {
  id: string;
  name: string;
  url: string;
  port: number;
  up: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
};

async function probe(
  id: string,
  name: string,
  url: string,
  port: number,
  path: string
): Promise<ServiceStatus> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${url}${path}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    // 200/302/401 all indicate the service is listening and responding.
    const up = res.status === 200 || res.status === 302 || res.status === 401;
    return {
      id,
      name,
      url,
      port,
      up,
      httpStatus: res.status,
      latencyMs: Date.now() - started,
    };
  } catch {
    return {
      id,
      name,
      url,
      port,
      up: false,
      httpStatus: null,
      latencyMs: null,
    };
  }
}

function hostStats() {
  const cpus = os.cpus();
  // 1-minute load average normalised to CPU count -> rough CPU utilisation %.
  const load1 = os.loadavg()[0] ?? 0;
  const cpu = cpus.length ? Math.min(100, (load1 / cpus.length) * 100) : 0;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memory = totalMem ? ((totalMem - freeMem) / totalMem) * 100 : 0;

  return {
    cpu: Number(cpu.toFixed(1)),
    memory: Number(memory.toFixed(1)),
    cores: cpus.length,
    uptime: Math.floor(os.uptime()),
    loadavg: os.loadavg().map((n) => Number(n.toFixed(2))),
    hostname: os.hostname(),
  };
}

export async function GET() {
  const services = await Promise.all([
    probe('api', 'API', API_URL, 4000, '/health'),
    probe('gateway', 'Gateway', GATEWAY_URL, 20129, '/health'),
    probe('web', 'Web', WEB_URL, 3000, '/'),
    probe('grafana', 'Grafana (Hermes)', GRAFANA_URL, 3001, '/api/health'),
    probe('prometheus', 'Prometheus', PROMETHEUS_URL, 9090, '/-/healthy'),
    probe('n8n', 'n8n Automation', N8N_URL, 5678, '/healthz'),
    probe('omniroute', 'OmniRoute', OMNIROUTE_URL, 20128, '/health'),
    probe('hermes-dash', 'Hermes Dashboard', HERMES_DASH_URL, 9119, '/'),
    probe('hermes-api', 'Hermes API', HERMES_API_URL, 8642, '/health'),
  ]);

  const upCount = services.filter((s) => s.up).length;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    host: hostStats(),
    services,
    summary: {
      total: services.length,
      up: upCount,
      down: services.length - upCount,
      healthy: upCount === services.length,
    },
  });
}
