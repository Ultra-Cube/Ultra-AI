import type { PortClaim, PortConflict, ResolveOptions } from './types';
import { PortRegistryError } from './types';

/**
 * Canonical platform port map (P1A-09). Engine ports mirror the
 * ENGINE_PRESETS manifests in @ultra-ai/engine-supervisor; the registry
 * exists so supervisors/proxies can detect and resolve collisions
 * before binding.
 */
export const PLATFORM_PORTS: PortClaim[] = [
  { id: 'frontend', port: 3000, label: 'Next.js web UI', kind: 'platform' },
  { id: 'core-api', port: 4000, label: 'Ultra core API', kind: 'platform' },
  {
    id: 'desktop-bridge',
    port: 4001,
    label: 'Desktop JSON-RPC bridge',
    kind: 'platform',
  },
  { id: 'openhands', port: 3300, label: 'OpenHands workspace', kind: 'engine' },
  { id: 'ollama', port: 11434, label: 'Ollama local models', kind: 'engine' },
  { id: 'n8n', port: 5678, label: 'n8n automation', kind: 'engine' },
  {
    id: 'open-webui',
    port: 8080,
    label: 'Open WebUI chat surface',
    kind: 'engine',
  },
  {
    id: 'airllm',
    port: 8090,
    label: 'airllm low-VRAM inference',
    kind: 'engine',
  },
  { id: 'langflow', port: 7860, label: 'Langflow flows', kind: 'engine' },
  {
    id: 'ultra-studio',
    port: 8443,
    label: 'Ultra Studio (openvscode-server)',
    kind: 'engine',
  },
  {
    id: 'omniroute',
    port: 20128,
    label: '9router/OmniRoute gateway',
    kind: 'engine',
  },
  { id: 'openclaw', port: 18789, label: 'OpenClaw agent', kind: 'engine' },
];

const MAX_PORT = 65535;
const MIN_PORT = 1024;

function validPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= MAX_PORT;
}

export class PortRegistry {
  private readonly claims = new Map<string, PortClaim>();

  constructor(claims: PortClaim[] = []) {
    for (const c of claims) this.claim(c);
  }

  /** Registry pre-loaded with the canonical platform port map. */
  static platform(): PortRegistry {
    return new PortRegistry(PLATFORM_PORTS);
  }

  /** Register or update a claim. Same id re-claim replaces the port. */
  claim(c: PortClaim): void {
    if (!c.id)
      throw new PortRegistryError('PORT_INVALID', 'claim id is required');
    if (!validPort(c.port)) {
      throw new PortRegistryError(
        'PORT_INVALID',
        `invalid port ${c.port} for '${c.id}'`,
        { port: c.port }
      );
    }
    this.claims.set(c.id, { ...c, kind: c.kind ?? 'custom' });
  }

  release(id: string): boolean {
    return this.claims.delete(id);
  }

  get(id: string): PortClaim | undefined {
    return this.claims.get(id);
  }

  /** True when no other claim holds `port`. */
  isFree(port: number, exceptId?: string): boolean {
    for (const c of this.claims.values()) {
      if (c.port === port && c.id !== exceptId) return false;
    }
    return true;
  }

  /** All claims sharing a port with at least one other claim. */
  conflicts(): PortConflict[] {
    const byPort = new Map<number, string[]>();
    for (const c of this.claims.values()) {
      const list = byPort.get(c.port) ?? [];
      list.push(c.id);
      byPort.set(c.port, list);
    }
    return [...byPort.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([port, claimIds]) => ({ port, claimIds: claimIds.sort() }))
      .sort((a, b) => a.port - b.port);
  }

  /**
   * Resolve a free port for `preferred`. `id` optionally names the claimant
   * so re-resolving its own current port is not treated as a conflict.
   */
  resolve(preferred: number, opts: ResolveOptions = {}, id?: string): number {
    if (!validPort(preferred)) {
      throw new PortRegistryError(
        'PORT_INVALID',
        `invalid preferred port ${preferred}`,
        { port: preferred }
      );
    }
    const strategy = opts.strategy ?? 'strict';
    const maxOffset = opts.maxOffset ?? 100;
    const range = opts.range ?? { start: MIN_PORT, end: MAX_PORT };

    if (this.isFree(preferred, id)) return preferred;
    if (strategy === 'strict') {
      const holder = this.holderOf(preferred);
      throw new PortRegistryError(
        'PORT_CONFLICT',
        `port ${preferred} already claimed by '${holder}'`,
        {
          port: preferred,
          holder,
        }
      );
    }

    const limit = Math.min(preferred + maxOffset, MAX_PORT);
    for (let p = preferred + 1; p <= limit; p++) {
      if (p >= range.start && p <= range.end && this.isFree(p, id)) return p;
    }
    throw new PortRegistryError(
      'PORT_EXHAUSTED',
      `no free port within ${maxOffset} of ${preferred}`,
      { preferred, maxOffset }
    );
  }

  /** Snapshot of all claims sorted by port. */
  snapshot(): PortClaim[] {
    return [...this.claims.values()].sort((a, b) => a.port - b.port);
  }

  private holderOf(port: number): string | undefined {
    for (const c of this.claims.values()) if (c.port === port) return c.id;
    return undefined;
  }
}
