/**
 * Multi-Tenancy System for Ultra AI Platform
 *
 * Provides tenant isolation, context management, and row-level security
 */

import { PrismaClient, Tenant, TenantStatus, TenantPlan } from '@prisma/client';
import { FastifyRequest } from 'fastify';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  status: TenantStatus;
  plan: TenantPlan;
  maxUsers: number;
  maxStorage: number;
  settings?: Record<string, unknown>;
}

export interface TenantConfig {
  name: string;
  slug?: string;
  domain?: string;
  plan?: TenantPlan;
  maxUsers?: number;
  maxStorage?: number;
  settings?: Record<string, unknown>;
}

/**
 * Tenant Service - Manages tenant operations
 */
export class TenantService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new tenant
   */
  async createTenant(config: TenantConfig): Promise<Tenant> {
    const slug = config.slug || this.generateSlug(config.name);

    // Check if slug already exists
    const existing = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error(`Tenant with slug '${slug}' already exists`);
    }

    return await this.prisma.tenant.create({
      data: {
        name: config.name,
        slug,
        domain: config.domain,
        plan: config.plan || TenantPlan.FREE,
        maxUsers: config.maxUsers || 5,
        maxStorage: config.maxStorage || 1073741824, // 1GB
        settings: config.settings as any,
        status: TenantStatus.TRIAL,
      },
    });
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    return await this.prisma.tenant.findUnique({
      where: { domain },
    });
  }

  /**
   * Update tenant
   */
  async updateTenant(
    tenantId: string,
    data: Partial<TenantConfig>
  ): Promise<Tenant> {
    return await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.domain && { domain: data.domain }),
        ...(data.plan && { plan: data.plan }),
        ...(data.maxUsers && { maxUsers: data.maxUsers }),
        ...(data.maxStorage && { maxStorage: data.maxStorage }),
        ...(data.settings && { settings: data.settings as any }),
      },
    });
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string): Promise<Tenant> {
    return await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: TenantStatus.SUSPENDED },
    });
  }

  /**
   * Activate tenant
   */
  async activateTenant(tenantId: string): Promise<Tenant> {
    return await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: TenantStatus.ACTIVE },
    });
  }

  /**
   * Delete tenant and all associated data
   */
  async deleteTenant(tenantId: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id: tenantId },
    });
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<{
    userCount: number;
    storageUsed: number;
    isOverLimit: boolean;
  }> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const userCount = await this.prisma.user.count({
      where: { tenantId },
    });

    // Storage calculation would come from actual file storage
    const storageUsed = 0; // TODO: Implement storage tracking

    return {
      userCount,
      storageUsed,
      isOverLimit:
        userCount > tenant.maxUsers || storageUsed > tenant.maxStorage,
    };
  }

  /**
   * List all tenants
   */
  async listTenants(options?: {
    status?: TenantStatus;
    plan?: TenantPlan;
    skip?: number;
    take?: number;
  }): Promise<Tenant[]> {
    return await this.prisma.tenant.findMany({
      where: {
        ...(options?.status && { status: options.status }),
        ...(options?.plan && { plan: options.plan }),
      },
      skip: options?.skip || 0,
      take: options?.take || 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Tenant Context Manager - Extracts and manages tenant context from requests
 */
export class TenantContextManager {
  constructor(private tenantService: TenantService) {}

  /**
   * Extract tenant context from request
   * Supports multiple strategies:
   * 1. Subdomain: tenant.ultra-ai.com
   * 2. Custom domain: company.com
   * 3. Header: X-Tenant-Slug
   * 4. Path: /api/tenants/:slug/...
   */
  async extractTenantContext(
    request: FastifyRequest
  ): Promise<TenantContext | null> {
    // Strategy 1: Check X-Tenant-Slug header
    const tenantHeader = request.headers['x-tenant-slug'] as string;
    if (tenantHeader) {
      return await this.getTenantContextBySlug(tenantHeader);
    }

    // Strategy 2: Check custom domain
    const host = request.headers.host;
    if (host && !host.includes('localhost') && !host.includes('ultra-ai.com')) {
      const domain = host.split(':')[0]; // Remove port
      return await this.getTenantContextByDomain(domain);
    }

    // Strategy 3: Check subdomain
    if (host) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return await this.getTenantContextBySlug(subdomain);
      }
    }

    // Strategy 4: Check path parameter (if available in route)
    // This would be handled by route-specific logic

    return null;
  }

  /**
   * Get tenant context by slug
   */
  async getTenantContextBySlug(slug: string): Promise<TenantContext | null> {
    const tenant = await this.tenantService.getTenantBySlug(slug);
    if (!tenant) {
      return null;
    }
    return this.buildTenantContext(tenant);
  }

  /**
   * Get tenant context by domain
   */
  async getTenantContextByDomain(
    domain: string
  ): Promise<TenantContext | null> {
    const tenant = await this.tenantService.getTenantByDomain(domain);
    if (!tenant) {
      return null;
    }
    return this.buildTenantContext(tenant);
  }

  /**
   * Build tenant context object
   */
  private buildTenantContext(tenant: Tenant): TenantContext {
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      status: tenant.status,
      plan: tenant.plan,
      maxUsers: tenant.maxUsers,
      maxStorage: tenant.maxStorage,
      settings: tenant.settings as Record<string, unknown> | undefined,
    };
  }

  /**
   * Extract subdomain from host
   */
  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
    return null;
  }
}

/**
 * Tenant middleware factory
 */
export function createTenantMiddleware(contextManager: TenantContextManager) {
  return async (request: FastifyRequest, reply: any) => {
    const tenantContext = await contextManager.extractTenantContext(request);

    if (tenantContext) {
      // Check if tenant is active
      if (tenantContext.status === TenantStatus.SUSPENDED) {
        reply.status(403);
        return { error: 'Tenant is suspended' };
      }

      if (tenantContext.status === TenantStatus.CANCELLED) {
        reply.status(403);
        return { error: 'Tenant is cancelled' };
      }

      // Attach tenant context to request
      (request as any).tenantContext = tenantContext;
    }
  };
}

/**
 * Require tenant middleware - ensures tenant context exists
 */
export function requireTenantMiddleware(request: FastifyRequest, reply: any) {
  const tenantContext = (request as any).tenantContext as
    | TenantContext
    | undefined;

  if (!tenantContext) {
    reply.status(400);
    return {
      error:
        'Tenant context required. Provide X-Tenant-Slug header or use tenant subdomain',
    };
  }
}

/**
 * Scoped Prisma Client for tenant isolation
 */
export class TenantScopedPrisma {
  constructor(
    private prisma: PrismaClient,
    private tenantId: string
  ) {}

  /**
   * Get user repository scoped to tenant
   */
  get user() {
    return {
      findMany: (args?: any) => {
        return this.prisma.user.findMany({
          ...args,
          where: {
            ...args?.where,
            tenantId: this.tenantId,
          },
        });
      },
      findUnique: (args: any) => {
        return this.prisma.user.findFirst({
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        });
      },
      create: (args: any) => {
        return this.prisma.user.create({
          ...args,
          data: {
            ...args.data,
            tenantId: this.tenantId,
          },
        });
      },
      update: (args: any) => {
        return this.prisma.user.updateMany({
          ...args,
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        });
      },
      delete: (args: any) => {
        return this.prisma.user.deleteMany({
          where: {
            ...args.where,
            tenantId: this.tenantId,
          },
        });
      },
      count: (args?: any) => {
        return this.prisma.user.count({
          ...args,
          where: {
            ...args?.where,
            tenantId: this.tenantId,
          },
        });
      },
    };
  }
}

/**
 * Create tenant-scoped Prisma client
 */
export function createTenantScopedPrisma(
  prisma: PrismaClient,
  tenantContext: TenantContext
): TenantScopedPrisma {
  return new TenantScopedPrisma(prisma, tenantContext.tenantId);
}
