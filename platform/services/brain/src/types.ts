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
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

export type HermesEmbedMode = 'cli' | 'gateway' | 'openai-compatible';

export interface HermesProviderConfig {
  provider: string;
  model?: string;
  baseUrl?: string;
  apiKeyEnv?: string;
  [key: string]: unknown;
}

/** Shape of ~/.hermes/config.yaml (subset we manage). */
export interface HermesConfigFile {
  provider?: HermesProviderConfig | string;
  model?: string;
  gateway?: { host?: string; port?: number; auth?: string };
  memory?: { backend?: string; path?: string };
  [key: string]: unknown;
}

export interface BrainConfig {
  /** Path to the user's Hermes config file. */
  hermesConfigPath: string;
  /** Platform model gateway base URL — custom providers route here. */
  platformGatewayUrl: string;
  /** Secret env var name holding the platform gateway key. */
  platformGatewayKeyEnv: string;
  /** Embed mode preference order. */
  preferredModes: HermesEmbedMode[];
}

export interface MergedHermesConfig extends HermesConfigFile {
  provider: HermesProviderConfig;
  /** True when the user's custom provider was rewritten to the platform gateway. */
  providerRewritten: boolean;
}

export type BrainProcessState =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'degraded'
  | 'failed';

export interface BrainHealth {
  state: BrainProcessState;
  pid?: number;
  mode?: HermesEmbedMode;
  uptimeMs?: number;
  lastError?: string;
  checkedAt: string;
}
