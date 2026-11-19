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

export interface SecretProvider {
  /** Unique provider name (e.g. 'env', 'file', 'secret-tool'). */
  readonly name: string;
  /** Read a secret. Returns null when absent — never throws for missing keys. */
  get(key: string): Promise<string | null>;
  /** Persist a secret. Optional — providers without write support omit it. */
  set?(key: string, value: string): Promise<void>;
  /** Remove a secret. Optional. */
  delete?(key: string): Promise<void>;
  /** List known keys. Optional; used for redaction sweeps. */
  list?(): Promise<string[]>;
}

export class SecretNotFoundError extends Error {
  constructor(public readonly key: string) {
    super(`secret '${key}' not found in any provider`);
    this.name = 'SecretNotFoundError';
  }
}

export class SecretProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'SecretProviderError';
  }
}
