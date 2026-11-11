/**
 * Role-Based Access Control (RBAC) System
 *
 * Provides role management, permission checking, and access control
 * for the Ultra AI Platform API.
 */

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  inherits?: UserRole[];
}

/**
 * Role hierarchy and permissions matrix
 *
 * USER: Basic user permissions
 * MODERATOR: Content moderation + user permissions
 * ADMIN: Full resource management + moderator permissions
 * SUPER_ADMIN: System administration + all permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.USER]: {
    role: UserRole.USER,
    permissions: [
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
      { resource: 'ai', action: 'create' },
      { resource: 'ai', action: 'read' },
      { resource: 'workspace', action: 'read' },
      { resource: 'workspace', action: 'update' },
      { resource: 'task', action: 'create' },
      { resource: 'task', action: 'read' },
    ],
  },
  [UserRole.MODERATOR]: {
    role: UserRole.MODERATOR,
    permissions: [
      { resource: 'user', action: 'read' },
      { resource: 'content', action: 'update' },
      { resource: 'content', action: 'delete' },
      { resource: 'report', action: 'read' },
      { resource: 'report', action: 'update' },
    ],
    inherits: [UserRole.USER],
  },
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    permissions: [
      { resource: 'user', action: 'manage' },
      { resource: 'content', action: 'manage' },
      { resource: 'system', action: 'read' },
      { resource: 'analytics', action: 'read' },
      { resource: 'blockchain', action: 'manage' },
    ],
    inherits: [UserRole.MODERATOR],
  },
  [UserRole.SUPER_ADMIN]: {
    role: UserRole.SUPER_ADMIN,
    permissions: [
      { resource: 'system', action: 'manage' },
      { resource: 'roles', action: 'manage' },
      { resource: 'security', action: 'manage' },
      { resource: 'infrastructure', action: 'manage' },
    ],
    inherits: [UserRole.ADMIN],
  },
};

/**
 * Get all permissions for a role (including inherited permissions)
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const roleConfig = ROLE_PERMISSIONS[role];
  const permissions = [...roleConfig.permissions];

  // Add inherited permissions
  if (roleConfig.inherits) {
    for (const inheritedRole of roleConfig.inherits) {
      permissions.push(...getRolePermissions(inheritedRole));
    }
  }

  return permissions;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: UserRole,
  resource: string,
  action: Permission['action']
): boolean {
  const permissions = getRolePermissions(role);

  // Check for exact permission match
  const hasExactPermission = permissions.some(
    (p) => p.resource === resource && p.action === action
  );

  // Check for 'manage' permission (grants all actions)
  const hasManagePermission = permissions.some(
    (p) => p.resource === resource && p.action === 'manage'
  );

  return hasExactPermission || hasManagePermission;
}

/**
 * Check if one role is senior to another
 */
export function isSeniorRole(role: UserRole, comparedTo: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.USER]: 1,
    [UserRole.MODERATOR]: 2,
    [UserRole.ADMIN]: 3,
    [UserRole.SUPER_ADMIN]: 4,
  };

  return roleHierarchy[role] > roleHierarchy[comparedTo];
}

/**
 * Check if role can manage another user
 */
export function canManageUser(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  // Super admins can manage anyone
  if (managerRole === UserRole.SUPER_ADMIN) return true;

  // Admins can manage moderators and users
  if (managerRole === UserRole.ADMIN) {
    return targetRole === UserRole.MODERATOR || targetRole === UserRole.USER;
  }

  // Moderators cannot manage other users' roles
  return false;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.USER]: 'User',
    [UserRole.MODERATOR]: 'Moderator',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.SUPER_ADMIN]: 'Super Administrator',
  };

  return displayNames[role];
}

/**
 * Validate role string
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}
