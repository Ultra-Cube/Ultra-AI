import fs from 'node:fs';
import path from 'node:path';

export type ZeroAIMemoryRole = 'user' | 'assistant' | 'system';
export type ZeroAIChannel = 'text' | 'voice' | 'workflow' | 'system';
export type ZeroAIWorkflowStatus = 'draft' | 'ready' | 'running' | 'complete' | 'failed';
export type ZeroAITraceKind = 'interaction' | 'workflow' | 'system';
export type ZeroAIHealthStatus = 'ready' | 'degraded' | 'offline' | 'standby';

export interface ZeroAIMemoryEntry {
  id: string;
  role: ZeroAIMemoryRole;
  channel: ZeroAIChannel;
  content: string;
  createdAt: string;
}

export interface ZeroAIWorkflowRecord {
  id: string;
  name: string;
  description?: string;
  command: string;
  status: ZeroAIWorkflowStatus;
  lastRunAt?: string;
  lastOutput?: string;
  updatedAt: string;
}

export interface ZeroAITraceEntry {
  id: string;
  kind: ZeroAITraceKind;
  title: string;
  summary: string;
  detail: string;
  route: string;
  timestamp: string;
}

export interface ZeroAIAgentStatus {
  id: string;
  name: string;
  role: string;
  status: ZeroAIHealthStatus;
  summary: string;
  updatedAt: string;
}

export interface ZeroAIHealth {
  openclaw: ZeroAIHealthStatus;
  n8n: ZeroAIHealthStatus;
  localModel: ZeroAIHealthStatus;
  network: ZeroAIHealthStatus;
}

/**
 * Operator controls over the AI "mind" — lets the professional view steer
 * routing instead of only observing it: pin a model, force a route, or pause
 * routing entirely (new prompts are held / rejected while paused).
 */
export interface ZeroAIControl {
  routingPaused: boolean;
  modelOverride: string | null;
  forcedRoute: string | null;
  updatedAt: string;
}

export interface ZeroAIState {
  assistantName: string;
  mode: 'local';
  lastPrompt: string | null;
  lastResponse: string | null;
  lastRoute: string | null;
  updatedAt: string;
  memory: ZeroAIMemoryEntry[];
  workflows: ZeroAIWorkflowRecord[];
  trace: ZeroAITraceEntry[];
  agents: ZeroAIAgentStatus[];
  health: ZeroAIHealth;
  control: ZeroAIControl;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ZeroAIStore {
  private readonly storagePath: string;
  private state: ZeroAIState;

  constructor(storagePath = path.resolve(process.cwd(), 'data/zeroai-state.json')) {
    this.storagePath = storagePath;
    this.state = this.loadFromDisk();
  }

  getState(): ZeroAIState {
    return this.clone(this.state);
  }

  getMemory(): ZeroAIMemoryEntry[] {
    return this.clone(this.state.memory);
  }

  getWorkflows(): ZeroAIWorkflowRecord[] {
    return this.clone(this.state.workflows);
  }

  appendMemory(entry: Omit<ZeroAIMemoryEntry, 'id' | 'createdAt'>): ZeroAIMemoryEntry {
    const record: ZeroAIMemoryEntry = {
      ...entry,
      id: createId('mem'),
      createdAt: new Date().toISOString(),
    };

    this.state.memory = [...this.state.memory, record].slice(-100);
    this.bumpState();
    return this.clone(record);
  }

  appendTrace(entry: Omit<ZeroAITraceEntry, 'id' | 'timestamp'>): ZeroAITraceEntry {
    const record: ZeroAITraceEntry = {
      ...entry,
      id: createId('trace'),
      timestamp: new Date().toISOString(),
    };

    this.state.trace = [...this.state.trace, record].slice(-40);
    this.bumpState();
    return this.clone(record);
  }

  registerAgent(input: Omit<ZeroAIAgentStatus, 'updatedAt'> & Partial<Pick<ZeroAIAgentStatus, 'updatedAt'>>): ZeroAIAgentStatus {
    const existingIndex = this.state.agents.findIndex((agent) => agent.id === input.id);
    const agent: ZeroAIAgentStatus = {
      id: input.id,
      name: input.name,
      role: input.role,
      status: input.status,
      summary: input.summary,
      updatedAt: input.updatedAt ?? new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.state.agents[existingIndex] = agent;
    } else {
      this.state.agents = [...this.state.agents, agent];
    }

    this.bumpState();
    return this.clone(agent);
  }

  setHealth(health: Partial<ZeroAIHealth>): ZeroAIHealth {
    this.state.health = {
      ...this.state.health,
      ...health,
    };

    this.bumpState();
    return this.clone(this.state.health);
  }

  getControl(): ZeroAIControl {
    return this.clone(this.state.control);
  }

  /** Operator steering: pause routing, pin a model, or force a route. */
  setControl(patch: Partial<Omit<ZeroAIControl, 'updatedAt'>>): ZeroAIControl {
    this.state.control = {
      ...this.state.control,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.appendTrace({
      kind: 'system',
      title: 'Operator control updated',
      summary: `paused=${this.state.control.routingPaused} model=${this.state.control.modelOverride ?? 'auto'} route=${this.state.control.forcedRoute ?? 'auto'}`,
      detail: 'AI mind control settings changed from the operator panel.',
      route: 'mind-control',
    });

    this.bumpState();
    return this.clone(this.state.control);
  }

  recordInteraction(prompt: string, response: string, route: string): void {
    this.state.lastPrompt = prompt;
    this.state.lastResponse = response;
    this.state.lastRoute = route;
    this.state.updatedAt = new Date().toISOString();
    this.appendTrace({
      kind: 'interaction',
      title: 'Interaction logged',
      summary: `Prompt routed via ${route}`,
      detail: prompt,
      route,
    });
  }

  upsertWorkflow(input: Omit<ZeroAIWorkflowRecord, 'id' | 'updatedAt' | 'status'> & Partial<Pick<ZeroAIWorkflowRecord, 'id' | 'status' | 'lastRunAt' | 'lastOutput'>>): ZeroAIWorkflowRecord {
    const id = input.id || createId('wf');
    const existingIndex = this.state.workflows.findIndex((workflow) => workflow.id === id);
    const workflow: ZeroAIWorkflowRecord = {
      id,
      name: input.name,
      description: input.description,
      command: input.command,
      status: input.status ?? 'ready',
      lastRunAt: input.lastRunAt,
      lastOutput: input.lastOutput,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.state.workflows[existingIndex] = workflow;
    } else {
      this.state.workflows = [...this.state.workflows, workflow];
    }

    this.appendTrace({
      kind: 'workflow',
      title: existingIndex >= 0 ? 'Workflow updated' : 'Workflow created',
      summary: workflow.name,
      detail: workflow.command,
      route: 'workflow-builder',
    });
    return this.clone(workflow);
  }

  setWorkflowStatus(id: string, status: ZeroAIWorkflowStatus, output?: string): ZeroAIWorkflowRecord | null {
    const workflow = this.state.workflows.find((item) => item.id === id);
    if (!workflow) {
      return null;
    }

    workflow.status = status;
    workflow.updatedAt = new Date().toISOString();
    workflow.lastRunAt = new Date().toISOString();
    if (output !== undefined) {
      workflow.lastOutput = output;
    }

    this.appendTrace({
      kind: 'workflow',
      title: `Workflow ${status}`,
      summary: workflow.name,
      detail: output ?? workflow.command,
      route: 'workflow-runner',
    });
    return this.clone(workflow);
  }

  private loadFromDisk(): ZeroAIState {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return this.createDefaultState();
      }

      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ZeroAIState>;
      return {
        ...this.createDefaultState(),
        ...parsed,
        memory: Array.isArray(parsed.memory) ? parsed.memory : [],
        workflows: Array.isArray(parsed.workflows) ? parsed.workflows : [],
        trace: Array.isArray(parsed.trace) ? parsed.trace : [],
        agents: Array.isArray(parsed.agents) ? parsed.agents : [],
        health: {
          ...this.createDefaultState().health,
          ...(parsed.health ?? {}),
        },
        control: {
          ...this.createDefaultState().control,
          ...(parsed.control ?? {}),
        },
      };
    } catch {
      return this.createDefaultState();
    }
  }

  private createDefaultState(): ZeroAIState {
    const now = new Date().toISOString();
    return {
      assistantName: 'ZeroAI',
      mode: 'local',
      lastPrompt: null,
      lastResponse: null,
      lastRoute: null,
      updatedAt: now,
      memory: [],
      workflows: [
        {
          id: 'starter-openclaw-status',
          name: 'OpenClaw status check',
          description: 'Summarize the current assistant routing and local stack health.',
          command: 'bash /home/pc/ucube/project/Ultra-AI/wsl-ai-stack/scripts/openclaw-bridge.sh "Summarize the current assistant routing and next actions."',
          status: 'ready',
          updatedAt: now,
        },
      ],
      trace: [
        {
          id: 'trace-boot',
          kind: 'system',
          title: 'System booted',
          summary: 'ZeroAI control surface is online',
          detail: 'The local assistant stack is ready for routing and workflow execution.',
          route: 'boot',
          timestamp: now,
        },
      ],
      agents: [
        {
          id: 'zeroai',
          name: 'ZeroAI',
          role: 'Local assistant',
          status: 'ready',
          summary: 'Coordinates the local control surface and memory.',
          updatedAt: now,
        },
        {
          id: 'openclaw',
          name: 'OpenClaw',
          role: 'Routing policy',
          status: 'ready',
          summary: 'Routes prompts between local, workflow, and network actions.',
          updatedAt: now,
        },
        {
          id: 'n8n',
          name: 'n8n',
          role: 'Workflow backbone',
          status: 'ready',
          summary: 'Executes repeatable automation plans.',
          updatedAt: now,
        },
        {
          id: 'ultra-ai',
          name: 'Ultra AI network',
          role: 'Distributed platform',
          status: 'standby',
          summary: 'Handles escalations that require shared or distributed compute.',
          updatedAt: now,
        },
      ],
      health: {
        openclaw: 'ready',
        n8n: 'ready',
        localModel: 'ready',
        network: 'standby',
      },
      control: {
        routingPaused: false,
        modelOverride: null,
        forcedRoute: null,
        updatedAt: now,
      },
    };
  }

  private bumpState(): void {
    this.state.updatedAt = new Date().toISOString();
    this.saveToDisk();
  }

  private saveToDisk(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.storagePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
