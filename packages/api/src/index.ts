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
import { MultiLayerCache } from './services/caching/cache';
import { registerHttpCachingMiddleware } from './services/caching/invalidation';
import { 
  TenantService, 
  TenantContextManager, 
  createTenantMiddleware,
  requireTenantMiddleware,
  createTenantScopedPrisma,
  type TenantContext 
} from './services/multi-tenancy';
import {
  AnalyticsService,
  createAnalyticsMiddleware,
  type EventData,
  type AnalyticsQuery,
  type ReportOptions,
} from './services/analytics';
import {
  NotificationService,
  notificationEmitter,
  type CreateNotificationData,
  type NotificationQuery,
  type UpdatePreferencesData,
} from './services/notifications';
import { FileStorageService } from './services/file-storage';
import { AuditLoggingService } from './services/audit-logging';
import { AdvancedSearchService } from './services/search';
import { WebhookService } from './services/webhooks';
import { ZeroAIStore } from './services/zeroai/zeroai-store';
import workflowRoutes from './routes/workflows.routes';
import { typeDefs, resolvers } from './graphql';
import { AuthRequest, WorkspaceRecommendationRequest } from './types';
import { swaggerOptions, swaggerUiOptions } from './config/swagger.config';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import path from 'node:path';

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
  const execFileAsync = promisify(execFile);

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
  const cache = context?.cache || new MultiLayerCache(100 * 1024 * 1024); // 100MB L1
  
  // Register HTTP response caching middleware
  await registerHttpCachingMiddleware(app, cache);

  // Initialize Prisma client (needed for tenant service and auth)
  const prisma = context?.prisma || new PrismaClient();
  
  // Initialize multi-tenancy system
  const tenantService = new TenantService(prisma);
  const tenantContextManager = new TenantContextManager(tenantService);
  
  // Register tenant middleware (optional - extracts tenant context if available)
  const tenantMiddleware = createTenantMiddleware(tenantContextManager);
  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/zeroai') || request.url.startsWith('/n8n')) {
      return;
    }

    return tenantMiddleware(request, reply);
  });

  // Initialize analytics system
  const analyticsService = new AnalyticsService(prisma);
  const analyticsMiddleware = createAnalyticsMiddleware(analyticsService);

  // Local ZeroAI routes remain usable without a PostgreSQL connection.
  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/zeroai') || request.url.startsWith('/n8n')) {
      return;
    }

    return analyticsMiddleware(request, reply);
  });

  // Initialize notification system
  const notificationService = new NotificationService(prisma);

  // Initialize file storage system
  const fileStorageService = new FileStorageService(prisma);

  // Initialize audit logging system
  const auditLoggingService = new AuditLoggingService(prisma);

  // Initialize advanced search system
  const advancedSearchService = new AdvancedSearchService(prisma);

  // Initialize webhook system
  const webhookService = new WebhookService(prisma);
  const zeroAIStore = new ZeroAIStore();
  const zeroAIBridgeScript = path.resolve(process.cwd(), '../../wsl-ai-stack/scripts/openclaw-bridge.sh');

  function buildLocalFallbackResponse(prompt: string, error: unknown): string {
    const errorText = error instanceof Error ? error.message : 'Unable to reach the local bridge';
    const normalizedPrompt = prompt.toLowerCase();

    if (normalizedPrompt.includes('workflow') || normalizedPrompt.includes('run')) {
      return `ZeroAI is operating in local fallback mode because the local model bridge could not be reached. You can still use the workflow builder from the dashboard to run shell tasks manually. Details: ${errorText}`;
    }

    if (normalizedPrompt.includes('state') || normalizedPrompt.includes('status') || normalizedPrompt.includes('health')) {
      return `ZeroAI is running in local fallback mode while the model bridge is unavailable. The dashboard, workflow builder, memory, and traces remain available. The current local status is: API reachable, UI reachable, OpenClaw bridge degraded. Details: ${errorText}`;
    }

    return `ZeroAI is running in local fallback mode because the local model bridge could not be reached. The UI and workflow tools are still available, so you can keep inspecting state, running workflows, and reviewing traces while the bridge is repaired. Details: ${errorText}`;
  }

  await app.register(workflowRoutes);

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

  app.get('/zeroai/state', async () => {
    return zeroAIStore.getState();
  });

  app.get('/zeroai/memory', async () => {
    return { memory: zeroAIStore.getMemory() };
  });

  app.get('/zeroai/workflows', async () => {
    return { workflows: zeroAIStore.getWorkflows() };
  });

  app.post('/zeroai/message', async (request, reply) => {
    const body = request.body as { prompt?: string; source?: 'text' | 'voice' };

    if (!body?.prompt || !body.prompt.trim()) {
      reply.status(400);
      return { error: 'prompt is required' };
    }

    const prompt = InputValidator.sanitize(body.prompt.trim());
    zeroAIStore.appendMemory({
      role: 'user',
      channel: body.source === 'voice' ? 'voice' : 'text',
      content: prompt,
    });
    zeroAIStore.appendTrace({
      kind: 'interaction',
      title: 'Prompt received',
      summary: `Incoming prompt via ${body.source === 'voice' ? 'voice' : 'text'}`,
      detail: prompt,
      route: 'local-ingress',
    });

    try {
      const { stdout } = await execFileAsync('bash', [zeroAIBridgeScript, prompt], {
        maxBuffer: 1024 * 1024,
        timeout: 8000,
        env: {
          ...process.env,
          OPENCLAW_MODE: 'infer',
        },
      });

      const responseText = String(stdout || '').trim() || 'ZeroAI routed the prompt successfully.';
      zeroAIStore.appendMemory({
        role: 'assistant',
        channel: 'system',
        content: responseText,
      });
      zeroAIStore.appendTrace({
        kind: 'interaction',
        title: 'Route completed',
        summary: 'OpenClaw bridge returned an answer',
        detail: responseText,
        route: 'openclaw-bridge',
      });
      zeroAIStore.setHealth({ openclaw: 'ready', localModel: 'ready' });
      zeroAIStore.recordInteraction(prompt, responseText, 'openclaw-bridge');

      return {
        prompt,
        response: responseText,
        route: 'openclaw-bridge',
        state: zeroAIStore.getState(),
      };
    } catch (error) {
      const fallback = buildLocalFallbackResponse(prompt, error);
      zeroAIStore.appendMemory({
        role: 'assistant',
        channel: 'system',
        content: fallback,
      });
      zeroAIStore.appendTrace({
        kind: 'system',
        title: 'Fallback route used',
        summary: 'OpenClaw bridge was unavailable; local fallback engaged',
        detail: fallback,
        route: 'local-fallback',
      });
      zeroAIStore.setHealth({ openclaw: 'degraded', localModel: 'degraded' });
      zeroAIStore.recordInteraction(prompt, fallback, 'local-fallback');
      return {
        prompt,
        response: fallback,
        route: 'local-fallback',
        state: zeroAIStore.getState(),
      };
    }
  });

  app.post('/zeroai/workflows', async (request, reply) => {
    const body = request.body as { id?: string; name?: string; description?: string; command?: string };

    if (!body?.name?.trim() || !body?.command?.trim()) {
      reply.status(400);
      return { error: 'name and command are required' };
    }

    zeroAIStore.appendTrace({
      kind: 'workflow',
      title: 'Workflow definition captured',
      summary: body.name.trim(),
      detail: body.command.trim(),
      route: 'zeroai-workflow-api',
    });

    const workflow = zeroAIStore.upsertWorkflow({
      ...(body.id ? { id: body.id } : {}),
      name: body.name.trim(),
      description: body.description?.trim(),
      command: body.command.trim(),
      status: 'ready',
    });

    return { workflow };
  });

  app.post('/zeroai/workflows/:id/run', async (request, reply) => {
    const params = request.params as { id: string };
    const workflow = zeroAIStore.getWorkflows().find((item) => item.id === params.id);

    if (!workflow) {
      reply.status(404);
      return { error: 'workflow not found' };
    }

    zeroAIStore.setWorkflowStatus(workflow.id, 'running');
    zeroAIStore.appendTrace({
      kind: 'workflow',
      title: 'Workflow execution started',
      summary: workflow.name,
      detail: workflow.command,
      route: 'workflow-runner',
    });

    try {
      const { stdout } = await execFileAsync('bash', ['-lc', workflow.command], {
        maxBuffer: 1024 * 1024,
        timeout: 12000,
        env: process.env,
      });

      const output = String(stdout || '').trim() || 'Workflow completed.';
      const updated = zeroAIStore.setWorkflowStatus(workflow.id, 'complete', output);
      zeroAIStore.appendMemory({
        role: 'assistant',
        channel: 'workflow',
        content: `${workflow.name}: ${output}`,
      });

      return {
        workflow: updated,
        output,
      };
    } catch (error) {
      const output = error instanceof Error ? error.message : 'Workflow execution failed';
      const updated = zeroAIStore.setWorkflowStatus(workflow.id, 'failed', output);
      zeroAIStore.appendMemory({
        role: 'assistant',
        channel: 'workflow',
        content: `${workflow.name}: ${output}`,
      });
      reply.status(500);

      return {
        workflow: updated,
        output,
      };
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

  // ==================== TENANT MANAGEMENT ENDPOINTS (Multi-Tenancy) ====================
  
  /**
   * Create New Tenant - Requires SUPER_ADMIN
   * POST /tenants
   */
  app.post('/tenants', {
    schema: {
      tags: ['Tenants'],
      summary: 'Create new tenant',
      description: 'Create a new tenant organization (requires SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Tenant name' },
          slug: { type: 'string', description: 'Tenant URL slug (auto-generated if not provided)' },
          domain: { type: 'string', description: 'Custom domain' },
          plan: { type: 'string', enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] },
          maxUsers: { type: 'number', description: 'Maximum users allowed' },
          maxStorage: { type: 'number', description: 'Maximum storage in bytes' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            domain: { type: 'string' },
            status: { type: 'string' },
            plan: { type: 'string' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
        403: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    try {
      const checkSuperAdmin = requireRole('SUPER_ADMIN');
      checkSuperAdmin(request.headers.authorization);

      const body = request.body as any;
      const tenant = await tenantService.createTenant({
        name: body.name,
        slug: body.slug,
        domain: body.domain,
        plan: body.plan,
        maxUsers: body.maxUsers,
        maxStorage: body.maxStorage,
        settings: body.settings,
      });

      reply.status(201);
      return tenant;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        reply.status(403);
        return { error: error.message };
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        reply.status(400);
        return { error: error.message };
      }
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * List All Tenants - Requires SUPER_ADMIN
   * GET /tenants
   */
  app.get('/tenants', {
    schema: {
      tags: ['Tenants'],
      summary: 'List all tenants',
      description: 'Get list of all tenant organizations (requires SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED'] },
          plan: { type: 'string', enum: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'] },
          skip: { type: 'number', default: 0 },
          take: { type: 'number', default: 50 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tenants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  status: { type: 'string' },
                  plan: { type: 'string' },
                },
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
      const checkSuperAdmin = requireRole('SUPER_ADMIN');
      checkSuperAdmin(request.headers.authorization);

      const query = request.query as any;
      const tenants = await tenantService.listTenants({
        status: query.status,
        plan: query.plan,
        skip: query.skip,
        take: query.take,
      });

      return { tenants };
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
   * Get Tenant Details - Requires SUPER_ADMIN or tenant membership
   * GET /tenants/:tenantId
   */
  app.get('/tenants/:tenantId', {
    schema: {
      tags: ['Tenants'],
      summary: 'Get tenant details',
      description: 'Get detailed information about a tenant',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tenantId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tenant: { type: 'object' },
            stats: {
              type: 'object',
              properties: {
                userCount: { type: 'number' },
                storageUsed: { type: 'number' },
                isOverLimit: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      getBearerUser(request.headers.authorization); // Verify auth

      const params = request.params as { tenantId: string };
      const tenant = await tenantService.getTenantById(params.tenantId);
      
      if (!tenant) {
        reply.status(404);
        return { error: 'Tenant not found' };
      }

      const stats = await tenantService.getTenantStats(params.tenantId);

      return { tenant, stats };
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Update Tenant - Requires SUPER_ADMIN
   * PATCH /tenants/:tenantId
   */
  app.patch('/tenants/:tenantId', {
    schema: {
      tags: ['Tenants'],
      summary: 'Update tenant',
      description: 'Update tenant configuration (requires SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tenantId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          domain: { type: 'string' },
          plan: { type: 'string' },
          maxUsers: { type: 'number' },
          maxStorage: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const checkSuperAdmin = requireRole('SUPER_ADMIN');
      checkSuperAdmin(request.headers.authorization);

      const params = request.params as { tenantId: string };
      const body = request.body as any;

      const tenant = await tenantService.updateTenant(params.tenantId, body);
      return tenant;
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
   * Suspend Tenant - Requires SUPER_ADMIN
   * POST /tenants/:tenantId/suspend
   */
  app.post('/tenants/:tenantId/suspend', {
    schema: {
      tags: ['Tenants'],
      summary: 'Suspend tenant',
      description: 'Suspend tenant access (requires SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tenantId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const checkSuperAdmin = requireRole('SUPER_ADMIN');
      checkSuperAdmin(request.headers.authorization);

      const params = request.params as { tenantId: string };
      const tenant = await tenantService.suspendTenant(params.tenantId);
      
      return { message: 'Tenant suspended', tenant };
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
   * Activate Tenant - Requires SUPER_ADMIN
   * POST /tenants/:tenantId/activate
   */
  app.post('/tenants/:tenantId/activate', {
    schema: {
      tags: ['Tenants'],
      summary: 'Activate tenant',
      description: 'Activate suspended tenant (requires SUPER_ADMIN role)',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tenantId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const checkSuperAdmin = requireRole('SUPER_ADMIN');
      checkSuperAdmin(request.headers.authorization);

      const params = request.params as { tenantId: string };
      const tenant = await tenantService.activateTenant(params.tenantId);
      
      return { message: 'Tenant activated', tenant };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        reply.status(403);
        return { error: error.message };
      }
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  // ============================================================================
  // Analytics Endpoints
  // ============================================================================

  /**
   * Track Custom Event
   * POST /analytics/events
   */
  app.post('/analytics/events', {
    schema: {
      tags: ['Analytics'],
      summary: 'Track custom event',
      description: 'Track a custom analytics event for the current tenant',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        required: ['eventType', 'eventName'],
        properties: {
          eventType: {
            type: 'string',
            enum: ['PAGE_VIEW', 'API_CALL', 'USER_ACTION', 'SYSTEM_EVENT', 'ERROR', 'AUTH', 'SEARCH', 'EXPORT', 'CUSTOM'],
          },
          eventName: { type: 'string' },
          severity: { type: 'string', enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] },
          path: { type: 'string' },
          method: { type: 'string' },
          statusCode: { type: 'number' },
          duration: { type: 'number' },
          metadata: { type: 'object' },
          success: { type: 'boolean' },
        },
      },
      response: {
        200: {
          description: 'Event tracked successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const eventData = request.body as EventData;
      const event = await analyticsService.trackEvent(tenantId, user.userId, eventData);
      
      return { id: event.id, timestamp: event.timestamp };
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Get Analytics Events
   * GET /analytics/events
   */
  app.get('/analytics/events', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get analytics events',
      description: 'Retrieve analytics events with filtering options',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          eventType: { type: 'string' },
          eventName: { type: 'string' },
          userId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          limit: { type: 'number', default: 100 },
          offset: { type: 'number', default: 0 },
        },
      },
      response: {
        200: {
          description: 'Analytics events retrieved',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              eventType: { type: 'string' },
              eventName: { type: 'string' },
              timestamp: { type: 'string' },
              userId: { type: 'string' },
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const query = request.query as AnalyticsQuery & { startDate?: string; endDate?: string };
      const parsedQuery: AnalyticsQuery = {
        ...query,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const events = await analyticsService.getEvents(tenantId, parsedQuery);
      return events;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Get Dashboard Statistics
   * GET /analytics/dashboard
   */
  app.get('/analytics/dashboard', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get dashboard statistics',
      description: 'Get comprehensive dashboard statistics for the current tenant',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          description: 'Dashboard statistics',
          type: 'object',
          properties: {
            totalEvents: { type: 'number' },
            totalUsers: { type: 'number' },
            activeUsers: { type: 'number' },
            errorRate: { type: 'number' },
            avgResponseTime: { type: 'number' },
            topEvents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  eventName: { type: 'string' },
                  count: { type: 'number' },
                },
              },
            },
            topPages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  views: { type: 'number' },
                },
              },
            },
            userGrowth: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  count: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const stats = await analyticsService.getDashboardStats(tenantId);
      return stats;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Get User Activities
   * GET /analytics/activities
   */
  app.get('/analytics/activities', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get user activities',
      description: 'Retrieve user activity log with change tracking',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          limit: { type: 'number', default: 50 },
        },
      },
      response: {
        200: {
          description: 'User activities',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              action: { type: 'string' },
              resource: { type: 'string' },
              resourceId: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const query = request.query as { userId?: string; limit?: number };
      const activities = await analyticsService.getUserActivities(
        tenantId,
        query.userId,
        query.limit
      );
      
      return activities;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Generate Analytics Report
   * GET /analytics/report
   */
  app.get('/analytics/report', {
    schema: {
      tags: ['Analytics'],
      summary: 'Generate analytics report',
      description: 'Generate custom analytics report in JSON or CSV format',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['json', 'csv'], default: 'json' },
          eventType: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          includeMetadata: { type: 'boolean', default: false },
        },
      },
      response: {
        200: {
          description: 'Analytics report',
          type: 'string',
        },
      },
    },
  }, async (request, reply) => {
    try {
      getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const query = request.query as AnalyticsQuery & ReportOptions & {
        startDate?: string;
        endDate?: string;
      };

      const reportQuery: AnalyticsQuery = {
        eventType: query.eventType as any,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const reportOptions: ReportOptions = {
        format: query.format || 'json',
        includeMetadata: query.includeMetadata,
      };

      const report = await analyticsService.generateReport(tenantId, reportQuery, reportOptions);

      if (reportOptions.format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename="analytics-report.csv"');
      }

      return report;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Get Event Count by Type
   * GET /analytics/events/count-by-type
   */
  app.get('/analytics/events/count-by-type', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get event count by type',
      description: 'Get aggregated event count grouped by event type',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        200: {
          description: 'Event counts by type',
          type: 'object',
        },
      },
    },
  }, async (request, reply) => {
    try {
      getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const query = request.query as { startDate?: string; endDate?: string };
      const counts = await analyticsService.getEventCountByType(
        tenantId,
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      );
      
      return counts;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Clean Old Analytics Data - Requires ADMIN
   * DELETE /analytics/cleanup
   */
  app.delete('/analytics/cleanup', {
    schema: {
      tags: ['Analytics'],
      summary: 'Clean old analytics data',
      description: 'Delete analytics events older than specified days (requires ADMIN role)',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          daysToKeep: { type: 'number', default: 90 },
        },
      },
      response: {
        200: {
          description: 'Cleanup complete',
          type: 'object',
          properties: {
            message: { type: 'string' },
            deletedCount: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const checkAdmin = requireRole('ADMIN');
      checkAdmin(request.headers.authorization);

      const query = request.query as { daysToKeep?: number };
      const deletedCount = await analyticsService.cleanOldData(query.daysToKeep || 90);
      
      return {
        message: 'Analytics data cleanup completed',
        deletedCount,
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

  // ============================================================================
  // Notification Endpoints
  // ============================================================================

  /**
   * Get Notifications
   * GET /notifications
   */
  app.get('/notifications', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get notifications',
      description: 'Retrieve notifications for the current user with filtering options',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          priority: { type: 'string' },
          isRead: { type: 'boolean' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
        },
      },
      response: {
        200: {
          description: 'List of notifications',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' },
              title: { type: 'string' },
              message: { type: 'string' },
              isRead: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const query = request.query as NotificationQuery;
      const notifications = await notificationService.getNotifications(tenantId, {
        ...query,
        userId: user.userId,
      });
      
      return notifications;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Get Unread Count
   * GET /notifications/unread-count
   */
  app.get('/notifications/unread-count', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get unread notification count',
      description: 'Get the number of unread notifications for the current user',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          description: 'Unread count',
          type: 'object',
          properties: {
            count: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const count = await notificationService.getUnreadCount(tenantId, user.userId);
      return { count };
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Get Notification Statistics
   * GET /notifications/stats
   */
  app.get('/notifications/stats', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get notification statistics',
      description: 'Get comprehensive notification statistics for the current user',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          description: 'Notification statistics',
          type: 'object',
          properties: {
            total: { type: 'number' },
            unread: { type: 'number' },
            byType: { type: 'object' },
            byPriority: { type: 'object' },
            recentCount: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const stats = await notificationService.getStats(tenantId, user.userId);
      return stats;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Mark Notification as Read
   * PATCH /notifications/:id/read
   */
  app.patch('/notifications/:id/read', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark notification as read',
      description: 'Mark a specific notification as read',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Notification marked as read',
          type: 'object',
          properties: {
            id: { type: 'string' },
            isRead: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      const params = request.params as { id: string };
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const notification = await notificationService.markAsRead(tenantId, params.id, user.userId);
      return { id: notification.id, isRead: notification.isRead };
    } catch (error) {
      reply.status(404);
      return { error: 'Notification not found' };
    }
  });

  /**
   * Mark All Notifications as Read
   * PATCH /notifications/mark-all-read
   */
  app.patch('/notifications/mark-all-read', {
    schema: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      description: 'Mark all unread notifications as read for the current user',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          description: 'All notifications marked as read',
          type: 'object',
          properties: {
            message: { type: 'string' },
            count: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const count = await notificationService.markAllAsRead(tenantId, user.userId);
      return { message: 'All notifications marked as read', count };
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Archive Notification
   * PATCH /notifications/:id/archive
   */
  app.patch('/notifications/:id/archive', {
    schema: {
      tags: ['Notifications'],
      summary: 'Archive notification',
      description: 'Archive a notification',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Notification archived',
          type: 'object',
          properties: {
            id: { type: 'string' },
            isArchived: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      const params = request.params as { id: string };
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const notification = await notificationService.archive(tenantId, params.id, user.userId);
      return { id: notification.id, isArchived: notification.isArchived };
    } catch (error) {
      reply.status(404);
      return { error: 'Notification not found' };
    }
  });

  /**
   * Delete Notification
   * DELETE /notifications/:id
   */
  app.delete('/notifications/:id', {
    schema: {
      tags: ['Notifications'],
      summary: 'Delete notification',
      description: 'Delete a notification',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'Notification deleted',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      const params = request.params as { id: string };
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      await notificationService.delete(tenantId, params.id, user.userId);
      return { message: 'Notification deleted' };
    } catch (error) {
      reply.status(404);
      return { error: 'Notification not found' };
    }
  });

  /**
   * Get Notification Preferences
   * GET /notifications/preferences
   */
  app.get('/notifications/preferences', {
    schema: {
      tags: ['Notifications'],
      summary: 'Get notification preferences',
      description: 'Get notification preferences for the current user',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          description: 'Notification preferences',
          type: 'object',
          properties: {
            enableInApp: { type: 'boolean' },
            enableEmail: { type: 'boolean' },
            enablePush: { type: 'boolean' },
            enableSMS: { type: 'boolean' },
            mutedTypes: { type: 'array', items: { type: 'string' } },
            quietHoursStart: { type: 'number' },
            quietHoursEnd: { type: 'number' },
            emailDigest: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const preferences = await notificationService.getOrCreatePreferences(tenantId, user.userId);
      return preferences;
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Update Notification Preferences
   * PATCH /notifications/preferences
   */
  app.patch('/notifications/preferences', {
    schema: {
      tags: ['Notifications'],
      summary: 'Update notification preferences',
      description: 'Update notification preferences for the current user',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          enableInApp: { type: 'boolean' },
          enableEmail: { type: 'boolean' },
          enablePush: { type: 'boolean' },
          enableSMS: { type: 'boolean' },
          mutedTypes: { type: 'array', items: { type: 'string' } },
          quietHoursStart: { type: 'number', minimum: 0, maximum: 23 },
          quietHoursEnd: { type: 'number', minimum: 0, maximum: 23 },
          quietHoursTimezone: { type: 'string' },
          emailDigest: { type: 'boolean' },
          digestTime: { type: 'number', minimum: 0, maximum: 23 },
        },
      },
      response: {
        200: {
          description: 'Preferences updated',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const updates = request.body as UpdatePreferencesData;
      await notificationService.updatePreferences(tenantId, user.userId, updates);
      
      return { message: 'Preferences updated successfully' };
    } catch (error) {
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  /**
   * Broadcast Notification - Requires ADMIN
   * POST /notifications/broadcast
   */
  app.post('/notifications/broadcast', {
    schema: {
      tags: ['Notifications'],
      summary: 'Broadcast notification to all users',
      description: 'Send notification to all users in the tenant (requires ADMIN role)',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'message'],
        properties: {
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string' },
          priority: { type: 'string' },
          excludeUserIds: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: {
          description: 'Broadcast sent',
          type: 'object',
          properties: {
            message: { type: 'string' },
            count: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const checkAdmin = requireRole('ADMIN');
      checkAdmin(request.headers.authorization);
      
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const body = request.body as any;
      const count = await notificationService.broadcastToTenant(
        tenantId,
        body.title,
        body.message,
        {
          type: body.type,
          priority: body.priority,
          excludeUserIds: body.excludeUserIds,
        }
      );
      
      return { message: 'Broadcast sent successfully', count };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        reply.status(403);
        return { error: error.message };
      }
      reply.status(401);
      return { error: 'Unauthorized' };
    }
  });

  // ============================================================================
  // File Storage Endpoints (Phase 13)
  // ============================================================================

  /**
   * Upload File
   * POST /files
   */
  app.post('/files', {
    schema: {
      tags: ['Files'],
      summary: 'Upload a file',
      description: 'Upload a file to storage with optional metadata and description',
      security: [{ BearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          description: 'File uploaded successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            size: { type: 'number' },
            mimeType: { type: 'string' },
            storageUrl: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      // TODO: Handle multipart form data
      // This is a placeholder - implement proper file handling
      const body = request.body as any;
      
      const file = await fileStorageService.uploadFile(
        tenantId,
        user.userId,
        {
          name: body.name,
          mimeType: body.mimeType,
          content: Buffer.from(body.content || ''),
          description: body.description,
          isPublic: body.isPublic || false,
          metadata: body.metadata,
        }
      );
      
      reply.status(201);
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        storageUrl: file.storageUrl,
      };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  });

  /**
   * List Files
   * GET /files
   */
  app.get('/files', {
    schema: {
      tags: ['Files'],
      summary: 'List files',
      description: 'Get list of files for current user with optional filters',
      security: [{ BearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          limit: { type: 'number' },
          offset: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'List of files',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              size: { type: 'number' },
              mimeType: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const query = request.query as any;
      const files = await fileStorageService.getFiles(tenantId, {
        userId: user.userId,
        limit: query.limit || 50,
        offset: query.offset || 0,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });
      
      return files.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        status: f.status,
        createdAt: f.createdAt,
      }));
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to list files' };
    }
  });

  /**
   * Get File
   * GET /files/:id
   */
  app.get('/files/:id', {
    schema: {
      tags: ['Files'],
      summary: 'Get file details',
      description: 'Get detailed information about a specific file',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          description: 'File details',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            size: { type: 'number' },
            mimeType: { type: 'string' },
            status: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      const params = request.params as any;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const file = await fileStorageService.getFile(tenantId, params.id, user.userId);
      
      if (!file) {
        reply.status(404);
        return { error: 'File not found' };
      }
      
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        status: file.status,
        description: file.description,
        createdAt: file.createdAt,
      };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to get file' };
    }
  });

  /**
   * Update File
   * PATCH /files/:id
   */
  app.patch('/files/:id', {
    schema: {
      tags: ['Files'],
      summary: 'Update file metadata',
      description: 'Update file name, description, or visibility settings',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          isPublic: { type: 'boolean' },
        },
      },
      response: {
        200: {
          description: 'File updated',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      const params = request.params as any;
      const body = request.body as any;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const file = await fileStorageService.updateFile(
        tenantId,
        params.id,
        user.userId,
        {
          name: body.name,
          description: body.description,
          isPublic: body.isPublic,
        }
      );
      
      return {
        id: file.id,
        name: file.name,
        updatedAt: file.updatedAt,
      };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to update file' };
    }
  });

  /**
   * Delete File
   * DELETE /files/:id
   */
  app.delete('/files/:id', {
    schema: {
      tags: ['Files'],
      summary: 'Delete file',
      description: 'Soft delete a file (can be recovered from backup)',
      security: [{ BearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        204: {
          type: 'null',
          description: 'File deleted',
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      const params = request.params as any;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      await fileStorageService.deleteFile(tenantId, params.id, user.userId);
      reply.status(204);
      return null;
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to delete file' };
    }
  });

  /**
   * Get Storage Quota
   * GET /files/quota
   */
  app.get('/files/quota', {
    schema: {
      tags: ['Files'],
      summary: 'Get storage quota',
      description: 'Get current storage usage and quota limits',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          description: 'Storage statistics',
          type: 'object',
          properties: {
            totalFiles: { type: 'number' },
            totalBytes: { type: 'number' },
            maxBytes: { type: 'number' },
            usagePercent: { type: 'number' },
            warningStatus: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = getBearerUser(request.headers.authorization);
      const tenantId = (request as any).tenantContext?.tenantId;
      
      if (!tenantId) {
        reply.status(403);
        return { error: 'Tenant context required' };
      }

      const stats = await fileStorageService.getStorageStats(tenantId);
      return stats;
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Failed to get quota' };
    }
  });

  /**
   * Clean Up Files - Requires ADMIN
   * POST /files/cleanup
   */
  app.post('/files/cleanup', {
    schema: {
      tags: ['Files'],
      summary: 'Clean up deleted files',
      description: 'Permanently delete files that have been soft-deleted (requires ADMIN)',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          daysToKeep: { type: 'number', default: 30 },
        },
      },
      response: {
        200: {
          description: 'Cleanup completed',
          type: 'object',
          properties: {
            filesDeleted: { type: 'number' },
            backupsDeleted: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const checkAdmin = requireRole('ADMIN');
      checkAdmin(request.headers.authorization);
      
      const body = request.body as any;
      const result = await fileStorageService.cleanup(body.daysToKeep || 30);
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient permissions')) {
        reply.status(403);
        return { error: error.message };
      }
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Cleanup failed' };
    }
  });

  // ========== Audit Logging Endpoints (Phase 14) ==========

  app.get('/audit-logs', {
    schema: {
      tags: ['Audit'],
      summary: 'Query audit logs',
      description: 'Get audit logs with optional filtering',
    },
  }, async (request, reply) => {
    try {
      const query = request.query as any;
      const tenantId = (request as any).tenantContext?.tenantId;
      
      const logs = await auditLoggingService.queryLogs({
        tenantId,
        userId: query.userId,
        action: query.action,
        resource: query.resource,
        severity: query.severity,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      });

      return { success: true, data: logs };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Query failed' };
    }
  });

  app.get('/audit-summary', {
    schema: {
      tags: ['Audit'],
      summary: 'Get audit summary',
      description: 'Get audit summary for tenant',
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantContext?.tenantId;
      const days = (request.query as any).days || 30;
      
      const summary = await auditLoggingService.getTenantSummary(tenantId, days);
      return { success: true, data: summary };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Summary fetch failed' };
    }
  });

  app.post('/audit-export', {
    schema: {
      tags: ['Audit'],
      summary: 'Export audit logs',
      description: 'Export audit logs as CSV',
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantContext?.tenantId;
      const body = request.body as any;
      
      const csv = await auditLoggingService.exportLogs(
        tenantId,
        body.startDate ? new Date(body.startDate) : undefined,
        body.endDate ? new Date(body.endDate) : undefined
      );

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      return csv;
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Export failed' };
    }
  });

  app.delete('/audit-cleanup', {
    schema: {
      tags: ['Audit'],
      summary: 'Clean up old audit logs',
      description: 'Delete audit logs older than specified days',
    },
  }, async (request, reply) => {
    try {
      const body = request.body as any;
      const result = await auditLoggingService.cleanupOldLogs(body.daysToKeep || 90);
      return { success: true, data: result };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Cleanup failed' };
    }
  });

  // ========== Advanced Search Endpoints (Phase 15) ==========

  app.get('/search', {
    schema: {
      tags: ['Search'],
      summary: 'Search across files, users, and events',
      description: 'Perform full-text search with tenant filtering',
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantContext?.tenantId;
      const query = request.query as any;
      
      const results = await advancedSearchService.search({
        q: query.q || '',
        type: query.type || 'all',
        tenantId,
        limit: parseInt(query.limit || '50'),
        offset: parseInt(query.offset || '0'),
      });

      return { success: true, data: results };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Search failed' };
    }
  });

  app.get('/search/suggest', {
    schema: {
      tags: ['Search'],
      summary: 'Get search suggestions',
      description: 'Get autocomplete suggestions for search',
    },
  }, async (request, reply) => {
    try {
      const query = request.query as any;
      
      const suggestions = await advancedSearchService.getSuggestions(
        query.prefix || '',
        query.type
      );

      return { success: true, data: suggestions };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Suggestions failed' };
    }
  });

  // ========== Webhook Endpoints (Phase 16) ==========

  app.post('/webhooks', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Register a webhook',
      description: 'Register a new webhook for event subscriptions',
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantContext?.tenantId;
      const body = request.body as any;
      
      const webhook = await webhookService.registerWebhook(tenantId, {
        url: body.url,
        events: body.events,
        headers: body.headers,
        retryPolicy: body.retryPolicy,
      });

      reply.status(201);
      return { success: true, data: webhook };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Registration failed' };
    }
  });

  app.get('/webhooks', {
    schema: {
      tags: ['Webhooks'],
      summary: 'List webhooks',
      description: 'Get all webhooks for tenant',
    },
  }, async (request, reply) => {
    try {
      const tenantId = (request as any).tenantContext?.tenantId;
      const webhooks = await webhookService.getTenantWebhooks(tenantId);
      return { success: true, data: webhooks };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Listing failed' };
    }
  });

  app.delete('/webhooks/:id', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Delete webhook',
      description: 'Delete a webhook subscription',
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      await webhookService.deleteWebhook(id);
      return { success: true };
    } catch (error) {
      reply.status(400);
      return { error: error instanceof Error ? error.message : 'Deletion failed' };
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
