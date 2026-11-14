import type { ProcessRunner, SpawnedProcess } from './types';
import { shellQuote, wslRunner } from './wsl';

interface Call {
  command: string;
  args: string[];
  options?: { cwd?: string; env?: Record<string, string> };
}

function fakeBase(): { runner: ProcessRunner; calls: Call[] } {
  const calls: Call[] = [];
  const runner: ProcessRunner = (command, args, options) => {
    calls.push({ command, args, options });
    const proc: SpawnedProcess = {
      pid: 1,
      kill: () => true,
      onExit: () => {},
    };
    return proc;
  };
  return { runner, calls };
}

describe('wslRunner', () => {
  it('shell-quotes command and args inside bash -lc', () => {
    const { runner, calls } = fakeBase();
    const wsl = wslRunner(runner);
    wsl('openhands', ['serve', '--port', '3 300'], {});
    expect(calls).toHaveLength(1);
    const c = calls[0];
    expect(c.command).toBe('wsl.exe');
    expect(c.args.slice(-4)).toEqual([
      '-e',
      'bash',
      '-lc',
      `'openhands' 'serve' '--port' '3 300'`,
    ]);
  });

  it('adds distro and --cd flags', () => {
    const { runner, calls } = fakeBase();
    const wsl = wslRunner(runner, { distro: 'Ubuntu-24.04' });
    wsl('langflow', ['run'], { cwd: '/home/user/proj' });
    expect(calls[0].args).toEqual([
      '--distribution',
      'Ubuntu-24.04',
      '--cd',
      '/home/user/proj',
      '-e',
      'bash',
      '-lc',
      `'langflow' 'run'`,
    ]);
  });

  it('forwards env as KEY=VAL prefixes with quoting', () => {
    const { runner, calls } = fakeBase();
    const wsl = wslRunner(runner);
    wsl('x', [], { env: { OLLAMA_HOST: '0.0.0.0:11434', NOTE: "it's" } });
    const inner = calls[0].args[calls[0].args.length - 1];
    expect(inner).toBe(`OLLAMA_HOST='0.0.0.0:11434' NOTE='it'\\''s' 'x'`);
  });

  it('escapes single quotes via shellQuote', () => {
    expect(shellQuote("a'b")).toBe(`'a'\\''b'`);
    expect(shellQuote('plain')).toBe(`'plain'`);
  });
});
