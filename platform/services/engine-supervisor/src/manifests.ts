import type { EngineManifest } from './types';

/**
 * Engine manifests for the embedded sidecar stack.
 * Ports mirror docs/v2/technical-spec.md; OpenHands is remapped off :3000
 * (web app) to :3300 to avoid collisions.
 */
export const ENGINE_PRESETS: EngineManifest[] = [
  {
    id: 'ollama',
    label: 'Ollama',
    command: 'ollama',
    args: ['serve'],
    port: 11434,
    portEnvVar: 'OLLAMA_HOST',
    healthPath: '/api/tags',
    probe: 'http',
    startupTimeoutMs: 15000,
    licenseNote: 'MIT',
  },
  {
    id: '9router',
    label: '9router / OmniRoute',
    command: 'omniroute',
    args: ['serve'],
    port: 20128,
    portEnvVar: 'OMNIROUTE_PORT',
    healthPath: '/health',
    probe: 'http',
    startupTimeoutMs: 20000,
    licenseNote: 'MIT',
  },
  {
    id: 'openclaw',
    label: 'OpenClaw',
    command: 'openclaw',
    args: ['gateway'],
    port: 18789,
    portEnvVar: 'OPENCLAW_PORT',
    healthPath: '/health',
    probe: 'http',
    startupTimeoutMs: 15000,
  },
  {
    id: 'openhands',
    label: 'OpenHands (agentic coding workspace)',
    command: 'openhands',
    args: ['serve'],
    port: 3300,
    portEnvVar: 'OPENHANDS_PORT',
    healthPath: '/health',
    probe: 'http',
    startupTimeoutMs: 60000,
    licenseNote: 'MIT core; exclude enterprise/ directory',
  },
  {
    id: 'langflow',
    label: 'Langflow',
    command: 'langflow',
    args: ['run', '--host', '127.0.0.1'],
    port: 7860,
    portEnvVar: 'LANGFLOW_PORT',
    healthPath: '/health',
    probe: 'http',
    startupTimeoutMs: 45000,
  },
  {
    id: 'openvscode-server',
    label: 'Ultra Studio (Code-OSS web IDE, Open VSX)',
    command: 'openvscode-server',
    args: ['--host', '127.0.0.1', '--port', '8443'],
    port: 8443,
    portEnvVar: 'ULTRA_STUDIO_PORT',
    healthPath: '/',
    probe: 'http',
    startupTimeoutMs: 60000,
    licenseNote:
      'MIT (Code-OSS); clean product.json, extensions via Open VSX only',
  },
  {
    id: 'dify',
    label: 'Dify',
    command: 'docker',
    args: [
      'compose',
      '-f',
      'control/config/docker/docker-compose.yml',
      'up',
      '-d',
      'dify-api',
    ],
    port: 5001,
    portEnvVar: 'DIFY_PORT',
    healthPath: '/health',
    probe: 'http',
    startupTimeoutMs: 90000,
    managed: false,
  },
  {
    id: 'n8n',
    label: 'n8n',
    command: 'docker',
    args: [
      'compose',
      '-f',
      'control/config/docker/docker-compose.yml',
      'up',
      '-d',
      'n8n',
    ],
    port: 5678,
    portEnvVar: 'N8N_PORT',
    healthPath: '/healthz',
    probe: 'http',
    startupTimeoutMs: 90000,
    managed: false,
  },
];

export function presetById(id: string): EngineManifest | undefined {
  return ENGINE_PRESETS.find((m) => m.id === id);
}
