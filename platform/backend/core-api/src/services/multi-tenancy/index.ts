// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

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

export type { TenantContext, TenantConfig } from './tenant-service';
