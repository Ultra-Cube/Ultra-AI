/**
 * Admin Routes RBAC Integration Tests
 */

import express from 'express';
import request from 'supertest';

import { mockAuthMiddleware, UserRole } from '../rbac';

import adminRoutes from './admin.routes';

describe('Admin Routes RBAC', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('GET /dashboard', () => {
    it('should allow ADMIN to access dashboard', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin dashboard data');
      expect(response.body.stats).toBeDefined();
    });

    it('should allow SUPER_ADMIN to access dashboard', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.SUPER_ADMIN),
        adminRoutes
      );

      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(200);
    });

    it('should deny USER access to dashboard', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.USER), adminRoutes);

      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should deny MODERATOR access to dashboard', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.MODERATOR),
        adminRoutes
      );

      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /users', () => {
    it('should allow ADMIN to list users', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app).get('/api/admin/users');

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should deny USER from listing users', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.USER), adminRoutes);

      const response = await request(app).get('/api/admin/users');

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /users/:userId/role', () => {
    it('should allow ADMIN to update user role', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app)
        .put('/api/admin/users/user-123/role')
        .send({ role: UserRole.MODERATOR });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User role updated');
      expect(response.body.newRole).toBe(UserRole.MODERATOR);
    });

    it('should deny MODERATOR from updating user role', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.MODERATOR),
        adminRoutes
      );

      const response = await request(app)
        .put('/api/admin/users/user-123/role')
        .send({ role: UserRole.USER });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /users/:userId', () => {
    it('should allow ADMIN to delete user', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app).delete('/api/admin/users/user-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted');
    });

    it('should allow SUPER_ADMIN to delete user', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.SUPER_ADMIN),
        adminRoutes
      );

      const response = await request(app).delete('/api/admin/users/user-123');

      expect(response.status).toBe(200);
    });

    it('should deny MODERATOR from deleting user', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.MODERATOR),
        adminRoutes
      );

      const response = await request(app).delete('/api/admin/users/user-123');

      expect(response.status).toBe(403);
    });

    it('should deny USER from deleting user', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.USER), adminRoutes);

      const response = await request(app).delete('/api/admin/users/user-123');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /system/settings', () => {
    it('should allow SUPER_ADMIN to view system settings', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.SUPER_ADMIN),
        adminRoutes
      );

      const response = await request(app).get('/api/admin/system/settings');

      expect(response.status).toBe(200);
      expect(response.body.settings).toBeDefined();
    });

    it('should deny ADMIN from viewing system settings', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app).get('/api/admin/system/settings');

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /system/settings', () => {
    it('should allow SUPER_ADMIN to update system settings', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.SUPER_ADMIN),
        adminRoutes
      );

      const response = await request(app)
        .put('/api/admin/system/settings')
        .send({ maintenanceMode: true });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('System settings updated');
    });

    it('should deny ADMIN from updating system settings', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app)
        .put('/api/admin/system/settings')
        .send({ maintenanceMode: true });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /audit-logs', () => {
    it('should allow MODERATOR to view audit logs', async () => {
      app.use(
        '/api/admin',
        mockAuthMiddleware(UserRole.MODERATOR),
        adminRoutes
      );

      const response = await request(app).get('/api/admin/audit-logs');

      expect(response.status).toBe(200);
      expect(response.body.logs).toBeDefined();
    });

    it('should allow ADMIN to view audit logs', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app).get('/api/admin/audit-logs');

      expect(response.status).toBe(200);
    });

    it('should deny USER from viewing audit logs', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.USER), adminRoutes);

      const response = await request(app).get('/api/admin/audit-logs');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /analytics', () => {
    it('should allow ADMIN to view analytics', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app).get('/api/admin/analytics');

      expect(response.status).toBe(200);
      expect(response.body.analytics).toBeDefined();
    });

    it('should deny USER from viewing analytics', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.USER), adminRoutes);

      const response = await request(app).get('/api/admin/analytics');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /users/:userId/profile - Owner or Admin', () => {
    it('should allow user to access their own profile', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.USER), adminRoutes);

      const response = await request(app).get(
        '/api/admin/users/test-user-id/profile'
      );

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeDefined();
    });

    it('should allow ADMIN to access any user profile', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.ADMIN), adminRoutes);

      const response = await request(app).get(
        '/api/admin/users/other-user-id/profile'
      );

      expect(response.status).toBe(200);
    });

    it('should deny USER from accessing other users profile', async () => {
      app.use('/api/admin', mockAuthMiddleware(UserRole.USER), adminRoutes);

      const response = await request(app).get(
        '/api/admin/users/other-user-id/profile'
      );

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'You can only access your own resources'
      );
    });
  });
});
