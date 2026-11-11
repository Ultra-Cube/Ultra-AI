/**
 * RBAC Middleware Tests
 */

import type { Response, NextFunction } from 'express';

import {
  AuthenticatedRequest,
  requireRole,
  requirePermission,
  requireMinimumRole,
  canManageUserMiddleware,
  requireOwnerOrAdmin,
} from './middleware';
import { UserRole } from './roles';

describe('RBAC Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.USER,
      },
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      const middleware = requireRole(UserRole.USER);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple allowed roles', () => {
      mockReq.user!.role = UserRole.ADMIN;
      const middleware = requireRole(UserRole.USER, UserRole.ADMIN);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      const middleware = requireRole(UserRole.ADMIN);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
        })
      );
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requireRole(UserRole.USER);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
        })
      );
    });
  });

  describe('requirePermission', () => {
    it('should allow access when user has required permission', () => {
      const middleware = requirePermission('profile', 'read');
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required permission', () => {
      const middleware = requirePermission('system', 'manage');
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: expect.stringContaining('do not have permission'),
        })
      );
    });

    it('should allow admin to access user management', () => {
      mockReq.user!.role = UserRole.ADMIN;
      const middleware = requirePermission('user', 'manage');
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requirePermission('profile', 'read');
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireMinimumRole', () => {
    it('should allow access when user has exact minimum role', () => {
      mockReq.user!.role = UserRole.MODERATOR;
      const middleware = requireMinimumRole(UserRole.MODERATOR);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access when user has higher role', () => {
      mockReq.user!.role = UserRole.ADMIN;
      const middleware = requireMinimumRole(UserRole.MODERATOR);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when user has lower role', () => {
      mockReq.user!.role = UserRole.USER;
      const middleware = requireMinimumRole(UserRole.MODERATOR);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requireMinimumRole(UserRole.USER);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('canManageUserMiddleware', () => {
    it('should allow SUPER_ADMIN to manage ADMIN', () => {
      mockReq.user!.role = UserRole.SUPER_ADMIN;
      mockReq.body = { role: UserRole.ADMIN };
      canManageUserMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow ADMIN to manage USER', () => {
      mockReq.user!.role = UserRole.ADMIN;
      mockReq.body = { role: UserRole.USER };
      canManageUserMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny ADMIN managing another ADMIN', () => {
      mockReq.user!.role = UserRole.ADMIN;
      mockReq.body = { role: UserRole.ADMIN };
      canManageUserMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should deny MODERATOR managing any user', () => {
      mockReq.user!.role = UserRole.MODERATOR;
      mockReq.body = { role: UserRole.USER };
      canManageUserMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      canManageUserMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireOwnerOrAdmin', () => {
    it('should allow user to access their own resources', () => {
      mockReq.params = { userId: 'test-user-id' };
      const middleware = requireOwnerOrAdmin();
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow ADMIN to access other users resources', () => {
      mockReq.user!.role = UserRole.ADMIN;
      mockReq.params = { userId: 'other-user-id' };
      const middleware = requireOwnerOrAdmin();
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow SUPER_ADMIN to access other users resources', () => {
      mockReq.user!.role = UserRole.SUPER_ADMIN;
      mockReq.params = { userId: 'other-user-id' };
      const middleware = requireOwnerOrAdmin();
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny regular USER accessing other users resources', () => {
      mockReq.params = { userId: 'other-user-id' };
      const middleware = requireOwnerOrAdmin();
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You can only access your own resources',
        })
      );
    });

    it('should work with custom parameter name', () => {
      mockReq.params = { id: 'test-user-id' };
      const middleware = requireOwnerOrAdmin('id');
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requireOwnerOrAdmin();
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
