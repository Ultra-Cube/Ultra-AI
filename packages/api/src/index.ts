import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AICore } from '@ultra-ai/ai-core';
import { AuthService } from './services/auth/auth-service';
import { DatabaseUserService } from './services/auth/db-user-service';
import { WorkspaceProfileStore } from './services/profile/workspace-profile-store';
import { WorkspaceRecommender } from './services/workspace-recommender';
import { AuthRequest, WorkspaceRecommendationRequest } from './types';

export interface AppContext {
  prisma: PrismaClient;
  authService: AuthService;
  aiCore: AICore;
  profileStore: WorkspaceProfileStore;
  recommender: WorkspaceRecommender;
}

export function buildApp(context?: AppContext): FastifyInstance {
  const app = Fastify({ logger: false });

  const prisma = context?.prisma || new PrismaClient();
  const aiCore = context?.aiCore || new AICore({
    models: ['gpt-4o-mini', 'claude-3-haiku'],
    defaultModel: 'gpt-4o-mini',
    language: 'en',
  });

  const recommender = context?.recommender || new WorkspaceRecommender();
  const dbUserService = new DatabaseUserService(prisma);
  const authService = context?.authService || new AuthService(dbUserService);
  const profileStore = context?.profileStore || new WorkspaceProfileStore();

  function getBearerUser(
    authorizationHeader: string | undefined,
  ): { userId: string; email: string } {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new Error('Missing bearer token');
    }

    return authService.verifyToken(authorizationHeader.replace('Bearer ', ''));
  }

  app.get('/health', async () => {
    return {
      status: 'ok',
      service: '@ultra-ai/api',
      timestamp: new Date().toISOString(),
    };
  });

  app.post('/auth/register', async (request, reply) => {
    const body = request.body as AuthRequest;
    if (!body?.email || !body?.password) {
      reply.status(400);
      return { error: 'email and password are required' };
    }

    try {
      return await authService.register(body.email, body.password);
    } catch (error) {
      reply.status(409);
      return { error: error instanceof Error ? error.message : 'Unable to register' };
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const body = request.body as AuthRequest;
    if (!body?.email || !body?.password) {
      reply.status(400);
      return { error: 'email and password are required' };
    }

    try {
      return await authService.login(body.email, body.password);
    } catch (error) {
      reply.status(401);
      return { error: error instanceof Error ? error.message : 'Invalid credentials' };
    }
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

    if (!body?.role) {
      reply.status(400);
      return { error: 'role is required' };
    }

    let user: { userId: string; email: string };
    try {
      user = getBearerUser(request.headers.authorization);
    } catch {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    const recommendation = recommender.recommend(body);
    const existingProfile = profileStore.get(user.userId);

    const savedProfile = profileStore.upsert({
      userId: user.userId,
      role: body.role,
      pinnedWidgets: existingProfile?.pinnedWidgets ?? recommendation.pinnedWidgets,
      preferredTools: body.preferredTools ?? recommendation.suggestedTools,
      lastSignals: body.usageSignals ?? [],
    });

    return { recommendation, profile: savedProfile };
  });

  app.get('/user/workspace-profile', async (request, reply) => {
    let user: { userId: string; email: string };
    try {
      user = getBearerUser(request.headers.authorization);
    } catch {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    const profile = profileStore.get(user.userId);
    if (!profile) {
      reply.status(404);
      return { error: 'Profile not found' };
    }

    return { profile };
  });

  app.put('/user/workspace-profile', async (request, reply) => {
    let user: { userId: string; email: string };
    try {
      user = getBearerUser(request.headers.authorization);
    } catch {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    const body = request.body as {
      role?: WorkspaceRecommendationRequest['role'];
      pinnedWidgets?: string[];
      preferredTools?: string[];
      usageSignals?: string[];
    };

    const current = profileStore.get(user.userId);
    const updated = profileStore.upsert({
      userId: user.userId,
      role: body.role ?? current?.role ?? 'custom',
      pinnedWidgets: body.pinnedWidgets ?? current?.pinnedWidgets ?? ['chat', 'tools'],
      preferredTools: body.preferredTools ?? current?.preferredTools ?? ['general-assistant'],
      lastSignals: body.usageSignals ?? current?.lastSignals ?? [],
    });

    return { profile: updated };
  });

  return app;
}

export async function startServer(port = 4000, context?: AppContext): Promise<{ app: FastifyInstance; prisma: PrismaClient }> {
  const prisma = context?.prisma || new PrismaClient();
  const finalContext: AppContext = context || {
    prisma,
    authService: new AuthService(new DatabaseUserService(prisma)),
    aiCore: new AICore({
      models: ['gpt-4o-mini', 'claude-3-haiku'],
      defaultModel: 'gpt-4o-mini',
      language: 'en',
    }),
    profileStore: new WorkspaceProfileStore(),
    recommender: new WorkspaceRecommender(),
  };

  const app = buildApp(finalContext);

  await app.listen({ port, host: '0.0.0.0' });

  return { app, prisma };
}
