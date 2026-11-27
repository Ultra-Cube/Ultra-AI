// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗     ███████╗ ██████╗   █████╗            █████╗  ██╗       ║
// ║ ██║   ██║ ██║    ╚══██╔══╝ ██╔══██╗ ██╔══██╗          ██╔══██╗ ██║       ║
// ║ ██║   ██║ ██║       ██║    ██████╔╝ ███████║          ███████║ ██║       ║
// ║ ╚██╗   ██╔╝██║       ██║    ██╔══██║ ██╔══██║          ██╔══██║ ██║      ║
// ║  ╚████╔╝  ███████╗  ██║    ██║  ██║ ██║  ██║          ██║  ██║ ██║       ║
// ║   ╚═══╝   ╚══════╝  ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝          ╚═╝  ╚═╝ ╚═╝       ║
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

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  Ultra AI — Directory-Control-Systems (DCS) bridge service                ║
// ║  Wraps control/directory-control-systems/main.js (Node CLI, JSON out)     ║
// ║  Ultra Cube Tech — ucubetech.com — github.com/Ultra-Cube/Ultra-AI       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DCS_DIR = path.resolve(__dirname, '../../../../../control/directory-control-systems');
const DCS_ENTRY = path.join(DCS_DIR, 'main.js');

function parseDcsJson(stdout: string): unknown {
  const start = stdout.indexOf('{');
  if (start === -1) throw new Error('DCS produced no JSON output');
  return JSON.parse(stdout.slice(start));
}

const ALLOWED_DOMAINS = new Set(['distribution', 'environment', 'infrastructure', 'platform']);
const READ_ONLY_COMMANDS: Record<string, Set<string>> = {
  distribution: new Set(['status', 'health']),
  environment: new Set(['status', 'validate', 'health']),
  infrastructure: new Set(['status', 'health']),
  platform: new Set(['status', 'health']),
};
const MUTATING_COMMANDS: Record<string, Set<string>> = {
  distribution: new Set(['build', 'package']),
  environment: new Set(['switch', 'sync', 'backup']),
  infrastructure: new Set(['automation', 'kubernetes', 'terraform', 'testing']),
  platform: new Set(['start', 'stop', 'build']),
};

export interface DcsRunResult {
  ok: boolean;
  domain: string;
  command?: string;
  args: string[];
  output?: unknown;
  error?: string;
  durationMs: number;
}

export function isDcsDomain(domain: string): boolean {
  return ALLOWED_DOMAINS.has(domain);
}

export function dcsActionType(domain: string, command: string): 'read' | 'write' | null {
  if (READ_ONLY_COMMANDS[domain]?.has(command)) return 'read';
  if (MUTATING_COMMANDS[domain]?.has(command)) return 'write';
  return null;
}

async function runDcs(domain: string, command?: string, args: string[] = []): Promise<unknown> {
  const argv = command ? [DCS_ENTRY, domain, command, ...args] : [DCS_ENTRY, domain, 'status'];
  const { stdout } = await execFileAsync('node', argv, {
    cwd: DCS_DIR,
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return parseDcsJson(stdout) as Record<string, unknown>;
}

export async function dcsStatus(): Promise<Record<string, unknown>> {
  return (await runDcs('directory')) as Record<string, unknown>;
}

export async function dcsSystemCheck(): Promise<Record<string, unknown>> {
  return (await runDcs('system', 'check')) as Record<string, unknown>;
}

export async function dcsDomainStatus(domain: string): Promise<Record<string, unknown>> {
  return (await runDcs(domain)) as Record<string, unknown>;
}

export async function dcsExecute(
  domain: string,
  command: string,
  args: string[] = []
): Promise<DcsRunResult> {
  const started = Date.now();
  const argv = command ? [DCS_ENTRY, domain, command, ...args] : [DCS_ENTRY, domain, 'status'];
  try {
    const { stdout } = await execFileAsync('node', argv, {
      cwd: DCS_DIR,
      timeout: 120_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    return { ok: true, domain, command, args, output: parseDcsJson(stdout), durationMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      domain,
      command,
      args,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    };
  }
}
