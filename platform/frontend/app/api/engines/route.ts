import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Engine catalog + live health probes.
 *
 * Mirrors ENGINE_PRESETS in platform/services/engine-supervisor/src/manifests.ts
 * and extends it with the platform services (n8n, OmniRoute, Hermes, Grafana,
 * OpenRouter gateway, Obsidian vault, airllm). Each entry is probed over HTTP so
 * the UI can show real up/down state without requiring the desktop bridge.
 */

type EngineProbe = {
  id: string;
  label: string;
  category:
    | 'llm'
    | 'agent'
    | 'automation'
    | 'chat'
    | 'ide'
    | 'data'
    | 'observability'
    | 'memory';
  url: string;
  port: number;
  healthPath: string;
  embed: boolean;
  description: string;
};

const ENGINES: EngineProbe[] = [
  {
    id: 'ollama',
    label: 'Ollama',
    category: 'llm',
    url: 'http://127.0.0.1:11434',
    port: 11434,
    healthPath: '/api/tags',
    embed: false,
    description: 'Local LLM runtime',
  },
  {
    id: 'omniroute',
    label: 'OmniRoute / 9router',
    category: 'llm',
    url: 'http://127.0.0.1:20128',
    port: 20128,
    healthPath: '/health',
    embed: true,
    description: 'Unified AI router — 160+ providers, OpenAI-compatible API',
  },
  {
    id: 'model-gateway',
    label: 'Ultra Model Gateway',
    category: 'llm',
    url: 'http://127.0.0.1:20129',
    port: 20129,
    healthPath: '/health',
    embed: false,
    description: 'Internal provider routing, fallback, metering',
  },
  {
    id: 'hermes-api',
    label: 'Hermes Agent API',
    category: 'agent',
    url: 'http://127.0.0.1:8642',
    port: 8642,
    healthPath: '/health',
    embed: false,
    description: 'Cognitive core — OpenAI-compatible /v1 + /v1/runs',
  },
  {
    id: 'hermes-dashboard',
    label: 'Hermes Dashboard',
    category: 'agent',
    url: 'http://127.0.0.1:9119',
    port: 9119,
    healthPath: '/',
    embed: true,
    description: 'Hermes operations dashboard',
  },
  {
    id: 'openhands',
    label: 'OpenHands',
    category: 'agent',
    url: 'http://127.0.0.1:3300',
    port: 3300,
    healthPath: '/health',
    embed: false,
    description: 'Agentic coding workspace',
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    category: 'agent',
    url: 'http://127.0.0.1:18789',
    port: 18789,
    healthPath: '/health',
    embed: false,
    description: 'Agent gateway',
  },
  {
    id: 'n8n',
    label: 'n8n Automation',
    category: 'automation',
    url: 'http://127.0.0.1:5678',
    port: 5678,
    healthPath: '/healthz',
    embed: true,
    description: 'Workflow automation engine',
  },
  {
    id: 'langflow',
    label: 'Langflow',
    category: 'automation',
    url: 'http://127.0.0.1:7860',
    port: 7860,
    healthPath: '/health',
    embed: false,
    description: 'Visual LLM workflow builder',
  },
  {
    id: 'dify',
    label: 'Dify',
    category: 'automation',
    url: 'http://127.0.0.1:5001',
    port: 5001,
    healthPath: '/health',
    embed: false,
    description: 'LLM app development platform',
  },
  {
    id: 'openvscode',
    label: 'Ultra Studio (Code-OSS)',
    category: 'ide',
    url: 'http://127.0.0.1:8443',
    port: 8443,
    healthPath: '/',
    embed: true,
    description: 'Embedded VS Code-compatible IDE (Open VSX)',
  },
  {
    id: 'grafana',
    label: 'Grafana',
    category: 'observability',
    url: 'http://127.0.0.1:3001',
    port: 3001,
    healthPath: '/api/health',
    embed: true,
    description: 'Metrics & dashboards',
  },
  {
    id: 'prometheus',
    label: 'Prometheus',
    category: 'observability',
    url: 'http://127.0.0.1:9090',
    port: 9090,
    healthPath: '/-/healthy',
    embed: true,
    description: 'Metrics collection',
  },
  {
    id: 'airllm',
    label: 'airllm',
    category: 'llm',
    url: 'http://127.0.0.1:8090',
    port: 8090,
    healthPath: '/health',
    embed: false,
    description: 'Low-VRAM LLM inference (Python)',
  },
  {
    id: 'open-webui',
    label: 'Open WebUI',
    category: 'chat',
    url: 'http://127.0.0.1:8080',
    port: 8080,
    healthPath: '/',
    embed: true,
    description: 'Primary chat surface (open-source UI, BSD-3)',
  },
  {
    id: 'obsidian',
    label: 'Obsidian Vault',
    category: 'memory',
    url: 'http://127.0.0.1:27123',
    port: 27123,
    healthPath: '/',
    embed: false,
    description: 'Knowledge base via Local REST API plugin',
  },
];

async function probe(e: EngineProbe) {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${e.url}${e.healthPath}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(t);
    const up = res.status === 200 || res.status === 302 || res.status === 401;
    return {
      ...e,
      up,
      httpStatus: res.status,
      latencyMs: Date.now() - started,
    };
  } catch {
    return { ...e, up: false, httpStatus: null, latencyMs: null };
  }
}

export async function GET() {
  const engines = await Promise.all(ENGINES.map(probe));
  const categories = [...new Set(engines.map((e) => e.category))];
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    engines,
    categories,
    summary: {
      total: engines.length,
      up: engines.filter((e) => e.up).length,
      down: engines.filter((e) => !e.up).length,
    },
  });
}
