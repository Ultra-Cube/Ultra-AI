import type { FastifyPluginAsync } from 'fastify';

import WorkflowService, {
  type WorkflowRecord,
} from '../services/workflow-service';

interface WorkflowUpdatePayload {
  tenantId?: string;
  userId?: string;
  name?: string;
  description?: string;
  definition?: {
    type?: 'shell' | 'n8n-flow';
    command?: string;
    trigger?: string;
    tags?: string[];
    n8n?: Record<string, unknown>;
  };
  status?: 'draft' | 'ready' | 'running' | 'complete' | 'failed';
  lastRunAt?: string;
  lastOutput?: string;
}

const workflowRoutes: FastifyPluginAsync = async (app) => {
  const service = new WorkflowService();

  app.get('/n8n/workflows', async (request) => {
    const query = request.query as {
      tenantId?: string;
      limit?: string;
      offset?: string;
    };
    const workflows = service.listWorkflows(
      query.tenantId,
      query.limit ? Number(query.limit) : 50,
      query.offset ? Number(query.offset) : 0
    );

    return { workflows };
  });

  app.get('/n8n/workflows/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const workflow = service.getWorkflow(params.id);

    if (!workflow) {
      reply.status(404);
      return { error: 'Workflow not found' };
    }

    return { workflow };
  });

  app.post('/n8n/workflows', async (request, reply) => {
    const body = request.body as {
      tenantId?: string;
      userId?: string;
      name?: string;
      description?: string;
      definition?: Record<string, unknown>;
    };

    if (
      !body?.tenantId?.trim() ||
      !body?.userId?.trim() ||
      !body?.name?.trim() ||
      !body?.definition
    ) {
      reply.status(400);
      return { error: 'tenantId, userId, name, and definition are required' };
    }

    const workflow = service.createWorkflow(
      body.tenantId.trim(),
      body.userId.trim(),
      body.name.trim(),
      {
        type: 'n8n-flow',
        command: String(
          body.definition.command ?? 'echo "No command configured"'
        ),
        trigger: String(body.definition.trigger ?? 'manual'),
        tags: Array.isArray(body.definition.tags)
          ? body.definition.tags.map(String)
          : ['n8n', 'zeroai'],
        n8n: body.definition,
      },
      body.description?.trim()
    );

    return { workflow };
  });

  app.put('/n8n/workflows/:id', async (request) => {
    const params = request.params as { id: string };
    const body = request.body as WorkflowUpdatePayload;
    const patch: Partial<WorkflowRecord> = {
      tenantId: body.tenantId,
      userId: body.userId,
      name: body.name,
      description: body.description,
      status: body.status,
      lastRunAt: body.lastRunAt,
      lastOutput: body.lastOutput,
    };

    if (body.definition?.type && body.definition.command) {
      patch.definition = {
        type: body.definition.type,
        command: body.definition.command,
        trigger: body.definition.trigger,
        tags: body.definition.tags,
        n8n: body.definition.n8n,
      };
    }

    const workflow = service.updateWorkflow(params.id, patch);
    return { workflow };
  });

  app.delete('/n8n/workflows/:id', async (request, reply) => {
    const params = request.params as { id: string };

    try {
      service.deleteWorkflow(params.id);
      return { message: 'deleted' };
    } catch {
      reply.status(404);
      return { error: 'Workflow not found' };
    }
  });

  app.post('/n8n/workflows/:id/execute', async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { input?: unknown };

    try {
      const execution = await service.createExecution(params.id, body?.input);
      return { execution };
    } catch (error) {
      reply.status(404);
      return {
        error:
          error instanceof Error ? error.message : 'Unable to execute workflow',
      };
    }
  });

  app.get('/n8n/workflows/:id/executions', async (request) => {
    const params = request.params as { id: string };
    return { executions: service.listExecutions(params.id) };
  });
};

export default workflowRoutes;
