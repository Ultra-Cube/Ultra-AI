/**
 * Reasoning subsystem — pluggable mind for the agent loop.
 *
 * The default `ReActReasoner` implements a minimal thought→action→observation
 * loop on top of a ProviderAdapter. Heavier engines (tree-of-thought, planner
 * critics) implement the same interface.
 */

import type {
  EngineAdapter,
  EngineDeps,
  EngineRunRequest,
  EngineRunResult,
  EngineStep,
  ToolCall,
} from '../adapters/contracts';
import type { HermesMessage } from '../types';

export interface Reasoner {
  readonly id: string;
  run(req: EngineRunRequest, deps: EngineDeps): Promise<EngineRunResult>;
}

function extractToolCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const re = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(m[1]) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      if (parsed.name) {
        calls.push({
          id: `call-${calls.length}`,
          name: parsed.name,
          arguments: parsed.arguments ?? {},
        });
      }
    } catch {
      // malformed tool call JSON — treat as plain text
    }
  }
  return calls;
}

/** Minimal ReAct-style loop: think → optional tool call → observe → repeat. */
export class ReActReasoner implements Reasoner {
  readonly id = 'react';

  async run(req: EngineRunRequest, deps: EngineDeps): Promise<EngineRunResult> {
    const steps: EngineStep[] = [];
    const messages: HermesMessage[] = [
      {
        role: 'system',
        content:
          'You are an autonomous agent. To call a tool, emit <tool_call>{"name":"...","arguments":{...}}</tool_call>. ' +
          'When done, reply with the final answer only.',
        timestamp: Date.now(),
      },
      ...req.context,
      { role: 'user', content: req.goal, timestamp: Date.now() },
    ];

    let toolCallsMade = 0;
    let lastContent = '';

    for (let i = 0; i < req.maxSteps; i++) {
      if (req.signal?.aborted) throw new Error('reasoning aborted');

      const res = await deps.provider.generate({
        model: 'default',
        messages,
        tools: req.tools,
        signal: req.signal,
      });
      lastContent = res.content;
      steps.push({ kind: 'thought', content: res.content });
      deps.onStep?.(steps[steps.length - 1]);

      const calls = extractToolCalls(res.content);
      if (calls.length === 0) break;

      for (const call of calls) {
        steps.push({
          kind: 'action',
          content: `${call.name}(${JSON.stringify(call.arguments)})`,
        });
        deps.onStep?.(steps[steps.length - 1]);
        const result = await deps.invokeTool(call);
        toolCallsMade++;
        steps.push({ kind: 'observation', content: result.content });
        deps.onStep?.(steps[steps.length - 1]);
        messages.push({
          role: 'tool',
          content: result.content,
          toolCallId: call.id,
          timestamp: Date.now(),
        });
      }
    }

    steps.push({ kind: 'answer', content: lastContent });
    return {
      answer: lastContent,
      steps,
      toolCallsMade,
      iterationsUsed: steps.filter((s) => s.kind === 'thought').length,
    };
  }
}

/** Adapts a Reasoner to the EngineAdapter contract. */
export class ReasonerEngineAdapter implements EngineAdapter {
  readonly id: string;
  constructor(private reasoner: Reasoner) {
    this.id = `engine-${reasoner.id}`;
  }
  run(req: EngineRunRequest, deps: EngineDeps) {
    return this.reasoner.run(req, deps);
  }
}
