import {
  CliToolAdapter,
  claudeCodeTool,
  hermesAgentTool,
  openClawTool,
  type ProcessRunner,
} from './cli-tools';

const ctx = { sessionId: 's1', agentId: 'a1' };

interface MockResult {
  code: number;
  stdout: string;
  stderr: string;
}

function mockRunner(
  impl: (
    cmd: string,
    args: string[],
    opts: { timeoutMs: number; input?: string }
  ) => MockResult
): {
  runner: ProcessRunner;
  calls: { cmd: string; args: string[]; opts: unknown }[];
} {
  const calls: { cmd: string; args: string[]; opts: unknown }[] = [];
  const runner: ProcessRunner = async (cmd, args, opts) => {
    calls.push({ cmd, args, opts });
    const r = impl(cmd, args, { timeoutMs: opts.timeoutMs, input: opts.input });
    return { ...r, timedOut: false };
  };
  return { runner, calls };
}

describe('CliToolAdapter', () => {
  it('spawns the command with the prompt appended and returns stdout', async () => {
    const { runner, calls } = mockRunner(() => ({
      code: 0,
      stdout: 'agent says hi\n',
      stderr: '',
    }));
    const tool = new CliToolAdapter(
      { name: 't', description: 'd', command: 'mycli', args: ['run'] },
      runner
    );
    const res = await tool.invoke({ prompt: 'do the thing' }, ctx);
    expect(res.ok).toBe(true);
    expect(res.content).toBe('agent says hi');
    expect(calls[0].cmd).toBe('mycli');
    expect(calls[0].args).toEqual(['run', 'do the thing']);
  });

  it('feeds the prompt via stdin when promptMode is stdin', async () => {
    const { runner, calls } = mockRunner(() => ({
      code: 0,
      stdout: 'ok',
      stderr: '',
    }));
    const tool = new CliToolAdapter(
      {
        name: 't',
        description: 'd',
        command: 'mycli',
        args: ['send'],
        promptMode: 'stdin',
      },
      runner
    );
    await tool.invoke({ prompt: 'hello stdin' }, ctx);
    expect((calls[0].opts as { input?: string }).input).toBe('hello stdin');
    expect(calls[0].args).toEqual(['send']);
  });

  it('returns an error result when the prompt is missing', async () => {
    const { runner, calls } = mockRunner(() => ({
      code: 0,
      stdout: '',
      stderr: '',
    }));
    const tool = new CliToolAdapter(
      { name: 't', description: 'd', command: 'x' },
      runner
    );
    const res = await tool.invoke({}, ctx);
    expect(res.ok).toBe(false);
    expect(res.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it('surfaces non-zero exit codes with stderr detail', async () => {
    const { runner } = mockRunner(() => ({
      code: 2,
      stdout: '',
      stderr: 'boom\n',
    }));
    const tool = new CliToolAdapter(
      { name: 't', description: 'd', command: 'x' },
      runner
    );
    const res = await tool.invoke({ prompt: 'p' }, ctx);
    expect(res.ok).toBe(false);
    expect(res.content).toContain('code 2');
    expect(res.content).toContain('boom');
  });

  it('reports timeouts', async () => {
    const runner: ProcessRunner = async () => ({
      code: null,
      stdout: '',
      stderr: '',
      timedOut: true,
    });
    const tool = new CliToolAdapter(
      { name: 't', description: 'd', command: 'x', timeoutMs: 50 },
      runner
    );
    const res = await tool.invoke({ prompt: 'p' }, ctx);
    expect(res.ok).toBe(false);
    expect(res.content).toContain('timed out');
  });

  it('merges extraParameters into the tool schema', () => {
    const tool = new CliToolAdapter({
      name: 't',
      description: 'd',
      command: 'x',
      extraParameters: {
        type: 'object',
        properties: { cwd: { type: 'string' } },
      },
    });
    const props = tool.definition.parameters.properties as Record<
      string,
      unknown
    >;
    expect(props.prompt).toBeDefined();
    expect(props.cwd).toBeDefined();
  });
});

describe('preset factories', () => {
  it('claudeCodeTool defaults to `claude -p` with the prompt as arg', async () => {
    const { runner, calls } = mockRunner(() => ({
      code: 0,
      stdout: 'done',
      stderr: '',
    }));
    const tool = claudeCodeTool({}, runner);
    expect(tool.definition.name).toBe('claude_code');
    await tool.invoke({ prompt: 'fix the bug' }, ctx);
    expect(calls[0].cmd).toBe('claude');
    expect(calls[0].args).toEqual(['-p', 'fix the bug']);
  });

  it('hermesAgentTool defaults to `hermes run`', async () => {
    const { runner, calls } = mockRunner(() => ({
      code: 0,
      stdout: 'ok',
      stderr: '',
    }));
    const tool = hermesAgentTool({}, runner);
    expect(tool.definition.name).toBe('hermes_agent');
    await tool.invoke({ prompt: 'task' }, ctx);
    expect(calls[0].cmd).toBe('hermes');
    expect(calls[0].args).toEqual(['run', 'task']);
  });

  it('openClawTool defaults to stdin prompt mode', async () => {
    const { runner, calls } = mockRunner(() => ({
      code: 0,
      stdout: 'ok',
      stderr: '',
    }));
    const tool = openClawTool({}, runner);
    expect(tool.definition.name).toBe('openclaw');
    await tool.invoke({ prompt: 'ping' }, ctx);
    expect((calls[0].opts as { input?: string }).input).toBe('ping');
  });

  it('factories honor option overrides', () => {
    const tool = claudeCodeTool({ command: '/opt/claude', name: 'cc' });
    expect(tool.definition.name).toBe('cc');
    const opts = (tool as unknown as { opts: { command: string } }).opts;
    expect(opts.command).toBe('/opt/claude');
  });
});
