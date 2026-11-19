// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

export interface PortClaim {
  /** Stable id of the claimant (service or engine id). */
  id: string;
  /** TCP port the claimant listens on. */
  port: number;
  /** Human label for diagnostics. */
  label?: string;
  /** Origin of the claim — 'platform' for built-ins, 'engine' for sidecars, 'custom' otherwise. */
  kind?: 'platform' | 'engine' | 'custom';
}

export type ResolveStrategy = 'strict' | 'offset' | 'skip';

export interface ResolveOptions {
  /**
   * strict — return the preferred port or throw PORT_CONFLICT.
   * offset — return preferred+n (n <= maxOffset) for the first free port.
   * skip   — return the first free port >= preferred within `range`.
   */
  strategy?: ResolveStrategy;
  /** Max ports to walk for 'offset'/'skip'. Default 100. */
  maxOffset?: number;
  /** Inclusive search bounds for 'skip'. Default 1024..65535. */
  range?: { start: number; end: number };
}

export type PortRegistryErrorCode =
  | 'PORT_CONFLICT'
  | 'PORT_EXHAUSTED'
  | 'PORT_INVALID';

export class PortRegistryError extends Error {
  constructor(
    public readonly code: PortRegistryErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PortRegistryError';
  }
}

export interface PortConflict {
  port: number;
  claimIds: string[];
}
