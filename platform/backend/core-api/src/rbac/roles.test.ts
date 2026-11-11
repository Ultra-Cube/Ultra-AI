/**
 * RBAC Roles Tests
 */

import {
  UserRole,
  getRolePermissions,
  hasPermission,
  isSeniorRole,
  canManageUser,
  getRoleDisplayName,
  isValidRole,
} from './roles';

describe('RBAC Roles', () => {
  describe('getRolePermissions', () => {
    it('should return USER permissions', () => {
      const permissions = getRolePermissions(UserRole.USER);
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.some((p) => p.resource === 'profile')).toBe(true);
    });

    it('should include inherited permissions for MODERATOR', () => {
      const permissions = getRolePermissions(UserRole.MODERATOR);
      // Should have moderator permissions + user permissions
      expect(permissions.some((p) => p.resource === 'profile')).toBe(true); // from USER
      expect(permissions.some((p) => p.resource === 'report')).toBe(true); // from MODERATOR
    });

    it('should include all inherited permissions for ADMIN', () => {
      const permissions = getRolePermissions(UserRole.ADMIN);
      // Should have admin + moderator + user permissions
      expect(permissions.some((p) => p.resource === 'profile')).toBe(true); // from USER
      expect(permissions.some((p) => p.resource === 'report')).toBe(true); // from MODERATOR
      expect(permissions.some((p) => p.resource === 'system')).toBe(true); // from ADMIN
    });

    it('should include all inherited permissions for SUPER_ADMIN', () => {
      const permissions = getRolePermissions(UserRole.SUPER_ADMIN);
      expect(permissions.length).toBeGreaterThan(10);
      expect(permissions.some((p) => p.resource === 'infrastructure')).toBe(
        true
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true for USER profile read permission', () => {
      expect(hasPermission(UserRole.USER, 'profile', 'read')).toBe(true);
    });

    it('should return false for USER system manage permission', () => {
      expect(hasPermission(UserRole.USER, 'system', 'manage')).toBe(false);
    });

    it('should return true for MODERATOR content delete permission', () => {
      expect(hasPermission(UserRole.MODERATOR, 'content', 'delete')).toBe(true);
    });

    it('should return true for ADMIN user manage permission', () => {
      expect(hasPermission(UserRole.ADMIN, 'user', 'manage')).toBe(true);
    });

    it('should return true for SUPER_ADMIN all permissions', () => {
      expect(hasPermission(UserRole.SUPER_ADMIN, 'system', 'manage')).toBe(
        true
      );
      expect(
        hasPermission(UserRole.SUPER_ADMIN, 'infrastructure', 'manage')
      ).toBe(true);
    });

    it('should grant all actions when user has manage permission', () => {
      // ADMIN has 'manage' permission for users
      expect(hasPermission(UserRole.ADMIN, 'user', 'create')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'user', 'read')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'user', 'update')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'user', 'delete')).toBe(true);
    });

    it('should inherit permissions from parent roles', () => {
      // ADMIN inherits from MODERATOR inherits from USER
      expect(hasPermission(UserRole.ADMIN, 'profile', 'read')).toBe(true); // from USER
      expect(hasPermission(UserRole.ADMIN, 'report', 'update')).toBe(true); // from MODERATOR
    });
  });

  describe('isSeniorRole', () => {
    it('should return true when comparing higher role to lower role', () => {
      expect(isSeniorRole(UserRole.ADMIN, UserRole.USER)).toBe(true);
      expect(isSeniorRole(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true);
      expect(isSeniorRole(UserRole.MODERATOR, UserRole.USER)).toBe(true);
    });

    it('should return false when comparing lower role to higher role', () => {
      expect(isSeniorRole(UserRole.USER, UserRole.ADMIN)).toBe(false);
      expect(isSeniorRole(UserRole.MODERATOR, UserRole.SUPER_ADMIN)).toBe(
        false
      );
    });

    it('should return false when comparing same role', () => {
      expect(isSeniorRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('canManageUser', () => {
    it('should allow SUPER_ADMIN to manage anyone', () => {
      expect(canManageUser(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true);
      expect(canManageUser(UserRole.SUPER_ADMIN, UserRole.MODERATOR)).toBe(
        true
      );
      expect(canManageUser(UserRole.SUPER_ADMIN, UserRole.USER)).toBe(true);
    });

    it('should allow ADMIN to manage MODERATOR and USER', () => {
      expect(canManageUser(UserRole.ADMIN, UserRole.MODERATOR)).toBe(true);
      expect(canManageUser(UserRole.ADMIN, UserRole.USER)).toBe(true);
    });

    it('should not allow ADMIN to manage SUPER_ADMIN', () => {
      expect(canManageUser(UserRole.ADMIN, UserRole.SUPER_ADMIN)).toBe(false);
    });

    it('should not allow ADMIN to manage another ADMIN', () => {
      expect(canManageUser(UserRole.ADMIN, UserRole.ADMIN)).toBe(false);
    });

    it('should not allow MODERATOR to manage any users', () => {
      expect(canManageUser(UserRole.MODERATOR, UserRole.USER)).toBe(false);
      expect(canManageUser(UserRole.MODERATOR, UserRole.MODERATOR)).toBe(false);
    });

    it('should not allow USER to manage any users', () => {
      expect(canManageUser(UserRole.USER, UserRole.USER)).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display names', () => {
      expect(getRoleDisplayName(UserRole.USER)).toBe('User');
      expect(getRoleDisplayName(UserRole.MODERATOR)).toBe('Moderator');
      expect(getRoleDisplayName(UserRole.ADMIN)).toBe('Administrator');
      expect(getRoleDisplayName(UserRole.SUPER_ADMIN)).toBe(
        'Super Administrator'
      );
    });
  });

  describe('isValidRole', () => {
    it('should return true for valid roles', () => {
      expect(isValidRole('USER')).toBe(true);
      expect(isValidRole('MODERATOR')).toBe(true);
      expect(isValidRole('ADMIN')).toBe(true);
      expect(isValidRole('SUPER_ADMIN')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isValidRole('INVALID')).toBe(false);
      expect(isValidRole('admin')).toBe(false); // lowercase
      expect(isValidRole('')).toBe(false);
    });
  });
});
