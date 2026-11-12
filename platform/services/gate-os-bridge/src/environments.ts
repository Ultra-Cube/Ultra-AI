import type { EnvironmentId, EnvironmentPreset, UiSpec } from './types';

/**
 * First-draft environment presets from docs/v2/technical-spec.md §13.
 * Resource budgets are UNVERIFIED — confirm with Gate-OS maintainers.
 */
export const ENVIRONMENT_PRESETS: Record<EnvironmentId, EnvironmentPreset> = {
  everyday: {
    id: 'everyday',
    label: 'Everyday',
    aiProfile: 'assistant, search, simple automation',
    enginesOn: ['hermes', 'ollama-small', 'open-webui'],
    resourceNote: 'low',
  },
  gaming: {
    id: 'gaming',
    label: 'Gaming',
    aiProfile: 'minimal footprint, voice commands, overlays',
    enginesOn: ['hermes-idle'],
    resourceNote: 'lowest',
  },
  dev: {
    id: 'dev',
    label: 'Dev',
    aiProfile: 'OpenHands, code models, Langflow',
    enginesOn: ['hermes', 'openhands', 'langflow'],
    resourceNote: 'high',
  },
  design: {
    id: 'design',
    label: 'Design',
    aiProfile: 'asset search, prompt tools, render queue',
    enginesOn: ['hermes', 'ollama-vision', 'n8n'],
    resourceNote: 'high',
  },
  media: {
    id: 'media',
    label: 'Media',
    aiProfile: 'transcription, tagging, summarization',
    enginesOn: ['hermes', 'ollama-audio', 'flows'],
    resourceNote: 'medium-high',
  },
  security: {
    id: 'security',
    label: 'Security',
    aiProfile: 'isolated, offline-first, audit-heavy',
    enginesOn: ['hermes-local'],
    resourceNote: 'isolated',
  },
  business: {
    id: 'business',
    label: 'Business',
    aiProfile: 'dashboards, mail/calendar digests, reports',
    enginesOn: ['hermes', 'langflow', 'dify', 'connectors'],
    resourceNote: 'medium',
  },
};

export const ENVIRONMENT_IDS = Object.keys(
  ENVIRONMENT_PRESETS
) as EnvironmentId[];

const UI_PANELS: Record<EnvironmentId, UiSpec['panels']> = {
  everyday: [
    { id: 'assistant', kind: 'assistant' },
    { id: 'search', kind: 'search' },
    { id: 'automation', kind: 'automation' },
  ],
  gaming: [
    { id: 'assistant', kind: 'assistant', visible: false },
    { id: 'monitor', kind: 'monitor' },
  ],
  dev: [
    { id: 'assistant', kind: 'assistant' },
    { id: 'editor', kind: 'editor' },
    { id: 'dashboard', kind: 'dashboard' },
  ],
  design: [
    { id: 'assistant', kind: 'assistant' },
    { id: 'editor', kind: 'editor' },
    { id: 'media', kind: 'media' },
  ],
  media: [
    { id: 'assistant', kind: 'assistant' },
    { id: 'media', kind: 'media' },
    { id: 'dashboard', kind: 'dashboard' },
  ],
  security: [
    { id: 'assistant', kind: 'assistant' },
    { id: 'security', kind: 'security' },
    { id: 'monitor', kind: 'monitor' },
  ],
  business: [
    { id: 'assistant', kind: 'assistant' },
    { id: 'dashboard', kind: 'dashboard' },
    { id: 'automation', kind: 'automation' },
  ],
};

export function buildUiSpec(env: EnvironmentId): UiSpec {
  const preset = ENVIRONMENT_PRESETS[env];
  const assistantEnabled = env !== 'gaming';
  return {
    env,
    specVersion: '1.0.0-draft',
    panels: UI_PANELS[env],
    assistant: {
      enabled: assistantEnabled,
      mode: assistantEnabled ? 'inline' : 'overlay',
    },
    resourceHints: { resourceNote: preset.resourceNote },
  };
}
