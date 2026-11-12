import { ENVIRONMENT_IDS } from './environments';
import type { EnvironmentId, IntentRequest, IntentResponse } from './types';

const ENVIRONMENT_KEYWORDS: [EnvironmentId, string[]][] = [
  [
    'dev',
    [
      'code',
      'debug',
      'deploy',
      'test',
      'repo',
      'compile',
      'commit',
      'api',
      'refactor',
    ],
  ],
  [
    'design',
    [
      'design',
      'logo',
      'ui',
      'ux',
      'mockup',
      'render',
      'asset',
      'figma',
      'color',
    ],
  ],
  [
    'media',
    [
      'video',
      'audio',
      'transcribe',
      'podcast',
      'music',
      'subtitle',
      'thumbnail',
    ],
  ],
  [
    'security',
    [
      'security',
      'audit',
      'vulnerability',
      'pentest',
      'incident',
      'offline',
      'firewall',
    ],
  ],
  [
    'business',
    [
      'email',
      'calendar',
      'report',
      'invoice',
      'dashboard',
      'meeting',
      'crm',
      'sales',
    ],
  ],
  ['gaming', ['game', 'gaming', 'overlay', 'fps', 'voice command', 'stream']],
];

const FALLBACK_ENV: EnvironmentId = 'everyday';

function isEnvironmentId(v: unknown): v is EnvironmentId {
  return typeof v === 'string' && (ENVIRONMENT_IDS as string[]).includes(v);
}

/**
 * Deterministic keyword intent router (readiness phase).
 * TODO(S4): route through HermesRuntime ReAct reasoner once a real
 * provider adapter is configured; keep this as offline fallback.
 */
export function classifyIntent(req: IntentRequest): IntentResponse {
  const text = req.text.toLowerCase();
  const scores = new Map<EnvironmentId, number>();

  for (const [env, keywords] of ENVIRONMENT_KEYWORDS) {
    const hits = keywords.filter((k) => text.includes(k)).length;
    if (hits > 0) scores.set(env, hits);
  }

  let suggested: EnvironmentId = isEnvironmentId(req.env)
    ? req.env
    : FALLBACK_ENV;
  let best = 0;
  for (const [env, score] of scores) {
    if (score > best) {
      best = score;
      suggested = env;
    }
  }

  const confidence = best === 0 ? 0.3 : Math.min(0.5 + best * 0.15, 0.95);
  const intent = best === 0 ? 'general.assistant' : `${suggested}.assist`;

  return {
    intent,
    confidence,
    suggestedEnvironment: suggested,
    actions: [
      {
        type: 'switch_environment',
        label: `Switch to ${suggested}`,
        payload: { env: suggested },
      },
      {
        type: 'show_ui_spec',
        label: `Show ${suggested} UI`,
        payload: { env: suggested },
      },
      {
        type: 'open_assistant',
        label: 'Open assistant',
        payload: { env: suggested },
      },
    ],
  };
}
