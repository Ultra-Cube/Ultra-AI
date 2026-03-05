/**
 * Multi-Tenancy Module
 * 
 * Exports all multi-tenancy functionality
 */

export {
  TenantService,
  TenantContextManager,
  TenantScopedPrisma,
  createTenantScopedPrisma,
  createTenantMiddleware,
  requireTenantMiddleware,
} from './tenant-service';

export type {
  TenantContext,
  TenantConfig,
} from './tenant-service';
