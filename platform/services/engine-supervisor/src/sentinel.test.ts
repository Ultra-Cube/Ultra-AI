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

import { toSentinelTargets } from './sentinel';
import type { EngineManifest, EngineStatus } from './types';

const base: EngineManifest = {
  id: 'x',
  label: 'X',
  command: 'x',
  port: 9000,
};

function status(
  partial: Partial<EngineStatus> & { manifest?: Partial<EngineManifest> }
): EngineStatus {
  return {
    id: 'x',
    label: 'X',
    state: 'running',
    port: 9000,
    healthOk: true,
    manifest: { ...base, ...partial.manifest },
    ...partial,
  } as EngineStatus;
}

describe('toSentinelTargets', () => {
  it('emits http target using healthPath', () => {
    const t = toSentinelTargets([
      status({ manifest: { healthPath: '/health' }, url: 'http://h:1' }),
    ]);
    expect(t).toEqual([
      { name: 'engine-x', type: 'http', url: 'http://h:1/health' },
    ]);
  });

  it('falls back to port-based url when url missing', () => {
    const t = toSentinelTargets([
      status({ manifest: { healthPath: '/api/health' }, url: undefined }),
    ]);
    expect(t[0].url).toBe('http://127.0.0.1:9000/api/health');
  });

  it('emits tcp target when probe is tcp or no healthPath', () => {
    const a = toSentinelTargets([status({ manifest: { probe: 'tcp' } })]);
    const b = toSentinelTargets([
      status({ manifest: { healthPath: undefined }, port: 7777 }),
    ]);
    expect(a[0]).toMatchObject({ type: 'tcp', port: 9000 });
    expect(b[0]).toMatchObject({ type: 'tcp', port: 7777 });
  });

  it('skips stopped/failed engines', () => {
    const t = toSentinelTargets([
      status({ state: 'stopped' }),
      status({ state: 'failed', id: 'y' }),
      status({ state: 'degraded', id: 'z' }),
    ]);
    expect(t).toHaveLength(1);
    expect(t[0].name).toBe('engine-z');
  });
});
