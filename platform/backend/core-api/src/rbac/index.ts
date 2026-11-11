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
