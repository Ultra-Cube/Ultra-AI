import fs from 'node:fs';
import path from 'node:path';

/**
 * Agent Staff Store.
 *
 * Lets an operator manage AI agents like staff: each agent has a position
 * (title + department + rank), a status, and a queue of assigned tasks. Tasks
 * can be dispatched to a specific agent, reassigned between agents, and moved
 * through a lifecycle (queued → in_progress → done / blocked).
 *
 * Durable JSON store, mirroring the ZeroAIStore pattern so it runs without a
 * database connection. Swap for Prisma in Phase 1 (see MASTER_ARCHITECTURE.md).
 */

export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline' | 'suspended';
export type AgentRank = 'lead' | 'senior' | 'standard' | 'trainee';
export type TaskStatus = 'queued' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AgentPosition {
  title: string;
  department: string;
  rank: AgentRank;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId: string;
  createdAt: string;
  updatedAt: string;
  result?: string;
}

export interface StaffAgent {
  id: string;
  name: string;
  avatar: string;
  position: AgentPosition;
  status: AgentStatus;
  capabilities: string[];
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStaffState {
  agents: StaffAgent[];
  tasks: AgentTask[];
  updatedAt: string;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class AgentStaffStore {
  private readonly storagePath: string;
  private state: AgentStaffState;

  constructor(
    storagePath = path.resolve(process.cwd(), 'data/agent-staff-state.json')
  ) {
    this.storagePath = storagePath;
    this.state = this.loadFromDisk();
  }

  getState(): AgentStaffState {
    return this.clone(this.state);
  }

  getAgents(): StaffAgent[] {
    return this.clone(this.state.agents);
  }

  getTasks(): AgentTask[] {
    return this.clone(this.state.tasks);
  }

  /** Tasks grouped under their agent — the "staff roster with workload" view. */
  getRoster(): Array<StaffAgent & { tasks: AgentTask[]; openTasks: number }> {
    return this.state.agents.map((agent) => {
      const tasks = this.state.tasks.filter(
        (t) => t.assignedAgentId === agent.id
      );
      return {
        ...this.clone(agent),
        tasks: this.clone(tasks),
        openTasks: tasks.filter(
          (t) => t.status === 'queued' || t.status === 'in_progress'
        ).length,
      };
    });
  }

  hireAgent(input: {
    name: string;
    position: AgentPosition;
    capabilities?: string[];
    model?: string;
    avatar?: string;
    status?: AgentStatus;
  }): StaffAgent {
    const now = new Date().toISOString();
    const agent: StaffAgent = {
      id: createId('agent'),
      name: input.name,
      avatar: input.avatar ?? '🤖',
      position: input.position,
      status: input.status ?? 'idle',
      capabilities: input.capabilities ?? [],
      model: input.model,
      createdAt: now,
      updatedAt: now,
    };
    this.state.agents = [...this.state.agents, agent];
    this.bumpState();
    return this.clone(agent);
  }

  updateAgent(
    id: string,
    patch: Partial<
      Pick<
        StaffAgent,
        'name' | 'avatar' | 'position' | 'status' | 'capabilities' | 'model'
      >
    >
  ): StaffAgent | null {
    const agent = this.state.agents.find((a) => a.id === id);
    if (!agent) return null;
    Object.assign(agent, patch, { updatedAt: new Date().toISOString() });
    this.bumpState();
    return this.clone(agent);
  }

  /** Give an agent a new position (title / department / rank). */
  setPosition(id: string, position: AgentPosition): StaffAgent | null {
    return this.updateAgent(id, { position });
  }

  removeAgent(id: string): boolean {
    const before = this.state.agents.length;
    this.state.agents = this.state.agents.filter((a) => a.id !== id);
    // Unassign that agent's tasks rather than deleting them.
    this.state.tasks = this.state.tasks.map((t) =>
      t.assignedAgentId === id
        ? {
            ...t,
            assignedAgentId: '',
            status: 'blocked',
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    const changed = this.state.agents.length !== before;
    if (changed) this.bumpState();
    return changed;
  }

  /** Dispatch a task to a specific agent. */
  assignTask(input: {
    title: string;
    description?: string;
    agentId: string;
    priority?: TaskPriority;
  }): AgentTask | null {
    const agent = this.state.agents.find((a) => a.id === input.agentId);
    if (!agent) return null;
    const now = new Date().toISOString();
    const task: AgentTask = {
      id: createId('task'),
      title: input.title,
      description: input.description ?? '',
      status: 'queued',
      priority: input.priority ?? 'normal',
      assignedAgentId: input.agentId,
      createdAt: now,
      updatedAt: now,
    };
    this.state.tasks = [...this.state.tasks, task];
    // Mark the agent busy if they now have active work.
    if (agent.status === 'idle') agent.status = 'busy';
    this.bumpState();
    return this.clone(task);
  }

  /** Move a task to a different agent. */
  reassignTask(taskId: string, newAgentId: string): AgentTask | null {
    const task = this.state.tasks.find((t) => t.id === taskId);
    const agent = this.state.agents.find((a) => a.id === newAgentId);
    if (!task || !agent) return null;
    task.assignedAgentId = newAgentId;
    task.updatedAt = new Date().toISOString();
    if (task.status === 'blocked') task.status = 'queued';
    this.bumpState();
    return this.clone(task);
  }

  updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    result?: string
  ): AgentTask | null {
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (result !== undefined) task.result = result;
    this.bumpState();
    return this.clone(task);
  }

  private loadFromDisk(): AgentStaffState {
    try {
      if (!fs.existsSync(this.storagePath)) return this.createDefaultState();
      const parsed = JSON.parse(
        fs.readFileSync(this.storagePath, 'utf8')
      ) as Partial<AgentStaffState>;
      return {
        agents: Array.isArray(parsed.agents)
          ? parsed.agents
          : this.createDefaultState().agents,
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      };
    } catch {
      return this.createDefaultState();
    }
  }

  private createDefaultState(): AgentStaffState {
    const now = new Date().toISOString();
    const seed = (
      name: string,
      avatar: string,
      title: string,
      department: string,
      rank: AgentRank,
      capabilities: string[],
      model: string
    ): StaffAgent => ({
      id: createId('agent'),
      name,
      avatar,
      position: { title, department, rank },
      status: 'idle',
      capabilities,
      model,
      createdAt: now,
      updatedAt: now,
    });

    return {
      agents: [
        seed(
          'Atlas',
          '🧭',
          'Orchestration Lead',
          'Operations',
          'lead',
          ['routing', 'planning', 'delegation'],
          'gpt-5'
        ),
        seed(
          'Scribe',
          '✍️',
          'Content Specialist',
          'Content',
          'senior',
          ['generate', 'summarize', 'translate'],
          'claude-sonnet-4.5'
        ),
        seed(
          'Probe',
          '🔎',
          'Research Analyst',
          'Intelligence',
          'standard',
          ['analyze', 'search', 'osint'],
          'claude-opus-4.1'
        ),
        seed(
          'Ledger',
          '💰',
          'Finance Agent',
          'Finance',
          'standard',
          ['quant', 'analyze'],
          'gpt-4.1'
        ),
      ],
      tasks: [],
      updatedAt: now,
    };
  }

  private bumpState(): void {
    this.state.updatedAt = new Date().toISOString();
    this.saveToDisk();
  }

  private saveToDisk(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      this.storagePath,
      JSON.stringify(this.state, null, 2),
      'utf8'
    );
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
