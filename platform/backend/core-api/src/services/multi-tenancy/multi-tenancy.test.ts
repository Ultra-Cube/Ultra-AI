/**
 * Multi-Tenancy System Tests
 */

import { PrismaClient, TenantStatus, TenantPlan } from '@prisma/client';
import {
  TenantService,
  TenantContextManager,
  createTenantScopedPrisma,
} from './tenant-service';

// Mock Prisma Client
const mockPrisma = {
  tenant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('TenantService', () => {
  let tenantService: TenantService;

  beforeEach(() => {
    tenantService = new TenantService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should create a new tenant with default settings', async () => {
      const mockTenant = {
        id: 'tenant_123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        domain: null,
        status: TenantStatus.TRIAL,
        plan: TenantPlan.FREE,
        maxUsers: 5,
        maxStorage: 1073741824,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.tenant.create as jest.Mock).mockResolvedValue(mockTenant);

      const result = await tenantService.createTenant({
        name: 'Acme Corp',
      });

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Acme Corp',
          slug: 'acme-corp',
          plan: TenantPlan.FREE,
        }),
      });
    });

    it('should create tenant with custom slug', async () => {
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.tenant.create as jest.Mock).mockResolvedValue({
        id: 'tenant_123',
        slug: 'custom-slug',
      });

      await tenantService.createTenant({
        name: 'Acme Corp',
        slug: 'custom-slug',
      });

      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'custom-slug',
        }),
      });
    });

    it('should throw error if slug already exists', async () => {
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing_tenant',
        slug: 'acme-corp',
      });

      await expect(
        tenantService.createTenant({ name: 'Acme Corp' })
      ).rejects.toThrow("Tenant with slug 'acme-corp' already exists");
    });

    it('should create tenant with custom configuration', async () => {
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.tenant.create as jest.Mock).mockResolvedValue({
        id: 'tenant_123',
      });

      await tenantService.createTenant({
        name: 'Enterprise Corp',
        domain: 'enterprise.com',
        plan: TenantPlan.ENTERPRISE,
        maxUsers: 100,
        maxStorage: 10737418240, // 10GB
        settings: { theme: 'dark', features: ['analytics'] },
      });

      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          domain: 'enterprise.com',
          plan: TenantPlan.ENTERPRISE,
          maxUsers: 100,
          maxStorage: 10737418240,
        }),
      });
    });
  });

  describe('getTenant methods', () => {
    it('should get tenant by ID', async () => {
      const mockTenant = { id: 'tenant_123', name: 'Acme Corp' };
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await tenantService.getTenantById('tenant_123');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant_123' },
      });
    });

    it('should get tenant by slug', async () => {
      const mockTenant = { id: 'tenant_123', slug: 'acme-corp' };
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await tenantService.getTenantBySlug('acme-corp');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme-corp' },
      });
    });

    it('should get tenant by domain', async () => {
      const mockTenant = { id: 'tenant_123', domain: 'acme.com' };
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await tenantService.getTenantByDomain('acme.com');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { domain: 'acme.com' },
      });
    });
  });

  describe('updateTenant', () => {
    it('should update tenant properties', async () => {
      const mockUpdated = {
        id: 'tenant_123',
        name: 'Updated Corp',
        plan: TenantPlan.PROFESSIONAL,
      };
      (mockPrisma.tenant.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await tenantService.updateTenant('tenant_123', {
        name: 'Updated Corp',
        plan: TenantPlan.PROFESSIONAL,
      });

      expect(result).toEqual(mockUpdated);
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant_123' },
        data: expect.objectContaining({
          name: 'Updated Corp',
          plan: TenantPlan.PROFESSIONAL,
        }),
      });
    });
  });

  describe('suspend and activate', () => {
    it('should suspend tenant', async () => {
      const mockSuspended = { id: 'tenant_123', status: TenantStatus.SUSPENDED };
      (mockPrisma.tenant.update as jest.Mock).mockResolvedValue(mockSuspended);

      const result = await tenantService.suspendTenant('tenant_123');

      expect(result.status).toBe(TenantStatus.SUSPENDED);
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant_123' },
        data: { status: TenantStatus.SUSPENDED },
      });
    });

    it('should activate tenant', async () => {
      const mockActive = { id: 'tenant_123', status: TenantStatus.ACTIVE };
      (mockPrisma.tenant.update as jest.Mock).mockResolvedValue(mockActive);

      const result = await tenantService.activateTenant('tenant_123');

      expect(result.status).toBe(TenantStatus.ACTIVE);
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant', async () => {
      (mockPrisma.tenant.delete as jest.Mock).mockResolvedValue({});

      await tenantService.deleteTenant('tenant_123');

      expect(mockPrisma.tenant.delete).toHaveBeenCalledWith({
        where: { id: 'tenant_123' },
      });
    });
  });

  describe('getTenantStats', () => {
    it('should return tenant statistics', async () => {
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant_123',
        maxUsers: 10,
        maxStorage: 1073741824,
      });
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(5);

      const stats = await tenantService.getTenantStats('tenant_123');

      expect(stats).toEqual({
        userCount: 5,
        storageUsed: 0,
        isOverLimit: false,
      });
    });

    it('should detect when over user limit', async () => {
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({
        id: 'tenant_123',
        maxUsers: 5,
        maxStorage: 1073741824,
      });
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(10);

      const stats = await tenantService.getTenantStats('tenant_123');

      expect(stats.isOverLimit).toBe(true);
    });
  });

  describe('listTenants', () => {
    it('should list all tenants', async () => {
      const mockTenants = [
        { id: 'tenant_1', name: 'Tenant 1' },
        { id: 'tenant_2', name: 'Tenant 2' },
      ];
      (mockPrisma.tenant.findMany as jest.Mock).mockResolvedValue(mockTenants);

      const result = await tenantService.listTenants();

      expect(result).toEqual(mockTenants);
      expect(mockPrisma.tenant.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      (mockPrisma.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await tenantService.listTenants({
        status: TenantStatus.ACTIVE,
      });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: TenantStatus.ACTIVE },
        })
      );
    });

    it('should support pagination', async () => {
      (mockPrisma.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await tenantService.listTenants({
        skip: 10,
        take: 20,
      });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });
  });
});

describe('TenantContextManager', () => {
  let contextManager: TenantContextManager;
  let tenantService: TenantService;

  beforeEach(() => {
    tenantService = new TenantService(mockPrisma);
    contextManager = new TenantContextManager(tenantService);
    jest.clearAllMocks();
  });

  describe('extractTenantContext', () => {
    it('should extract tenant from X-Tenant-Slug header', async () => {
      const mockTenant = {
        id: 'tenant_123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: TenantStatus.ACTIVE,
        plan: TenantPlan.PROFESSIONAL,
        maxUsers: 10,
        maxStorage: 1073741824,
        settings: null,
      };

      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const mockRequest = {
        headers: {
          'x-tenant-slug': 'acme-corp',
        },
      } as any;

      const context = await contextManager.extractTenantContext(mockRequest);

      expect(context).toMatchObject({
        tenantId: 'tenant_123',
        tenantSlug: 'acme-corp',
        tenantName: 'Acme Corp',
      });
    });

    it('should extract tenant from custom domain', async () => {
      const mockTenant = {
        id: 'tenant_123',
        domain: 'acme.com',
        slug: 'acme',
        name: 'Acme Corp',
        status: TenantStatus.ACTIVE,
        plan: TenantPlan.ENTERPRISE,
        maxUsers: 100,
        maxStorage: 10737418240,
        settings: null,
      };

      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const mockRequest = {
        headers: {
          host: 'acme.com',
        },
      } as any;

      const context = await contextManager.extractTenantContext(mockRequest);

      expect(context?.tenantId).toBe('tenant_123');
    });

    it('should extract tenant from subdomain', async () => {
      const mockTenant = {
        id: 'tenant_123',
        slug: 'acme',
        name: 'Acme Corp',
        status: TenantStatus.ACTIVE,
        plan: TenantPlan.STARTER,
        maxUsers: 5,
        maxStorage: 1073741824,
        settings: null,
      };

      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const mockRequest = {
        headers: {
          host: 'acme.ultra-ai.com',
        },
      } as any;

      const context = await contextManager.extractTenantContext(mockRequest);

      expect(context?.tenantSlug).toBe('acme');
    });

    it('should return null if no tenant found', async () => {
      (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      const mockRequest = {
        headers: {
          host: 'localhost:4000',
        },
      } as any;

      const context = await contextManager.extractTenantContext(mockRequest);

      expect(context).toBeNull();
    });
  });
});

describe('TenantScopedPrisma', () => {
  let scopedPrisma: ReturnType<typeof createTenantScopedPrisma>;
  const tenantContext = {
    tenantId: 'tenant_123',
    tenantSlug: 'acme',
    tenantName: 'Acme Corp',
    status: TenantStatus.ACTIVE,
    plan: TenantPlan.PROFESSIONAL,
    maxUsers: 10,
    maxStorage: 1073741824,
  };

  beforeEach(() => {
    scopedPrisma = createTenantScopedPrisma(mockPrisma, tenantContext);
    jest.clearAllMocks();
  });

  it('should scope findMany to tenant', async () => {
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);

    await scopedPrisma.user.findMany();

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant_123' },
      })
    );
  });

  it('should scope create to tenant', async () => {
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({});

    await scopedPrisma.user.create({
      data: { email: 'user@example.com', passwordHash: 'hash' },
    });

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant_123',
        }),
      })
    );
  });

  it('should scope count to tenant', async () => {
    (mockPrisma.user.count as jest.Mock).mockResolvedValue(5);

    await scopedPrisma.user.count();

    expect(mockPrisma.user.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant_123' },
      })
    );
  });
});
