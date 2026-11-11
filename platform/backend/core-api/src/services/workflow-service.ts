import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type WorkflowStatus =
  | 'draft'
  | 'ready'
  | 'running'
  | 'complete'
  | 'failed';

export interface WorkflowDefinition {
  type: 'shell' | 'n8n-flow';
  command: string;
  trigger?: string;
  tags?: string[];
  n8n?: Record<string, unknown>;
}

export interface WorkflowRecord {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  lastRunAt?: string;
  lastOutput?: string;
  updatedAt: string;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  input?: unknown;
  output?: string;
  status: WorkflowStatus;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface WorkflowStoreShape {
  workflows: WorkflowRecord[];
  executions: WorkflowExecutionRecord[];
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class WorkflowService {
  private readonly storagePath: string;
  private state: WorkflowStoreShape;

  constructor(
    storagePath = path.resolve(process.cwd(), 'data/n8n-workflows.json')
  ) {
    this.storagePath = storagePath;
    this.state = this.loadFromDisk();
  }

  listWorkflows(tenantId?: string, limit = 50, offset = 0): WorkflowRecord[] {
    const items = tenantId
      ? this.state.workflows.filter(
          (workflow) => workflow.tenantId === tenantId
        )
      : this.state.workflows;
    return this.clone(items.slice(offset, offset + limit));
  }

  getWorkflow(id: string): WorkflowRecord | null {
    const workflow = this.state.workflows.find((item) => item.id === id);
    return workflow ? this.clone(workflow) : null;
  }

  createWorkflow(
    tenantId: string,
    userId: string,
    name: string,
    definition: WorkflowDefinition,
    description?: string
  ): WorkflowRecord {
    const workflow: WorkflowRecord = {
      id: createId('wf'),
      tenantId,
      userId,
      name,
      description,
      definition,
      status: 'ready',
      updatedAt: new Date().toISOString(),
    };

    this.state.workflows = [...this.state.workflows, workflow];
    this.persist();
    return this.clone(workflow);
  }

  updateWorkflow(id: string, patch: Partial<WorkflowRecord>): WorkflowRecord {
    const workflow = this.state.workflows.find((item) => item.id === id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    Object.assign(workflow, patch, {
      updatedAt: new Date().toISOString(),
    });
    this.persist();
    return this.clone(workflow);
  }

  deleteWorkflow(id: string): void {
    const before = this.state.workflows.length;
    this.state.workflows = this.state.workflows.filter(
      (workflow) => workflow.id !== id
    );
    if (this.state.workflows.length === before) {
      throw new Error('Workflow not found');
    }
    this.persist();
  }

  listExecutions(
    workflowId?: string,
    limit = 50,
    offset = 0
  ): WorkflowExecutionRecord[] {
    const executions = workflowId
      ? this.state.executions.filter(
          (execution) => execution.workflowId === workflowId
        )
      : this.state.executions;

    return this.clone(executions.slice(offset, offset + limit));
  }

  getExecution(id: string): WorkflowExecutionRecord | null {
    const execution = this.state.executions.find((item) => item.id === id);
    return execution ? this.clone(execution) : null;
  }

  async createExecution(
    workflowId: string,
    input?: unknown
  ): Promise<WorkflowExecutionRecord> {
    const workflow = this.state.workflows.find(
      (item) => item.id === workflowId
    );
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const execution: WorkflowExecutionRecord = {
      id: createId('exec'),
      workflowId,
      input,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    this.state.executions = [...this.state.executions, execution];
    workflow.status = 'running';
    workflow.lastRunAt = execution.startedAt;
    workflow.updatedAt = execution.startedAt;
    this.persist();

    try {
      const command = workflow.definition.command;
      const { stdout } = await execFileAsync('bash', ['-lc', command], {
        maxBuffer: 1024 * 1024,
        env: process.env,
      });

      const output = String(stdout || '').trim() || 'Workflow completed.';
      execution.status = 'complete';
      execution.output = output;
      execution.completedAt = new Date().toISOString();
      workflow.status = 'complete';
      workflow.lastOutput = output;
      workflow.updatedAt = execution.completedAt;
      this.persist();

      return this.clone(execution);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Workflow execution failed';
      execution.status = 'failed';
      execution.error = message;
      execution.completedAt = new Date().toISOString();
      workflow.status = 'failed';
      workflow.lastOutput = message;
      workflow.updatedAt = execution.completedAt;
      this.persist();

      return this.clone(execution);
    }
  }

  async updateExecution(
    id: string,
    patch: Partial<WorkflowExecutionRecord>
  ): Promise<WorkflowExecutionRecord> {
    const execution = this.state.executions.find((item) => item.id === id);
    if (!execution) {
      throw new Error('Execution not found');
    }

    Object.assign(execution, patch);
    this.persist();
    return this.clone(execution);
  }

  private loadFromDisk(): WorkflowStoreShape {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return this.createDefaultState();
      }

      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<WorkflowStoreShape>;
      return {
        workflows: Array.isArray(parsed.workflows) ? parsed.workflows : [],
        executions: Array.isArray(parsed.executions) ? parsed.executions : [],
      };
    } catch {
      return this.createDefaultState();
    }
  }

  private createDefaultState(): WorkflowStoreShape {
    return {
      workflows: [
        {
          id: 'starter-openclaw-status',
          tenantId: 'local-zeroai',
          userId: 'system',
          name: 'OpenClaw status check',
          description:
            'Summarize the current assistant routing and local stack health.',
          definition: {
            type: 'shell',
            command:
              'bash /home/pc/ucube/project/Ultra-AI/wsl-ai-stack/scripts/openclaw-bridge.sh "Summarize the current assistant routing and next actions."',
            trigger: 'manual',
            tags: ['zeroai', 'openclaw', 'n8n'],
          },
          status: 'ready',
          updatedAt: new Date().toISOString(),
        },
      ],
      executions: [],
    };
  }

  private persist(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

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

export default WorkflowService;
