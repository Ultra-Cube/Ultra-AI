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

import { PortRegistry, PortRegistryError, PLATFORM_PORTS } from './index';

describe('PortRegistry', () => {
  it('platform defaults have no conflicts', () => {
    const reg = PortRegistry.platform();
    expect(reg.conflicts()).toEqual([]);
    expect(reg.snapshot()).toHaveLength(PLATFORM_PORTS.length);
  });

  it('detects port conflicts', () => {
    const reg = new PortRegistry([
      { id: 'a', port: 8080 },
      { id: 'b', port: 8080 },
      { id: 'c', port: 9090 },
    ]);
    expect(reg.conflicts()).toEqual([{ port: 8080, claimIds: ['a', 'b'] }]);
  });

  it('strict resolve returns preferred when free', () => {
    const reg = PortRegistry.platform();
    expect(reg.resolve(4000, {}, 'core-api')).toBe(4000);
    expect(reg.resolve(9999)).toBe(9999);
  });

  it('strict resolve throws PORT_CONFLICT when taken', () => {
    const reg = PortRegistry.platform();
    expect(() => reg.resolve(11434)).toThrow(PortRegistryError);
    try {
      reg.resolve(11434);
    } catch (e) {
      expect((e as PortRegistryError).code).toBe('PORT_CONFLICT');
      expect((e as PortRegistryError).details?.holder).toBe('ollama');
    }
  });

  it('resolve ignores the claimant own port', () => {
    const reg = PortRegistry.platform();
    expect(reg.resolve(11434, {}, 'ollama')).toBe(11434);
  });

  it('offset strategy finds next free port', () => {
    const reg = new PortRegistry([
      { id: 'a', port: 5000 },
      { id: 'b', port: 5001 },
      { id: 'c', port: 5003 },
    ]);
    expect(reg.resolve(5000, { strategy: 'offset' })).toBe(5002);
  });

  it('offset exhausts and throws PORT_EXHAUSTED', () => {
    const reg = new PortRegistry([{ id: 'a', port: 5000 }]);
    // fill 5000..5010
    for (let p = 5001; p <= 5010; p++) reg.claim({ id: `x${p}`, port: p });
    expect(() =>
      reg.resolve(5000, { strategy: 'offset', maxOffset: 5 })
    ).toThrow(PortRegistryError);
    try {
      reg.resolve(5000, { strategy: 'offset', maxOffset: 5 });
    } catch (e) {
      expect((e as PortRegistryError).code).toBe('PORT_EXHAUSTED');
    }
  });

  it('skip strategy scans upward within range', () => {
    const reg = new PortRegistry([
      { id: 'a', port: 6000 },
      { id: 'b', port: 6001 },
    ]);
    expect(
      reg.resolve(6000, { strategy: 'skip', range: { start: 6000, end: 6010 } })
    ).toBe(6002);
  });

  it('rejects invalid ports', () => {
    const reg = new PortRegistry();
    expect(() => reg.resolve(0)).toThrow(PortRegistryError);
    expect(() => reg.resolve(70000)).toThrow(PortRegistryError);
    expect(() => reg.claim({ id: 'bad', port: -1 })).toThrow(PortRegistryError);
  });

  it('re-claim with same id replaces port', () => {
    const reg = new PortRegistry([{ id: 'svc', port: 8000 }]);
    reg.claim({ id: 'svc', port: 8001 });
    expect(reg.get('svc')?.port).toBe(8001);
    expect(reg.conflicts()).toEqual([]);
  });

  it('release removes a claim', () => {
    const reg = new PortRegistry([{ id: 'svc', port: 8000 }]);
    expect(reg.release('svc')).toBe(true);
    expect(reg.resolve(8000)).toBe(8000);
  });
});
