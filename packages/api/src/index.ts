import Fastify, { FastifyInstance } from 'fastify';
import { AICore } from '@ultra-ai/ai-core';
import { WorkspaceRecommender } from './services/workspace-recommender';
import { WorkspaceRecommendationRequest } from './types';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  const aiCore = new AICore({
    models: ['gpt-4o-mini', 'claude-3-haiku'],
    defaultModel: 'gpt-4o-mini',
    language: 'en',
  });

  const recommender = new WorkspaceRecommender();

  app.get('/health', async () => {
    return {
      status: 'ok',
      service: '@ultra-ai/api',
      timestamp: new Date().toISOString(),
    };
  });

  app.post('/ai/process', async (request, reply) => {
    const body = request.body as { input?: string };

    if (!body?.input || !body.input.trim()) {
      reply.status(400);
      return { error: 'input is required' };
    }

    const result = await aiCore.process(body.input);
    return { result };
  });

  app.post('/ai/workspace/recommend', async (request, reply) => {
    const body = request.body as WorkspaceRecommendationRequest;

    if (!body?.userId || !body?.role) {
      reply.status(400);
      return { error: 'userId and role are required' };
    }

    const recommendation = recommender.recommend(body);
    return { recommendation };
  });

  return app;
}

export async function startServer(port = 4000): Promise<void> {
  const app = buildApp();
  await app.listen({ port, host: '0.0.0.0' });
}
