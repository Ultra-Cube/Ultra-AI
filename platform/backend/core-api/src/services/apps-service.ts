// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗       ║
// ║ ██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║       ║
// ║ ██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║       ║
// ║ ╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║      ║
// ║  ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║       ║
// ║   ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝       ║
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

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  Ultra AI — Apps Connector Service                                        ║
// ║  Registry + health probe + read-only GET proxy for external apps.        ║
// ║  Ultra Cube Tech — ucubetech.com — github.com/Ultra-Cube/Ultra-AI       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import net from 'node:net';

export interface AppConnector {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'agent' | 'ui' | 'router' | 'model' | 'studio';
  port: number;
  baseUrl: string;
  healthPath?: string;
  docsUrl?: string;
  embedUrl?: string;
  readOnlyPaths: string[];
  writePaths: string[];
  sensitive: boolean;
  upstream?: string;
}

async function tcpProbe(port: number, timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.connect({ host: '127.0.0.1', port, timeout: timeoutMs });
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => resolve(false));
  });
}

async function httpProbe(url: string, timeoutMs = 1500): Promise<{ ok: boolean; status?: number }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return { ok: res.status < 500, status: res.status };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export const APP_CATALOG: AppConnector[] = [
  {
    id: 'n8n', name: 'n8n', description: 'Workflow automation — agents run as background teams',
    category: 'automation', port: 5678, baseUrl: 'http://localhost:5678',
    healthPath: '/healthz', readOnlyPaths: ['/api/v1/workflows', '/api/v1/executions', '/healthz'],
    writePaths: ['/api/v1/workflows', '/api/v1/executions'], sensitive: true,
    upstream: 'https://github.com/n8n-io/n8n',
  },
  {
    id: 'open-webui', name: 'Open WebUI', description: 'Chat UI dashboard (primary Ultra-AI surface)',
    category: 'ui', port: 8080, baseUrl: 'http://localhost:8080',
    healthPath: '/api/health', readOnlyPaths: ['/api/models', '/api/config', '/api/health'],
    writePaths: ['/api/chat/completions', '/api/models'], sensitive: false,
  },
  {
    id: 'hermes', name: 'Hermes Agent', description: 'Nous Research Hermes — primary agent orchestrator',
    category: 'agent', port: 18789, baseUrl: 'http://localhost:18789',
    healthPath: '/health', readOnlyPaths: ['/health', '/v1/models', '/api/status'],
    writePaths: ['/v1/chat/completions', '/api/run'], sensitive: false,
    upstream: 'https://github.com/NousResearch/hermes-agent',
  },
  {
    id: 'openclaw', name: 'OpenClaw', description: 'Backend assistant operated by Hermes — tool & app access',
    category: 'agent', port: 18790, baseUrl: 'http://localhost:18790',
    healthPath: '/health', readOnlyPaths: ['/health', '/v1/status', '/api/status'],
    writePaths: ['/v1/chat/completions', '/api/tools/call'], sensitive: false,
    upstream: 'https://github.com/Ultra-Cube/OpenClaw',
  },
  {
    id: 'omniroute', name: 'OmniRoute', description: 'Model router — multi-provider LLM gateway',
    category: 'router', port: 20128, baseUrl: 'http://localhost:20128',
    healthPath: '/health', readOnlyPaths: ['/health', '/api/providers', '/api/models'],
    writePaths: ['/api/providers', '/api/routing'], sensitive: true,
  },
  {
    id: 'langflow', name: 'Langflow', description: 'Visual AI workflow builder (advanced model steps)',
    category: 'automation', port: 7860, baseUrl: 'http://localhost:7860',
    healthPath: '/health', readOnlyPaths: ['/health', '/api/v1/flows'],
    writePaths: ['/api/v1/flows'], sensitive: true,
  },
  {
    id: 'airllm', name: 'AirLLM', description: 'Large-model inference on consumer hardware',
    category: 'model', port: 8090, baseUrl: 'http://localhost:8090',
    healthPath: '/health', readOnlyPaths: ['/health', '/v1/models'],
    writePaths: ['/v1/chat/completions'], sensitive: false,
  },
  {
    id: 'ollama', name: 'Ollama', description: 'Local model runtime',
    category: 'model', port: 11434, baseUrl: 'http://localhost:11434',
    healthPath: '/api/tags', readOnlyPaths: ['/api/tags', '/api/version'],
    writePaths: ['/api/generate', '/api/chat'], sensitive: false,
  },
  {
    id: 'openhands', name: 'OpenHands', description: 'Autonomous coding agent',
    category: 'agent', port: 3300, baseUrl: 'http://localhost:3300',
    healthPath: '/health', readOnlyPaths: ['/health', '/api/status'],
    writePaths: ['/api/conversations'], sensitive: false,
    upstream: 'https://github.com/All-Hands-AI/OpenHands',
  },
  {
    id: 'ultra-studio', name: 'Ultra Studio', description: 'Studio surface — component & flow authoring',
    category: 'studio', port: 8443, baseUrl: 'http://localhost:8443',
    healthPath: '/health', readOnlyPaths: ['/health', '/api/projects'],
    writePaths: ['/api/projects'], sensitive: false,
  },
];

export interface AppStatus extends AppConnector {
  online: boolean;
  statusCode?: number;
  latencyMs?: number;
  checkedAt: string;
}

export async function listApps(withProbe = true): Promise<AppStatus[]> {
  return Promise.all(APP_CATALOG.map(async (app) => {
    if (!withProbe) return { ...app, online: false, checkedAt: new Date().toISOString() };
    const started = Date.now();
    const up = await tcpProbe(app.port);
    let statusCode: number | undefined;
    if (up && app.healthPath) {
      const res = await httpProbe(`${app.baseUrl}${app.healthPath}`);
      statusCode = res.status;
    }
    return {
      ...app, online: up, statusCode, latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
    };
  }));
}

const SENSITIVE_PREFIXES = ['/api/v1/workflows', '/api/v1/executions', '/api/providers', '/api/routing', '/api/chat/completions', '/api/generate', '/api/chat', '/v1/chat/completions', '/api/tools/call', '/api/conversations', '/api/run', '/api/projects'];

export function isReadOnlyProxy(app: AppConnector, pathname: string): boolean {
  if (SENSITIVE_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return app.readOnlyPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function proxyGet(app: AppConnector, pathname: string): Promise<{ status: number; body: unknown; contentType?: string }> {
  const url = `${app.baseUrl}${pathname}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'manual' });
    const ct = res.headers.get('content-type') || 'application/json';
    const text = await res.text();
    let body: unknown = text;
    if (ct.includes('json')) { try { body = JSON.parse(text); } catch { /* keep text */ } }
    return { status: res.status, body, contentType: ct };
  } finally {
    clearTimeout(timer);
  }
}
