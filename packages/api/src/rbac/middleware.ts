/**
 * RBAC Middleware
 * 
 * Provides middleware functions for role-based access control
 */

import type { Request, Response, NextFunction } from 'express';
import { UserRole, hasPermission, canManageUser, isSeniorRole } from './roles';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware to require a specific role
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        userRole,
      });
    }

    next();
  };
}

/**
 * Middleware to require a specific permission
 */
export function requirePermission(resource: string, action: 'create' | 'read' | 'update' | 'delete' | 'manage') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You do not have permission to ${action} ${resource}`,
        requiredPermission: { resource, action },
      });
    }

    next();
  };
}

/**
 * Middleware to require minimum role level
 */
export function requireMinimumRole(minimumRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    if (!isSeniorRole(userRole, minimumRole) && userRole !== minimumRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires at least ${minimumRole} role`,
        minimumRole,
        userRole,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user can manage another user
 */
export function canManageUserMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const targetRole = req.body.role as UserRole;
  const managerRole = req.user.role;

  if (!canManageUser(managerRole, targetRole)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to manage users with this role',
      targetRole,
      managerRole,
    });
  }

  next();
}

/**
 * Middleware to allow access to own resources or admin access
 */
export function requireOwnerOrAdmin(userIdParam: string = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if user is accessing their own resource
    if (targetUserId === currentUserId) {
      return next();
    }

    // Allow if user is admin or super admin
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own resources',
    });
  };
}

/**
 * Mock authentication middleware for testing
 * In production, replace with actual JWT verification
 */
export function mockAuthMiddleware(role: UserRole = UserRole.USER) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role,
    };
    next();
  };
}
