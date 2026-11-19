// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * Role-Based Access Control (RBAC) System
 *
 * Export all RBAC components
 */

export {
  UserRole,
  type Permission,
  type RolePermissions,
  getRolePermissions,
  hasPermission,
  isSeniorRole,
  canManageUser,
  getRoleDisplayName,
  isValidRole,
  ROLE_PERMISSIONS,
} from './roles';

export {
  type AuthenticatedRequest,
  requireRole,
  requirePermission,
  requireMinimumRole,
  canManageUserMiddleware,
  requireOwnerOrAdmin,
  mockAuthMiddleware,
} from './middleware';
