import fs from 'node:fs';
import path from 'node:path';

export type ZeroAIMemoryRole = 'user' | 'assistant' | 'system';
export type ZeroAIChannel = 'text' | 'voice' | 'workflow' | 'system';
export type ZeroAIWorkflowStatus = 'draft' | 'ready' | 'running' | 'complete' | 'failed';

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

export interface ZeroAIState {
  assistantName: string;
  mode: 'local';
  lastPrompt: string | null;
  lastResponse: string | null;
  lastRoute: string | null;
  updatedAt: string;
  memory: ZeroAIMemoryEntry[];
  workflows: ZeroAIWorkflowRecord[];
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

  recordInteraction(prompt: string, response: string, route: string): void {
    this.state.lastPrompt = prompt;
    this.state.lastResponse = response;
    this.state.lastRoute = route;
    this.state.updatedAt = new Date().toISOString();
    this.saveToDisk();
  }

  upsertWorkflow(input: Omit<ZeroAIWorkflowRecord, 'updatedAt' | 'status'> & Partial<Pick<ZeroAIWorkflowRecord, 'status' | 'lastRunAt' | 'lastOutput'>>): ZeroAIWorkflowRecord {
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

    this.bumpState();
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

    this.bumpState();
    return this.clone(workflow);
  }

  private loadFromDisk(): ZeroAIState {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return this.createDefaultState();
      }

      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const parsed = JSON.parse(raw) as ZeroAIState;
      return {
        ...this.createDefaultState(),
        ...parsed,
        memory: Array.isArray(parsed.memory) ? parsed.memory : [],
        workflows: Array.isArray(parsed.workflows) ? parsed.workflows : [],
      };
    } catch {
      return this.createDefaultState();
    }
  }

  private createDefaultState(): ZeroAIState {
    return {
      assistantName: 'ZeroAI',
      mode: 'local',
      lastPrompt: null,
      lastResponse: null,
      lastRoute: null,
      updatedAt: new Date().toISOString(),
      memory: [],
      workflows: [
        {
          id: 'starter-openclaw-status',
          name: 'OpenClaw status check',
          description: 'Summarize the current assistant routing and local stack health.',
          command: 'bash /home/pc/ucube/project/Ultra-AI/wsl-ai-stack/scripts/openclaw-bridge.sh "Summarize the current assistant routing and next actions."',
          status: 'ready',
          updatedAt: new Date().toISOString(),
        },
      ],
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
