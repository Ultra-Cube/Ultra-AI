/**
 * CLI agent tool adapters — expose local CLI agents (Claude Code, Hermes Agent,
 * OpenClaw, or any command) as `ToolAdapter`s the runtime can invoke.
 *
 * `CliToolAdapter` spawns a configured command, feeds the tool arguments as a
 * prompt, captures stdout, and enforces a timeout. The process runner is
 * injectable so tests never spawn real processes.
 */

import { spawn } from 'node:child_process';

import type {
  ToolAdapter,
  ToolContext,
  ToolDefinition,
  ToolResult,
} from './contracts';

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export type ProcessRunner = (
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeoutMs: number;
    signal?: AbortSignal;
    input?: string;
  }
) => Promise<ProcessResult>;

export interface CliToolOptions {
  /** Tool name exposed to the agent loop. */
  name: string;
  description: string;
  /** Executable to spawn (e.g. 'claude', 'hermes', 'openclaw'). */
  command: string;
  /** Static argv prefix; the prompt is appended by default. */
  args?: string[];
  /** How the prompt reaches the CLI: appended as final arg or via stdin. */
  promptMode?: 'arg' | 'stdin';
  /** Argument name the model uses for the prompt (default 'prompt'). */
  promptArg?: string;
  cwd?: string;
  env?: Record<string, string>;
  /** Extra argv appended after the prompt. */
  extraArgs?: string[];
  timeoutMs?: number;
  /** Optional JSON Schema for additional tool parameters merged into args. */
  extraParameters?: Record<string, unknown>;
}

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_BUFFER = 1024 * 1024; // 1 MiB per stream

/** Default runner using node:child_process.spawn — no external deps. */
export const spawnRunner: ProcessRunner = (command, args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const finish = (result: ProcessResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
      resolve(result);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, options.timeoutMs);

    const onAbort = () => {
      child.kill('SIGKILL');
      finish({ code: null, stdout, stderr, timedOut: true });
    };

    if (options.signal) {
      if (options.signal.aborted) {
        child.kill('SIGKILL');
        finish({ code: null, stdout, stderr, timedOut: true });
        return;
      }
      options.signal.addEventListener('abort', onAbort, { once: true });
    }

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length < MAX_BUFFER) stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < MAX_BUFFER) stderr += chunk.toString('utf8');
    });
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
      reject(err);
    });
    child.on('close', (code) => {
      finish({ code, stdout, stderr, timedOut });
    });

    if (options.input !== undefined) {
      child.stdin.write(options.input);
    }
    child.stdin.end();
  });

export class CliToolAdapter implements ToolAdapter {
  readonly definition: ToolDefinition;
  private readonly opts: CliToolOptions;
  private readonly runner: ProcessRunner;

  constructor(opts: CliToolOptions, runner: ProcessRunner = spawnRunner) {
    this.opts = opts;
    this.runner = runner;
    const promptArg = opts.promptArg ?? 'prompt';
    this.definition = {
      name: opts.name,
      description: opts.description,
      parameters: {
        type: 'object',
        properties: {
          [promptArg]: {
            type: 'string',
            description: 'The task or question for the CLI agent',
          },
          ...(opts.extraParameters?.properties as
            | Record<string, unknown>
            | undefined),
        },
        required: [promptArg],
      },
    };
  }

  async invoke(
    args: Record<string, unknown>,
    ctx: ToolContext
  ): Promise<ToolResult> {
    const promptArg = this.opts.promptArg ?? 'prompt';
    const prompt = String(args[promptArg] ?? '');
    if (!prompt) {
      return {
        callId: '',
        ok: false,
        content: `missing required argument: ${promptArg}`,
        isError: true,
      };
    }

    const stdinMode = this.opts.promptMode === 'stdin';
    const argv = [
      ...(this.opts.args ?? []),
      ...(stdinMode ? [] : [prompt]),
      ...(this.opts.extraArgs ?? []),
    ];
    const options = {
      cwd: this.opts.cwd,
      env: this.opts.env,
      timeoutMs: this.opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      signal: ctx.signal,
      input: stdinMode ? prompt : undefined,
    };

    const result = await this.runner(this.opts.command, argv, options);
    if (result.timedOut) {
      return {
        callId: '',
        ok: false,
        content: `cli agent timed out after ${options.timeoutMs}ms`,
        isError: true,
      };
    }
    if (result.code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim();
      return {
        callId: '',
        ok: false,
        content: `cli agent exited with code ${result.code}: ${detail}`,
        isError: true,
      };
    }
    const content = result.stdout.trim() || result.stderr.trim();
    return { callId: '', ok: true, content };
  }
}

// ---------------------------------------------------------------------------
// Preset factories for known CLI agents
// ---------------------------------------------------------------------------

/**
 * Claude Code headless mode (`claude -p`). Requires the `claude` CLI installed
 * and authenticated; args/env can be tuned per deployment.
 */
export function claudeCodeTool(
  opts: Partial<CliToolOptions> = {},
  runner?: ProcessRunner
): ToolAdapter {
  return new CliToolAdapter(
    {
      name: opts.name ?? 'claude_code',
      description:
        opts.description ??
        'Delegate a coding task to Claude Code (headless `claude -p`). Returns the agent output.',
      command: opts.command ?? 'claude',
      args: opts.args ?? ['-p'],
      promptMode: opts.promptMode ?? 'arg',
      timeoutMs: opts.timeoutMs ?? 300_000,
      ...opts,
    },
    runner
  );
}

/**
 * Hermes Agent CLI. The upstream CLI surface is still stabilizing — pass the
 * exact argv via `args` once pinned (see technical-spec §4, P1A-01 spike).
 */
export function hermesAgentTool(
  opts: Partial<CliToolOptions> = {},
  runner?: ProcessRunner
): ToolAdapter {
  return new CliToolAdapter(
    {
      name: opts.name ?? 'hermes_agent',
      description:
        opts.description ??
        'Delegate a task to the Hermes Agent CLI. Configure args for the pinned version.',
      command: opts.command ?? 'hermes',
      args: opts.args ?? ['run'],
      promptMode: opts.promptMode ?? 'arg',
      timeoutMs: opts.timeoutMs ?? 300_000,
      ...opts,
    },
    runner
  );
}

/**
 * OpenClaw sidecar/CLI (default gateway port 18789). For HTTP access prefer a
 * dedicated adapter once the upstream API is pinned; this factory covers the
 * CLI/stdio surface.
 */
export function openClawTool(
  opts: Partial<CliToolOptions> = {},
  runner?: ProcessRunner
): ToolAdapter {
  return new CliToolAdapter(
    {
      name: opts.name ?? 'openclaw',
      description:
        opts.description ??
        'Send a message/task to the OpenClaw assistant via its CLI. Configure args for the pinned version.',
      command: opts.command ?? 'openclaw',
      args: opts.args ?? ['message', 'send'],
      promptMode: opts.promptMode ?? 'stdin',
      timeoutMs: opts.timeoutMs ?? 120_000,
      ...opts,
    },
    runner
  );
}
