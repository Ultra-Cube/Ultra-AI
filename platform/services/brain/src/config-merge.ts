// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub    : github.com/Ultra-Cube                                        ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  chmodSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import yaml from 'js-yaml';

import type {
  BrainConfig,
  HermesConfigFile,
  MergedHermesConfig,
} from './types';

export const DEFAULT_PLATFORM_GATEWAY_URL = 'http://127.0.0.1:20128/v1';

export function defaultHermesConfigPath(): string {
  return join(homedir(), '.hermes', 'config.yaml');
}

export function defaultBrainConfig(
  overrides: Partial<BrainConfig> = {}
): BrainConfig {
  return {
    hermesConfigPath: defaultHermesConfigPath(),
    platformGatewayUrl:
      process.env.ULTRA_MODEL_GATEWAY_URL ?? DEFAULT_PLATFORM_GATEWAY_URL,
    platformGatewayKeyEnv: 'ULTRA_AI_GATEWAY_KEY',
    preferredModes: ['gateway', 'openai-compatible', 'cli'],
    ...overrides,
  };
}

/** Providers that already point at the platform gateway or localhost loopback. */
function isPlatformProvider(p: HermesConfigFile['provider']): boolean {
  if (typeof p === 'string') return p === 'ultra' || p === 'platform';
  if (!p) return false;
  const url = p.baseUrl ?? '';
  return (
    p.provider === 'ultra' ||
    url.includes('127.0.0.1') ||
    url.includes('localhost')
  );
}

/**
 * Merge the user's ~/.hermes/config.yaml with platform settings.
 * A custom (non-platform) provider is rewritten to the platform gateway so all
 * model traffic stays inside Ultra's metering/policy boundary; the original
 * provider name is preserved under `provider.originalProvider`.
 */
export function mergeHermesConfig(
  userConfig: HermesConfigFile,
  brain: BrainConfig
): MergedHermesConfig {
  const merged: HermesConfigFile = { ...userConfig };
  let providerRewritten = false;

  if (!isPlatformProvider(merged.provider)) {
    const original =
      typeof merged.provider === 'string'
        ? { provider: merged.provider }
        : { ...(merged.provider ?? {}) };
    merged.provider = {
      ...original,
      provider: 'openai-compatible',
      baseUrl: brain.platformGatewayUrl,
      apiKeyEnv: brain.platformGatewayKeyEnv,
      originalProvider: original.provider,
    };
    providerRewritten = true;
  }

  // Ensure a stable gateway block exists for embed-mode "gateway".
  merged.gateway = { host: '127.0.0.1', port: 8642, ...(merged.gateway ?? {}) };

  return {
    ...merged,
    provider: merged.provider as MergedHermesConfig['provider'],
    providerRewritten,
  };
}

export function loadHermesConfig(path: string): HermesConfigFile {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, 'utf8');
  const parsed = yaml.load(raw);
  return parsed && typeof parsed === 'object'
    ? (parsed as HermesConfigFile)
    : {};
}

/** Persist merged config back to ~/.hermes/config.yaml with 0600 perms. */
export function saveHermesConfig(path: string, config: HermesConfigFile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, yaml.dump(config), { mode: 0o600 });
  try {
    chmodSync(path, 0o600);
  } catch {
    /* Windows ACLs differ; mode is best-effort */
  }
}

export function resolveBrainConfig(
  userPath?: string,
  overrides: Partial<BrainConfig> = {}
): BrainConfig {
  return defaultBrainConfig({
    hermesConfigPath: userPath ?? defaultHermesConfigPath(),
    ...overrides,
  });
}
