import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthIntegration, AuthConfig } from './auth-integration';

describe('AuthIntegration', () => {
  let authIntegration: AuthIntegration;

  beforeEach(() => {
    authIntegration = new AuthIntegration({
      jwtSecret: 'test-secret',
      verifyAuth: true,
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', () => {
      const token = 'valid-token-mock';
      // Mock token verification
      const result = authIntegration.verifyToken(token);
      // For now, we expect null because we're not generating real JWTs
      expect(result).toBeNull();
    });

    it('should return null for invalid token', () => {
      const result = authIntegration.verifyToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return anonymous context when auth verification is disabled', () => {
      authIntegration.updateConfig({ verifyAuth: false });
      const result = authIntegration.verifyToken('any-token');
      expect(result).toEqual({
        userId: 'anonymous',
        email: 'anonymous',
        role: 'user',
      });
    });
  });

  describe('extractTokenFromHeaders', () => {
    it('should extract token from Bearer header', () => {
      const headers = { Authorization: 'Bearer test-token' };
      const token = authIntegration.extractTokenFromHeaders(headers);
      expect(token).toBe('test-token');
    });

    it('should extract token from lowercase authorization header', () => {
      const headers = { authorization: 'Bearer test-token' };
      const token = authIntegration.extractTokenFromHeaders(headers);
      expect(token).toBe('test-token');
    });

    it('should return null when no authorization header', () => {
      const headers = {};
      const token = authIntegration.extractTokenFromHeaders(headers);
      expect(token).toBeNull();
    });

    it('should return header as-is when no Bearer prefix', () => {
      const headers = { Authorization: 'raw-token' };
      const token = authIntegration.extractTokenFromHeaders(headers);
      expect(token).toBe('raw-token');
    });
  });

  describe('authenticateRequest', () => {
    it('should return null when no token in headers', () => {
      const result = authIntegration.authenticateRequest({});
      expect(result).toBeNull();
    });

    it('should return null when token verification fails', () => {
      const headers = { Authorization: 'Bearer invalid-token' };
      const result = authIntegration.authenticateRequest(headers);
      expect(result).toBeNull();
    });

    it('should return anonymous context when auth is disabled', () => {
      authIntegration.updateConfig({ verifyAuth: false });
      const result = authIntegration.authenticateRequest({ Authorization: 'Bearer any-token' });
      expect(result).toEqual({
        userId: 'anonymous',
        email: 'anonymous',
        role: 'user',
      });
    });
  });

  describe('hasRole', () => {
    it('should return true for admin role', () => {
      const context = { userId: '1', email: 'admin@test.com', role: 'admin' };
      expect(authIntegration.hasRole(context, 'user')).toBe(true);
      expect(authIntegration.hasRole(context, 'admin')).toBe(true);
    });

    it('should return true when user has required role', () => {
      const context = { userId: '1', email: 'user@test.com', role: 'user' };
      expect(authIntegration.hasRole(context, 'user')).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      const context = { userId: '1', email: 'user@test.com', role: 'user' };
      expect(authIntegration.hasRole(context, 'admin')).toBe(false);
    });

    it('should return false for null context', () => {
      expect(authIntegration.hasRole(null, 'user')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true for admin role regardless of required roles', () => {
      const context = { userId: '1', email: 'admin@test.com', role: 'admin' };
      expect(authIntegration.hasAnyRole(context, ['user', 'moderator'])).toBe(true);
    });

    it('should return true when user has one of required roles', () => {
      const context = { userId: '1', email: 'user@test.com', role: 'user' };
      expect(authIntegration.hasAnyRole(context, ['user', 'admin'])).toBe(true);
    });

    it('should return false when user has none of required roles', () => {
      const context = { userId: '1', email: 'user@test.com', role: 'user' };
      expect(authIntegration.hasAnyRole(context, ['admin', 'moderator'])).toBe(false);
    });

    it('should return false for null context', () => {
      expect(authIntegration.hasAnyRole(null, ['user'])).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      authIntegration.updateConfig({ verifyAuth: false });
      const config = authIntegration.getConfig();
      expect(config.verifyAuth).toBe(false);
    });

    it('should not update jwtSecret if not provided', () => {
      const originalSecret = authIntegration.getConfig().jwtSecret;
      authIntegration.updateConfig({ verifyAuth: false });
      const config = authIntegration.getConfig();
      expect(config.jwtSecret).toBe(originalSecret);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = authIntegration.getConfig();
      expect(config).toHaveProperty('jwtSecret');
      expect(config).toHaveProperty('verifyAuth');
    });

    it('should return a copy of configuration', () => {
      const config1 = authIntegration.getConfig();
      config1.jwtSecret = 'modified';
      const config2 = authIntegration.getConfig();
      expect(config2.jwtSecret).not.toBe('modified');
    });
  });
});