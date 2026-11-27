// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

import type { EngineStatus } from './types';

/** Sentinel-compatible probe target (see sentinel.mjs checkHttp/checkTcp). */
export interface SentinelTarget {
  name: string;
  type: 'http' | 'tcp';
  url?: string;
  host?: string;
  port?: number;
}

/**
 * P1A-11 — convert live engine statuses into Sentinel `targetFiles` entries.
 * Only running engines with a resolvable port are exported; stopped/failed
 * engines are skipped (their absence is itself not an alert condition —
 * the supervisor UI owns lifecycle state).
 */
export function toSentinelTargets(statuses: EngineStatus[]): SentinelTarget[] {
  const out: SentinelTarget[] = [];
  for (const s of statuses) {
    if (s.state !== 'running' && s.state !== 'degraded') continue;
    const m = s.manifest;
    if (m.probe === 'tcp' || !m.healthPath) {
      out.push({
        name: `engine-${s.id}`,
        type: 'tcp',
        host: '127.0.0.1',
        port: s.port,
      });
    } else {
      const base = s.url ?? `http://127.0.0.1:${s.port}`;
      out.push({
        name: `engine-${s.id}`,
        type: 'http',
        url: `${base}${m.healthPath}`,
      });
    }
  }
  return out;
}
