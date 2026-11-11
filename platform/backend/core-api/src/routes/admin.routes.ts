/**
 * Admin API Routes - Protected with RBAC
 *
 * Example implementation of role-protected API endpoints
 */

import express from 'express';

import {
  requireRole,
  requirePermission,
  requireMinimumRole,
  requireOwnerOrAdmin,
  UserRole,
  type AuthenticatedRequest,
} from '../rbac';

const router = express.Router();

/**
 * Admin Dashboard - Requires ADMIN or SUPER_ADMIN role
 * GET /api/admin/dashboard
 */
router.get(
  '/dashboard',
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: 'Admin dashboard data',
      user: req.user,
      stats: {
        users: 1250,
        activeUsers: 487,
        tasks: 5420,
        revenue: 125000,
      },
    });
  }
);

/**
 * List All Users - Requires 'user' read permission
 * GET /api/admin/users
 */
router.get(
  '/users',
  requirePermission('user', 'manage'),
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: 'List of all users',
      users: [
        { id: '1', email: 'user1@example.com', role: UserRole.USER },
        { id: '2', email: 'mod@example.com', role: UserRole.MODERATOR },
        { id: '3', email: 'admin@example.com', role: UserRole.ADMIN },
      ],
    });
  }
);

/**
 * Update User Role - Requires ability to manage users
 * PUT /api/admin/users/:userId/role
 */
router.put(
  '/users/:userId/role',
  requirePermission('user', 'manage'),
  (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    res.json({
      message: 'User role updated',
      userId,
      newRole: role,
      updatedBy: req.user?.email,
    });
  }
);

/**
 * Delete User - Requires minimum ADMIN role
 * DELETE /api/admin/users/:userId
 */
router.delete(
  '/users/:userId',
  requireMinimumRole(UserRole.ADMIN),
  (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;

    res.json({
      message: 'User deleted',
      userId,
      deletedBy: req.user?.email,
    });
  }
);

/**
 * System Settings - Requires SUPER_ADMIN only
 * GET /api/admin/system/settings
 */
router.get(
  '/system/settings',
  requireRole(UserRole.SUPER_ADMIN),
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: 'System settings',
      settings: {
        maintenanceMode: false,
        apiRateLimit: 1000,
        maxFileSize: '10MB',
        allowedOrigins: ['https://app.example.com'],
      },
    });
  }
);

/**
 * Update System Settings - Requires system manage permission
 * PUT /api/admin/system/settings
 */
router.put(
  '/system/settings',
  requirePermission('system', 'manage'),
  (req: AuthenticatedRequest, res) => {
    const settings = req.body;

    res.json({
      message: 'System settings updated',
      settings,
      updatedBy: req.user?.email,
    });
  }
);

/**
 * View Audit Logs - Requires minimum MODERATOR role
 * GET /api/admin/audit-logs
 */
router.get(
  '/audit-logs',
  requireMinimumRole(UserRole.MODERATOR),
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: 'Audit logs',
      logs: [
        {
          id: '1',
          action: 'USER_LOGIN',
          userId: 'user-123',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          action: 'ROLE_UPDATED',
          userId: 'user-456',
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }
);

/**
 * Analytics Dashboard - Requires analytics read permission
 * GET /api/admin/analytics
 */
router.get(
  '/analytics',
  requirePermission('analytics', 'read'),
  (req: AuthenticatedRequest, res) => {
    res.json({
      message: 'Analytics data',
      analytics: {
        dailyActiveUsers: 487,
        weeklyActiveUsers: 1250,
        conversionRate: 0.12,
        avgSessionDuration: 1850, // seconds
      },
    });
  }
);

/**
 * User Profile - Owner or Admin can access
 * GET /api/admin/users/:userId/profile
 */
router.get(
  '/users/:userId/profile',
  requireOwnerOrAdmin('userId'),
  (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;

    res.json({
      message: 'User profile',
      profile: {
        id: userId,
        email: 'user@example.com',
        role: UserRole.USER,
        createdAt: new Date().toISOString(),
      },
    });
  }
);

export default router;
