// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { SecretNotFoundError, type SecretProvider } from './types';

export interface VaultOptions {
  /** Ordered providers — first hit wins on `get`. */
  providers: SecretProvider[];
}

/**
 * Multi-provider secrets vault. `get` walks providers in order;
 * `set` writes to the first provider that supports writes;
 * `listKeys` unions all providers for redaction sweeps.
 */
export class SecretsVault {
  private readonly providers: SecretProvider[];

  constructor(opts: VaultOptions) {
    this.providers = opts.providers;
  }

  async get(key: string): Promise<string> {
    for (const p of this.providers) {
      const v = await p.get(key);
      if (v !== null) return v;
    }
    throw new SecretNotFoundError(key);
  }

  async getOrNull(key: string): Promise<string | null> {
    try {
      return await this.get(key);
    } catch (err) {
      if (err instanceof SecretNotFoundError) return null;
      throw err;
    }
  }

  async set(key: string, value: string): Promise<void> {
    const writable = this.providers.find((p) => typeof p.set === 'function');
    if (!writable?.set)
      throw new Error('no writable secret provider configured');
    await writable.set(key, value);
  }

  async delete(key: string): Promise<void> {
    for (const p of this.providers) {
      if (typeof p.delete === 'function') await p.delete(key);
    }
  }

  async listKeys(): Promise<string[]> {
    const keys = new Set<string>();
    for (const p of this.providers) {
      if (typeof p.list === 'function') {
        for (const k of await p.list()) keys.add(k);
      }
    }
    return [...keys].sort();
  }

  /** Convenience: build `KEY=value` env map for child processes. */
  async envFor(keys: string[]): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = await this.getOrNull(k);
      if (v !== null) out[k] = v;
    }
    return out;
  }
}
