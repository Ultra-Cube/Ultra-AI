import type { ProcessRunner } from './types';

/** Quote a string for POSIX sh using single-quote escaping. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export interface WslRunnerOptions {
  /** WSL distribution name; omitted uses the system default distro. */
  distro?: string;
}

/**
 * Wrap a ProcessRunner so every spawn executes inside WSL2 via `wsl.exe`.
 *
 * `options.cwd` must already be a WSL path (EngineManifest.wslCwd) and
 * `options.env` is forwarded as `env KEY=VAL` prefixes inside the
 * `bash -lc` command, since environment variables do not cross the
 * wsl.exe boundary natively.
 *
 * WSL2 localhost forwarding makes ports bound inside WSL reachable on
 * Windows 127.0.0.1, so existing health probes keep working unchanged.
 */
export function wslRunner(
  base: ProcessRunner,
  opts: WslRunnerOptions = {}
): ProcessRunner {
  return (command, args, options) => {
    const distroArgs = opts.distro ? ['--distribution', opts.distro] : [];
    const cdArgs = options.cwd ? ['--cd', options.cwd] : [];
    const quoted = [command, ...args].map(shellQuote).join(' ');
    const envPart = Object.entries(options.env ?? {})
      .map(([k, v]) => `${k}=${shellQuote(v)}`)
      .join(' ');
    const inner = envPart ? `${envPart} ${quoted}` : quoted;
    return base(
      'wsl.exe',
      [...distroArgs, ...cdArgs, '-e', 'bash', '-lc', inner],
      {}
    );
  };
}
