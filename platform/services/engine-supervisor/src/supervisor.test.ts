import { EngineSupervisor } from './supervisor';
import type { EngineManifest, SpawnedProcess } from './types';

class FakeProc implements SpawnedProcess {
  pid = 4321;
  exitCb?: (code: number | null, signal: string | null) => void;
  killed: string[] = [];
  onExit(cb: (code: number | null, signal: string | null) => void): void {
    this.exitCb = cb;
  }
  kill(signal?: string): boolean {
    this.killed.push(signal ?? 'SIGTERM');
    return true;
  }
  emitExit(code: number | null, signal: string | null = null): void {
    this.exitCb?.(code, signal);
  }
}

const manifest = (over: Partial<EngineManifest> = {}): EngineManifest => ({
  id: 'test',
  label: 'Test',
  command: 'fakebin',
  port: 9999,
  healthPath: '/health',
  startupTimeoutMs: 3000,
  shutdownTimeoutMs: 500,
  ...over,
});

function makeSupervisor(opts: { fetchOk?: boolean; procs?: FakeProc[] }): {
  sup: EngineSupervisor;
  procs: FakeProc[];
} {
  const procs = opts.procs ?? [new FakeProc()];
  let i = 0;
  const fetchImpl = jest.fn().mockResolvedValue({
    ok: opts.fetchOk ?? true,
    status: 200,
  });
  const sup = new EngineSupervisor([manifest()], {
    runner: () => procs[Math.min(i++, procs.length - 1)],
    fetchImpl,
    healthIntervalMs: 60000,
  });
  return { sup, procs };
}

describe('EngineSupervisor', () => {
  it('starts an engine and reports running after health probe', async () => {
    const { sup, procs } = makeSupervisor({ fetchOk: true });
    const st = await sup.start('test');
    expect(st.state).toBe('running');
    expect(st.healthOk).toBe(true);
    expect(st.pid).toBe(4321);
    expect(procs[0].killed).toEqual([]);
  });

  it('fails start when health never becomes ok', async () => {
    const proc = new FakeProc();
    const { sup } = makeSupervisor({ fetchOk: false, procs: [proc] });
    // shrink startup timeout
    (sup as unknown as { engines: Map<string, EngineManifest> }).engines.set(
      'test',
      manifest({ startupTimeoutMs: 1200 })
    );
    const st = await sup.start('test');
    expect(st.state).toBe('failed');
    expect(proc.killed).toContain('SIGKILL');
  }, 10000);

  it('fails fast when required env is missing', async () => {
    const { sup } = makeSupervisor({});
    (sup as unknown as { engines: Map<string, EngineManifest> }).engines.set(
      'test',
      manifest({ requiredEnv: ['DEFINITELY_MISSING_VAR_XYZ'] })
    );
    const st = await sup.start('test');
    expect(st.state).toBe('failed');
    expect(st.lastError).toContain('DEFINITELY_MISSING_VAR_XYZ');
  });

  it('refuses to start non-managed manifests', async () => {
    const { sup } = makeSupervisor({});
    (sup as unknown as { engines: Map<string, EngineManifest> }).engines.set(
      'test',
      manifest({ managed: false })
    );
    const st = await sup.start('test');
    expect(st.state).toBe('stopped');
    expect(st.lastError).toContain('not supervisor-managed');
  });

  it('stops gracefully then SIGKILLs on timeout', async () => {
    const proc = new FakeProc(); // never emits exit
    const { sup } = makeSupervisor({ fetchOk: true, procs: [proc] });
    await sup.start('test');
    const st = await sup.stop('test');
    expect(st.state).toBe('stopped');
    expect(proc.killed).toEqual(['SIGTERM', 'SIGKILL']);
  });

  it('marks engine failed when process exits nonzero', async () => {
    const proc = new FakeProc();
    const { sup } = makeSupervisor({ fetchOk: true, procs: [proc] });
    await sup.start('test');
    proc.emitExit(1);
    const st = sup.status('test')!;
    expect(st.state).toBe('failed');
    expect(st.lastError).toContain('exit code 1');
  });

  it('probe degrades a running engine when health fails', async () => {
    const { sup } = makeSupervisor({ fetchOk: true });
    await sup.start('test');
    // flip fetch to failing
    const fetchMock = (sup as unknown as { fetchImpl: jest.Mock }).fetchImpl;
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const st = await sup.probe('test');
    expect(st.state).toBe('degraded');
    expect(st.healthOk).toBe(false);
  });

  it('probeAll reports every registered engine', async () => {
    const { sup } = makeSupervisor({ fetchOk: true });
    const all = await sup.probeAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('test');
  });
});
