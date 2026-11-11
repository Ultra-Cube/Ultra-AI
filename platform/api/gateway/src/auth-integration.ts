/**
 * Authentication Integration for API Gateway
 * Integrates with Ultra-AI's existing JWT-based authentication system
 */

import jwt from 'jsonwebtoken';

export interface AuthConfig {
  jwtSecret: string;
  verifyAuth: boolean;
}

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
}

export class AuthIntegration {
  private config: AuthConfig;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      jwtSecret:
        config.jwtSecret ||
        process.env.ULTRA_AI_JWT_SECRET ||
        'ultra-ai-dev-secret',
      verifyAuth: config.verifyAuth !== false, // Default to true
    };
  }

  /**
   * Verify JWT token and extract user context
   */
  verifyToken(token: string): AuthContext | null {
    if (!this.config.verifyAuth) {
      // If auth verification is disabled, return a default context
      return {
        userId: 'anonymous',
        email: 'anonymous',
        role: 'user',
      };
    }

    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as {
        sub: string;
        email: string;
        role: string;
      };

      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Extract token from request headers
   */
  extractTokenFromHeaders(headers: Record<string, string>): string | null {
    const authHeader = headers['authorization'] || headers['Authorization'];

    if (!authHeader) {
      return null;
    }

    // Handle "Bearer <token>" format
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Return header as-is if no Bearer prefix
    return authHeader;
  }

  /**
   * Authenticate request and return user context
   */
  authenticateRequest(headers: Record<string, string>): AuthContext | null {
    const token = this.extractTokenFromHeaders(headers);

    if (!token) {
      return null;
    }

    return this.verifyToken(token);
  }

  /**
   * Check if user has required role
   */
  hasRole(context: AuthContext, requiredRole: string): boolean {
    if (!context) {
      return false;
    }

    // Admin role has access to everything
    if (context.role === 'admin') {
      return true;
    }

    return context.role === requiredRole;
  }

  /**
   * Check if user has any of the required roles
   */
  hasAnyRole(context: AuthContext, requiredRoles: string[]): boolean {
    if (!context) {
      return false;
    }

    // Admin role has access to everything
    if (context.role === 'admin') {
      return true;
    }

    return requiredRoles.includes(context.role);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AuthConfig {
    return { ...this.config };
  }
}
