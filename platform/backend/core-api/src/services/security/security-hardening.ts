/**
 * Security Hardening and Compliance Module
 * Implements rate limiting, security headers, input validation,
 * and GDPR/CCPA compliance features
 */

import crypto from 'node:crypto';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Redis key prefix
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Content-Security-Policy': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

export interface CompliancePolicy {
  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  dataRetentionDays: number;
  requireConsentBefore: boolean;
  allowDataExport: boolean;
  allowDataDeletion: boolean;
}

/**
 * In-memory Rate Limiter
 * For production, use Redis-based limiter
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get requests within window
    const recentRequests = (this.requests.get(key) || []).filter(
      (req) => req > windowStart
    );

    if (recentRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Record this request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  /**
   * Get current request count for key
   */
  getRequestCount(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const recentRequests = (this.requests.get(key) || []).filter(
      (req) => req > windowStart
    );

    return recentRequests.length;
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Security Headers Generator
 */
export class SecurityHeadersGenerator {
  /**
   * Get standard security headers
   */
  static getHeaders(options?: { production?: boolean }): SecurityHeaders {
    const prod = options?.production ?? true;

    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': prod
        ? 'max-age=31536000; includeSubDomains; preload'
        : 'max-age=0',
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
        connect-src 'self' https:;
      `.replace(/\s+/g, ' '),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy':
        'geolocation=(), microphone=(), camera=(), payment=()',
    };
  }
}

/**
 * Input Validation & Sanitization
 */
export class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): boolean {
    // At least 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return strongRegex.test(password);
  }

  /**
   * Sanitize string input
   */
  static sanitize(input: string): string {
    return input
      .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  /**
   * Validate input length
   */
  static isValidLength(input: string, min: number, max: number): boolean {
    return input.length >= min && input.length <= max;
  }

  /**
   * Check for SQL injection patterns
   */
  static isSQLInjectionAttempt(input: string): boolean {
    const sqlPatterns = [
      /(\bor\b.*=|union.*select|select.*from|drop.*table|delete.*from|insert.*into|--|;|\/\*|\*\/)/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }
}

/**
 * GDPR/CCPA Compliance Manager
 */
export class ComplianceManager {
  private policy: CompliancePolicy;
  private userConsents: Map<string, { timestamp: Date; given: boolean }> =
    new Map();
  private dataAccessLog: Map<
    string,
    { timestamp: Date; action: string; reason: string }[]
  > = new Map();

  constructor(policy: CompliancePolicy) {
    this.policy = policy;
  }

  /**
   * Check if user has given consent
   */
  hasConsent(userId: string): boolean {
    if (!this.policy.requireConsentBefore) {
      return true;
    }

    const consent = this.userConsents.get(userId);
    return consent?.given ?? false;
  }

  /**
   * Record user consent
   */
  recordConsent(userId: string, given: boolean): void {
    this.userConsents.set(userId, {
      timestamp: new Date(),
      given,
    });
  }

  /**
   * Log data access for audit trail
   */
  logDataAccess(userId: string, action: string, reason: string): void {
    const logs = this.dataAccessLog.get(userId) || [];
    logs.push({
      timestamp: new Date(),
      action,
      reason,
    });
    this.dataAccessLog.set(userId, logs);
  }

  /**
   * Get user data access log
   */
  getAccessLog(userId: string): any[] {
    return this.dataAccessLog.get(userId) || [];
  }

  /**
   * Check if data should be deleted
   */
  shouldDeleteOldData(createdDate: Date): boolean {
    const ageMs = Date.now() - createdDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > this.policy.dataRetentionDays;
  }

  /**
   * Generate GDPR data export
   */
  generateDataExport(userId: string, userData: any): string {
    if (!this.policy.allowDataExport) {
      throw new Error('Data export not allowed');
    }

    const export_data = {
      exportDate: new Date().toISOString(),
      userId,
      exportId: crypto.randomUUID(),
      consentLog: this.userConsents.get(userId),
      accessLog: this.getAccessLog(userId),
      userData,
    };

    return JSON.stringify(export_data, null, 2);
  }

  /**
   * Check deletion eligibility
   */
  canDeleteUserData(userId: string): boolean {
    return this.policy.allowDataDeletion && this.hasConsent(userId);
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(): CompliancePolicy {
    return { ...this.policy };
  }
}

/**
 * Audit Logger
 */
export class AuditLogger {
  private events: Array<{
    timestamp: Date;
    userId?: string;
    action: string;
    resource: string;
    status: 'success' | 'failure';
    details: any;
  }> = [];

  /**
   * Log an audit event
   */
  log(
    action: string,
    resource: string,
    status: 'success' | 'failure',
    userId?: string,
    details?: any
  ): void {
    this.events.push({
      timestamp: new Date(),
      userId,
      action,
      resource,
      status,
      details,
    });
  }

  /**
   * Get audit events
   */
  getEvents(filter?: {
    userId?: string;
    action?: string;
    status?: 'success' | 'failure';
  }): any[] {
    return this.events.filter((event) => {
      if (filter?.userId && event.userId !== filter.userId) return false;
      if (filter?.action && event.action !== filter.action) return false;
      if (filter?.status && event.status !== filter.status) return false;
      return true;
    });
  }

  /**
   * Clear old events
   */
  clearOldEvents(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    const beforeLength = this.events.length;

    this.events = this.events.filter(
      (event) => event.timestamp.getTime() > cutoff
    );

    const removed = beforeLength - this.events.length;
    console.log(`Cleared ${removed} old audit events`);
  }
}
