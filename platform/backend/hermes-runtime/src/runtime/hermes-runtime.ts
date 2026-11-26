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

/**
 * HermesRuntime — the agent runtime entry point.
 *
 * Composes: sessions, memory, skills, reasoning engine, tool registry,
 * provider adapters, and orchestration. This is the skeleton for S4-P1;
 * provider/engine implementations plug in via the adapter contracts.
 */

import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type {
  EngineAdapter,
  EngineDeps,
  ProviderAdapter,
  ToolAdapter,
  ToolResult,
} from '../adapters/contracts';
import { InMemoryMemoryStore } from '../memory/memory';
import type { MemoryStore } from '../memory/memory';
import { ReActReasoner, ReasonerEngineAdapter } from '../reasoning/reasoner';
import type { Reasoner } from '../reasoning/reasoner';
import { loadSkillsFromDirectory, SkillRegistry } from '../skills/skills';
import type {
  AgentId,
  EventHandler,
  HermesConfig,
  HermesMessage,
  HermesSession,
  HermesTask,
  RuntimeEvent,
  SessionId,
} from '../types';

export class HermesRuntime {
  private sessions = new Map<SessionId, HermesSession>();
  private tasks = new Map<string, HermesTask>();
  private handlers = new Set<EventHandler>();

  readonly memory: MemoryStore;
  readonly skills = new SkillRegistry();
  readonly providers = new Map<string, ProviderAdapter>();
  readonly tools = new Map<string, ToolAdapter>();

  private reasoner: Reasoner;
  private engine: EngineAdapter;

  constructor(config: HermesConfig = {}) {
    this.memory = new InMemoryMemoryStore();
    this.reasoner = new ReActReasoner();
    this.engine = new ReasonerEngineAdapter(this.reasoner);
    this.config = config;
    this.preloadSkills();
  }

  private config: HermesConfig;

  /**
   * Load SKILL.md packs from `brain-stack/skills/` (walking up from cwd to
   * find the repo root). `config.skills` acts as an allow-list of skill
   * names; when absent every discovered skill is registered.
   */
  private preloadSkills(): void {
    const root = this.findRepoRoot(process.cwd());
    if (!root) return;
    const dir = path.join(root, 'brain-stack', 'skills');
    if (!existsSync(dir)) return;
    const loaded = loadSkillsFromDirectory(dir);
    const allow = this.config.skills;
    const selected = allow?.length
      ? loaded.filter((s) => allow.includes(s.name))
      : loaded;
    this.skills.registerAll(selected);
  }

  private findRepoRoot(from: string): string | null {
    let dir = path.resolve(from);
    for (;;) {
      if (existsSync(path.join(dir, 'brain-stack', 'skills'))) return dir;
      const parent = path.dirname(dir);
      if (parent === dir) return null;
      dir = parent;
    }
  }

  // -- wiring ---------------------------------------------------------------

  registerProvider(p: ProviderAdapter): void {
    this.providers.set(p.id, p);
  }

  registerTool(t: ToolAdapter): void {
    this.tools.set(t.definition.name, t);
  }

  setEngine(engine: EngineAdapter): void {
    this.engine = engine;
  }

  setReasoner(reasoner: Reasoner): void {
    this.reasoner = reasoner;
    this.engine = new ReasonerEngineAdapter(reasoner);
  }

  private requireProvider(id: string): ProviderAdapter {
    const p = this.providers.get(id);
    if (!p) throw new Error(`no provider registered with id "${id}"`);
    return p;
  }

  // -- events ---------------------------------------------------------------

  onEvent(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(event: Omit<RuntimeEvent, 'timestamp'>): void {
    const full: RuntimeEvent = { ...event, timestamp: Date.now() };
    for (const h of this.handlers) h(full);
  }

  // -- sessions -------------------------------------------------------------

  createSession(agentId: AgentId = 'default'): HermesSession {
    const now = Date.now();
    const session: HermesSession = {
      id: `sess-${randomUUID().slice(0, 8)}`,
      agentId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    this.emit({
      type: 'session.created',
      sessionId: session.id,
      payload: { agentId },
    });
    return session;
  }

  getSession(id: SessionId): HermesSession | undefined {
    return this.sessions.get(id);
  }

  listSessions(): HermesSession[] {
    return [...this.sessions.values()];
  }

  // -- tasks ----------------------------------------------------------------

  async runTask(sessionId: SessionId, prompt: string): Promise<HermesTask> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`unknown session ${sessionId}`);

    const task: HermesTask = {
      id: `task-${randomUUID().slice(0, 8)}`,
      sessionId,
      prompt,
      status: 'running',
      iterations: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    this.emit({ type: 'task.started', sessionId, taskId: task.id });

    try {
      const namespace = this.config.memoryNamespace ?? session.agentId;
      const recalled = await this.memory.query({
        namespace,
        scope: 'long-term',
        limit: 5,
      });
      const context: HermesMessage[] = recalled.map((e) => ({
        role: 'system' as const,
        content: `[memory] ${e.content}`,
        timestamp: e.createdAt,
      }));
      context.push(...session.messages.slice(-20));

      const matched = this.skills.match(prompt).slice(0, 3);
      if (matched.length > 0) {
        context.unshift({
          role: 'system',
          content: this.skills.renderContext(matched.map((s) => s.name)),
          timestamp: Date.now(),
        });
      }

      const deps: EngineDeps = {
        provider: this.requireProvider(this.config.provider ?? 'mock'),
        invokeTool: (call) => this.invokeTool(call, session),
        onStep: (step) =>
          this.emit({
            type: 'reasoning.step',
            sessionId,
            taskId: task.id,
            payload: { kind: step.kind },
          }),
      };

      const result = await this.engine.run(
        {
          goal: prompt,
          context,
          tools: [...this.tools.values()].map((t) => t.definition),
          maxSteps: this.config.maxIterations ?? 8,
        },
        deps
      );

      task.status = 'completed';
      task.result = result.answer;
      task.iterations = result.iterationsUsed;

      const assistantMsg: HermesMessage = {
        role: 'assistant',
        content: result.answer,
        timestamp: Date.now(),
      };
      session.messages.push(
        { role: 'user', content: prompt, timestamp: Date.now() },
        assistantMsg
      );
      session.updatedAt = Date.now();

      await this.memory.write({
        scope: 'short-term',
        namespace,
        content: `Q: ${prompt}\nA: ${result.answer}`,
        metadata: { sessionId, taskId: task.id },
      });
      this.emit({ type: 'memory.written', sessionId, taskId: task.id });

      this.emit({ type: 'task.completed', sessionId, taskId: task.id });
    } catch (err) {
      task.status = 'failed';
      task.error = err instanceof Error ? err.message : String(err);
      this.emit({
        type: 'task.failed',
        sessionId,
        taskId: task.id,
        payload: { error: task.error },
      });
    }

    task.updatedAt = Date.now();
    return task;
  }

  getTask(id: string): HermesTask | undefined {
    return this.tasks.get(id);
  }

  listTasks(): HermesTask[] {
    return [...this.tasks.values()];
  }

  getConfig(): HermesConfig {
    return { ...this.config };
  }

  private async invokeTool(
    call: { id: string; name: string; arguments: Record<string, unknown> },
    session: HermesSession
  ): Promise<ToolResult> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return {
        callId: call.id,
        ok: false,
        content: `unknown tool: ${call.name}`,
        isError: true,
      };
    }
    this.emit({
      type: 'tool.called',
      sessionId: session.id,
      payload: { tool: call.name },
    });
    return tool.invoke(call.arguments, {
      sessionId: session.id,
      agentId: session.agentId,
    });
  }
}
