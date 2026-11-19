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

import { SecretProviderError } from './types';

/** Reads secrets from process.env (read-only). */
export class EnvProvider {
  readonly name = 'env';
  private readonly prefix: string;

  constructor(prefix = '') {
    this.prefix = prefix;
  }

  async get(key: string): Promise<string | null> {
    const envKey = `${this.prefix}${key}`;
    const value = process.env[envKey];
    return value === undefined ? null : value;
  }

  async list(): Promise<string[]> {
    return Object.keys(process.env)
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.slice(this.prefix.length))
      .filter((k) => k.length > 0)
      .sort();
  }
}

/** Reads/writes a flat `KEY=value` file (mode 0600 expected on POSIX). */
export class FileProvider {
  readonly name = 'file';
  constructor(private readonly path: string) {}

  async get(key: string): Promise<string | null> {
    const { readFile } = await import('node:fs/promises');
    let raw: string;
    try {
      raw = await readFile(this.path, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw new SecretProviderError(
        this.name,
        `read failed: ${(err as Error).message}`
      );
    }
    for (const line of raw.split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0 && line.slice(0, eq) === key) return line.slice(eq + 1);
    }
    return null;
  }

  async set(key: string, value: string): Promise<void> {
    const { readFile, writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(this.path), { recursive: true });
    let raw = '';
    try {
      raw = await readFile(this.path, 'utf8');
    } catch {
      // missing file — create fresh
    }
    const lines = raw.split('\n').filter((l) => {
      const eq = l.indexOf('=');
      return !(eq > 0 && l.slice(0, eq) === key);
    });
    lines.push(`${key}=${value}`);
    await writeFile(
      this.path,
      lines.filter((l) => l !== '').join('\n') + '\n',
      {
        mode: 0o600,
      }
    );
  }

  async delete(key: string): Promise<void> {
    const { readFile, writeFile } = await import('node:fs/promises');
    let raw: string;
    try {
      raw = await readFile(this.path, 'utf8');
    } catch {
      return;
    }
    const lines = raw
      .split('\n')
      .filter((l) => {
        const eq = l.indexOf('=');
        return !(eq > 0 && l.slice(0, eq) === key);
      })
      .filter((l) => l !== '');
    await writeFile(this.path, lines.length ? lines.join('\n') + '\n' : '', {
      mode: 0o600,
    });
  }

  async list(): Promise<string[]> {
    const { readFile } = await import('node:fs/promises');
    let raw: string;
    try {
      raw = await readFile(this.path, 'utf8');
    } catch {
      return [];
    }
    return raw
      .split('\n')
      .map((l) => {
        const eq = l.indexOf('=');
        return eq > 0 ? l.slice(0, eq) : null;
      })
      .filter((k): k is string => k !== null && k.length > 0)
      .sort();
  }
}
