/**
 * Tool adapters — registry and built-in local tools.
 *
 * `ToolRegistry` maps `ToolAdapter`s to the runtime's `ToolDefinition`/`ToolCall`/
 * `ToolResult` contract. `invokeTool` handlers (e.g. in the reasoner loop) resolve
 * calls through it. Built-in tools are dependency-free and safe for agent use.
 */

import type {
  ToolAdapter,
  ToolCall,
  ToolContext,
  ToolDefinition,
  ToolResult,
} from './contracts';

export class ToolRegistry {
  private readonly tools = new Map<string, ToolAdapter>();

  register(adapter: ToolAdapter): void {
    if (this.tools.has(adapter.definition.name)) {
      throw new Error(`tool already registered: ${adapter.definition.name}`);
    }
    this.tools.set(adapter.definition.name, adapter);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get definitions(): ToolDefinition[] {
    return [...this.tools.values()].map((t) => t.definition);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async invoke(call: ToolCall, ctx: ToolContext): Promise<ToolResult> {
    const adapter = this.tools.get(call.name);
    if (!adapter) {
      return {
        callId: call.id,
        ok: false,
        content: `unknown tool: ${call.name}`,
        isError: true,
      };
    }
    try {
      const result = await adapter.invoke(call.arguments, ctx);
      return { ...result, callId: call.id };
    } catch (err) {
      return {
        callId: call.id,
        ok: false,
        content: err instanceof Error ? err.message : String(err),
        isError: true,
      };
    }
  }
}

/** Adapts a plain async function into a ToolAdapter. */
export function functionTool(
  definition: ToolDefinition,
  fn: (
    args: Record<string, unknown>,
    ctx: ToolContext
  ) => Promise<string> | string
): ToolAdapter {
  return {
    definition,
    async invoke(args, ctx) {
      const content = await fn(args, ctx);
      return { callId: '', ok: true, content };
    },
  };
}

// ---------------------------------------------------------------------------
// Built-in tools
// ---------------------------------------------------------------------------

/** Echo back the provided text — useful for connectivity checks. */
export const echoTool: ToolAdapter = functionTool(
  {
    name: 'echo',
    description:
      'Echo back the input text. Useful for connectivity and format checks.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Text to echo' } },
      required: ['text'],
    },
  },
  (args) => String(args.text ?? '')
);

/** Current UTC timestamp and ISO 8601 time. */
export const datetimeTool: ToolAdapter = functionTool(
  {
    name: 'datetime',
    description: 'Return the current UTC date/time as ISO 8601.',
    parameters: { type: 'object', properties: {} },
  },
  () => new Date().toISOString()
);

/** Evaluate a safe arithmetic expression (+ - * / % ** parentheses, decimals). */
export const calculatorTool: ToolAdapter = functionTool(
  {
    name: 'calculator',
    description: 'Evaluate a basic arithmetic expression (e.g. "2 + 3 * 4").',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Arithmetic expression' },
      },
      required: ['expression'],
    },
  },
  (args) => {
    const expr = String(args.expression ?? '');
    if (!/^[\d\s+\-*/%().]+$/.test(expr)) {
      throw new Error(
        'invalid expression: only digits and + - * / % ( ) allowed'
      );
    }
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expr});`)() as unknown;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('expression did not evaluate to a finite number');
    }
    return String(value);
  }
);

/** All built-in tools, ready to register. */
export const builtinTools: ToolAdapter[] = [
  echoTool,
  datetimeTool,
  calculatorTool,
];
