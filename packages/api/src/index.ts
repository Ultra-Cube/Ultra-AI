import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AICore } from '@ultra-ai/ai-core';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { AuthService } from './services/auth/auth-service';
import { DatabaseUserService } from './services/auth/db-user-service';
import { WorkspaceProfileStore } from './services/profile/workspace-profile-store';
import { WorkspaceRecommender } from './services/workspace-recommender';
import { ModelGateway, createModelGateway } from './services/ai/model-gateway';
import {
  RateLimiter,
  SecurityHeadersGenerator,
  InputValidator,
  ComplianceManager,
  AuditLogger,
} from './services/security/security-hardening';
import {
  registerMonitoringMiddleware,
  registerMetricsEndpoint,
  registerHealthCheckEndpoint,
} from './services/monitoring/middleware';
import { MultiLayerCache, MemoryCache, RedisCache } from './services/caching/cache';
import { registerHttpCachingMiddleware } from './services/caching/invalidation';
import { AuthRequest, WorkspaceRecommendationRequest } from './types';
import { swaggerOptions, swaggerUiOptions } from './config/swagger.config';

export interface AppContext {
  prisma: PrismaClient;
  authService: AuthService;
  aiCore: AICore;
  profileStore: WorkspaceProfileStore;
  recommender: WorkspaceRecommender;
  modelGateway: ModelGateway;
  rateLimiter?: RateLimiter;
  complianceManager?: ComplianceManager;
  auditLogger?: AuditLogger;
  cache?: MultiLayerCache;
}

export async function buildApp(context?: AppContext): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  // Register Swagger plugins for API documentation
  await app.register(fastifySwagger, swaggerOptions);
  await app.register(fastifySwaggerUi, swaggerUiOptions);

  // Register monitoring and observability middleware
  await registerMonitoringMiddleware(app);
  await registerMetricsEndpoint(app);
  await registerHealthCheckEndpoint(app, {
    database: async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
  });

  // Initialize caching layer (L1: in-memory, L2: Redis)
  const memoryCache = new MemoryCache({ maxSize: 100 * 1024 * 1024 }); // 100MB
  const redisCache = new RedisCache({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });
  
  const cache = context?.cache || new MultiLayerCache(memoryCache, redisCache);
  
  // Register HTTP response caching middleware
  await registerHttpCachingMiddleware(app, cache);

  const prisma = context?.prisma || new PrismaClient();
  const aiCore = context?.aiCore || new AICore({
    models: ['gpt-4o-mini', 'claude-3-haiku'],
    defaultModel: 'gpt-4o-mini',
    language: 'en',
  });

  const recommender = context?.recommender || new WorkspaceRecommender();
  const modelGateway = context?.modelGateway || createModelGateway();
  const dbUserService = new DatabaseUserService(prisma);
  const authService = context?.authService || new AuthService(dbUserService);
  const profileStore = context?.profileStore || new WorkspaceProfileStore();
  
  // Security services
  const rateLimiter = context?.rateLimiter || new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    keyPrefix: 'api-rate-limit',
  });
  
  const complianceManager = context?.complianceManager || new ComplianceManager({
    gdprEnabled: true,
    ccpaEnabled: true,
    dataRetentionDays: 90,
    requireConsentBefore: false,
    allowDataExport: true,
    allowDataDeletion: true,
  });
  
  const auditLogger = context?.auditLogger || new AuditLogger();

  // Apply security headers to all responses
  app.addHook('onSend', async (request, reply) => {
    const headers = SecurityHeadersGenerator.getHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      reply.header(key, value);
    });
  });

  // Apply rate limiting to non-health endpoints
  app.addHook('preHandler', async (request, reply) => {
    if (request.url === '/health') {
      return;
    }

    const clientKey = request.ip;
    if (!rateLimiter.isAllowed(clientKey)) {
      auditLogger.log('rate_limit_exceeded', 'api', 'failure', undefined, { 
        ip: clientKey,
        endpoint: request.url,
      });
      reply.status(429);
      return { error: 'Too many requests, please try again later' };
    }
  });

  function getBearerUser(
    authorizationHeader: string | undefined,
  ): { userId: string; email: string; role: string } {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new Error('Missing bearer token');
    }

    return authService.verifyToken(authorizationHeader.replace('Bearer ', ''));
  }

  function requireRole(...allowedRoles: string[]) {
    return (authHeader: string | undefined) => {
      const user = getBearerUser(authHeader);
      if (!allowedRoles.includes(user.role)) {
        throw new Error(`Insufficient permissions. Required: ${allowedRoles.join(' or ')}`);
      }
      return user;
    };
  }

  // Health Check Endpoint
  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      description: 'Returns the health status of the API server',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: '@ultra-ai/api' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      service: '@ultra-ai/api',
      timestamp: new Date().toISOString(),
    };
  });

  // GDPR/CCPA Compliance Endpoints
  app.post('/compliance/consent', {
    schema: {
      tags: ['Compliance'],
      summary: 'Record user consent',
      description: 'Record GDPR/CCPA user consent preference',
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', description: 'User identifier' },
          given: { type: 'boolean', description: 'Consent status (default: true)', default: true },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            consentGiven: { type: 'boolean' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'userId is required' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { userId: string; given: boolean };
    
    if (!body?.userId) {
      reply.status(400);
      return { error: 'userId is required' };
    }

    complianceManager.recordConsent(body.userId, body.given ?? true);
    auditLogger.log('consent_recorded', 'compliance', 'success', body.userId, {
      consentGiven: body.given,
    });

    return {
      userId: body.userId,
      consentGiven: body.given ?? true,
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/compliance/consent/:userId', {
    schema: {
      tags: ['Compliance'],
      summary: 'Check user consent',
      description: 'Retrieve GDPR/CCPA consent status for a user',
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'User identifier' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            hasConsent: { type: 'boolean' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'userId is required' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const params = request.params as { userId: string };
    
    if (!params?.userId) {
      reply.status(400);
      return { error: 'userId is required' };
    }

    const hasConsent = complianceManager.hasConsent(params.userId);
    auditLogger.log('consent_check', 'compliance', 'success', params.userId);

    return {
      userId: params.userId,
      hasConsent,
      timestamp: new Date().toISOString(),
    };
  });

  app.post('/compliance/data-export', {
    schema: {
      tags: ['Compliance'],
      summary: 'Request user data export',
      description: 'Export all user data in GDPR/CCPA compliant format (requires authentication)',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            exportDate: { type: 'string', format: 'date-time' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Data export not allowed' },
          },
        },
      },
    },
  }, async (request, reply) => {
    let user: { userId: string; email: string };
    try {
      user = getBearerUser(request.headers.authorization);
    } catch {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    if (!complianceManager.getComplianceStatus().allowDataExport) {
      reply.status(403);
      return { error: 'Data export not allowed' };
    }

    try {
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!userData) {
        reply.status(404);
        return { error: 'User not found' };
      }

      const exportData = complianceManager.generateDataExport(user.userId, userData);
      auditLogger.log('data_export', 'gdpr', 'success', user.userId);

      return JSON.parse(exportData);
    } catch (error) {
      reply.status(500);
      return {
        error: error instanceof Error ? error.message : 'Unable to export data',
      };
    }
  });

  app.post('/compliance/data-delete', async (request, reply) => {
    let user: { userId: string; email: string };
    try {
      user = getBearerUser(request.headers.authorization);
    } catch {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    if (!complianceManager.canDeleteUserData(user.userId)) {
      reply.status(403);
      return {
        error: 'User data deletion not allowed. Please ensure consent is given.',
      };
    }

    try {
      // Delete user and all associated data
      const deletedUser = await prisma.user.delete({
        where: { id: user.userId },
      });

      auditLogger.log('user_deletion', 'gdpr', 'success', user.userId, {
        email: deletedUser.email,
      });

      return {
        success: true,
        message: 'User data successfully deleted',
        deletedUserId: user.userId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      reply.status(500);
      return {
        error: error instanceof Error ? error.message : 'Unable to delete user data',
      };
    }
  });

  app.get('/compliance/access-log', async (request, reply) => {
    let user: { userId: string; email: string };
    try {
      user = getBearerUser(request.headers.authorization);
    } catch {
      reply.status(401);
      return { error: 'Unauthorized' };
    }

    const accessLog = complianceManager.getAccessLog(user.userId);
    return {
      userId: user.userId,
      accessLog,
      totalAccessEvents: accessLog.length,
    };
  });

  app.get('/compliance/status', async () => {
    const status = complianceManager.getComplianceStatus();
    return {
      gdpr: { enabled: status.gdprEnabled },
      ccpa: { enabled: status.ccpaEnabled },
      dataRetentionDays: status.dataRetentionDays,
      features: {
        consentRequired: status.requireConsentBefore,
        dataExportAllowed: status.allowDataExport,
        dataDeletionAllowed: status.allowDataDeletion,
      },
      timestamp: new Date().toISOString(),
    };
  });

  app.post('/auth/register', async (request, reply) => {
    const body = request.body as AuthRequest;
    
    if (!body?.email || !body?.password) {
      reply.status(400);
      return { error: 'email and password are required' };
    }

    // Validate input
    if (!InputValidator.isValidEmail(body.email)) {
      reply.status(400);
      auditLogger.log('invalid_email', 'auth', 'failure', undefined, { email: body.email });
      return { error: 'Invalid email format' };
    }

    if (!InputValidator.isStrongPassword(body.password)) {
      reply.status(400);
      auditLogger.log('weak_password', 'auth', 'failure', undefined, { email: body.email });
      return {
        error: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character',
      };
    }

    // Check for injection attempts
    if (InputValidator.isSQLInjectionAttempt(body.email)) {
      reply.status(400);
      auditLogger.log('sql_injection_attempt', 'auth', 'failure', undefined, { input: 'email' });
      return { error: 'Invalid input detected' };
    }

    try {
      const result = await authService.register(body.email, body.password);
      auditLogger.log('user_registration', 'auth', 'success', result.user.id);
      return result;
    } catch (error) {
      reply.status(409);
      auditLogger.log('registration_failed', 'auth', 'failure', undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { error: error instanceof Error ? error.message : 'Unable to register' };
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const body = request.body as AuthRequest;
    if (!body?.email || !body?.password) {
      reply.status(400);
      return { error: 'email and password are required' };
    }

    // Validate input
    if (!InputValidator.isValidEmail(body.email)) {
      reply.status(400);
      auditLogger.log('invalid_email_login', 'auth', 'failure', undefined, { email: body.email });
      return { error: 'Invalid email format' };
    }

    // Check for injection attempts
    if (InputValidator.isSQLInjectionAttempt(body.email) ||
        InputValidator.isSQLInjectionAttempt(body.password)) {
      reply.status(400);
      auditLogger.log('sql_injection_attempt', 'auth', 'failure', undefined, { 
        action: 'login' 
      });
      return { error: 'Invalid input detected' };
    }

    try {
      const result = await authService.login(body.email, body.password);
      auditLogger.log('user_login', 'auth', 'success', result.user.id);
      return result;
    } catch (error) {
      reply.status(401);
      auditLogger.log('login_failed', 'auth', 'failure', undefined, {
        email: body.email,
      });
      return { error: error instanceof Error ? error.message : 'Invalid credentials' };
    }
  });

  app.post('/ai/process', async (request, reply) => {
    const body = request.body as { input?: string };

    if (!body?.input || !body.input.trim()) {
      reply.status(400);
      return { error: 'input is required' };
    }

    // Validate input length (max 10000 characters)
    if (!InputValidator.isValidLength(body.input, 1, 10000)) {
      reply.status(400);
      return { error: 'Input must be between 1 and 10000 characters' };
    }

    // Check for injection attempts
    if (InputValidator.isSQLInjectionAttempt(body.input)) {
      auditLogger.log('sql_injection_attempt', 'ai/process', 'failure');
      reply.status(400);
      return { error: 'Invalid input detected' };
    }

    // Sanitize the input
    const sanitizedInput = InputValidator.sanitize(body.input);

    try {
      const result = await aiCore.process(sanitizedInput);
      auditLogger.log('ai_process', 'ai', 'success');
      return { result };
    } catch (error) {
      auditLogger.log('ai_process_error', 'ai', 'failure', undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      reply.status(500);
      return { error: 'Unable to process request' };
    }
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

  // Advanced Model Gateway endpoints
  app.get('/ai/models', async () => {
    const models = modelGateway.listAvailableModels();
    const response: Record<string, string[]> = {};

    for (const [provider, modelList] of models) {
      response[provider] = modelList;
    }

    return { providers: response };
  });

  app.get('/ai/gateway/health', async () => {
    const health = modelGateway.getHealthStatus();

    return {
      gatewayStatus: 'operational',
      providers: health.map((status) => ({
        provider: status.provider,
        healthy: status.healthy,
        lastChecked: status.lastChecked,
        stats: {
          successCount: status.successCount,
          errorCount: status.errorCount,
        },
      })),
      timestamp: new Date().toISOString(),
    };
  });

  app.post('/ai/advanced-process', async (request, reply) => {
    const body = request.body as {
      input: string;
      model?: string;
      provider?: string;
    };

    if (!body?.input || !body.input.trim()) {
      reply.status(400);
      return { error: 'input is required' };
    }

    const modelToUse = body.model ?? 'gpt-4o-mini';

    try {
      // Route to appropriate provider
      const route = await modelGateway.routeRequest(modelToUse);

      // Record that we're using this provider
      modelGateway.recordSuccess(route.provider);

      // Process with AICore for now, in production would call actual provider
      const result = await aiCore.process(body.input);

      return {
        result,
        routing: {
          provider: route.provider,
          model: route.model,
          endpoint: route.endpoint,
        },
      };
    } catch (error) {
      reply.status(503);
      return {
        error: error instanceof Error ? error.message : 'Service unavailable',
      };
    }
  });

  // ==================== ADMIN ENDPOINTS (RBAC Protected) ====================
  
  /**
   * Admin Dashboard - Requires ADMIN or SUPER_ADMIN role
   * GET /admin/dashboard
   */
  app.get('/admin/dashboard', {
    schema: {
      tags: ['Admin'],
      summary: 'Admin dashboard statistics',
      description: 'Get dashboard statistics (requires ADMIN or SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
            stats: {
              type: 'object',
              properties: {
                totalUsers: { type: 'number' },
                activeUsers: { type: 'number' },
                cacheStats: { type: 'object' },
              },
            },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    try {
      const checkAdmin = requireRole('ADMIN', 'SUPER_ADMIN');
      const user = checkAdmin(request.headers.authorization);
      
      // Get system statistics
      const totalUsers = await prisma.user.count();
      const cacheStats = cache.getStats();
      
      return {
        message: 'Admin dashboard data',
        user,
        stats: {
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.4), // Mock active users
          cacheStats,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        reply.status(403);
        return { error: error.message };
      }
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * List All Users - Requires ADMIN role
   * GET /admin/users
   */
  app.get('/admin/users', {
    schema: {
      tags: ['Admin'],
      summary: 'List all users',
      description: 'Get list of all users (requires ADMIN or SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1, minimum: 1 },
          limit: { type: 'number', default: 10, minimum: 1, maximum: 100 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
              },
            },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    try {
      const checkAdmin = requireRole('ADMIN', 'SUPER_ADMIN');
      checkAdmin(request.headers.authorization);
      
      const query = request.query as { page?: number; limit?: number };
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);
      
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        reply.status(403);
        return { error: error.message };
      }
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * System Statistics - Requires MODERATOR or higher
   * GET /admin/stats
   */
  app.get('/admin/stats', {
    schema: {
      tags: ['Admin'],
      summary: 'System statistics',
      description: 'Get system statistics (requires MODERATOR, ADMIN, or SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            cache: { type: 'object' },
            memory: { type: 'object' },
            uptime: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    try {
      const checkModerator = requireRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN');
      checkModerator(request.headers.authorization);
      
      return {
        cache: cache.getStats(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        reply.status(403);
        return { error: error.message };
      }
      reply.status(401);
      return { error: 'Unauthorized' };
    }
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
    modelGateway: createModelGateway(),
  };

  const app = await buildApp(finalContext);

  await app.listen({ port, host: '0.0.0.0' });

  return { app, prisma };
}
