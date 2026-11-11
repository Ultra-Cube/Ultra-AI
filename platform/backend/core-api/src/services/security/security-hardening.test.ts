import {
  RateLimiter,
  SecurityHeadersGenerator,
  InputValidator,
  ComplianceManager,
  AuditLogger,
} from './security-hardening';

describe('Security Hardening & Compliance', () => {
  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 3,
        keyPrefix: 'test',
      });

      const key = 'user-123';
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
    });

    it('should reject requests exceeding limit', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 2,
        keyPrefix: 'test',
      });

      const key = 'user-456';
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false);
    });

    it('should reset rate limit after time window', (done) => {
      const limiter = new RateLimiter({
        windowMs: 100,
        maxRequests: 1,
        keyPrefix: 'test',
      });

      const key = 'user-789';
      expect(limiter.isAllowed(key)).toBe(true);
      expect(limiter.isAllowed(key)).toBe(false);

      setTimeout(() => {
        expect(limiter.isAllowed(key)).toBe(true);
        done();
      }, 150);
    });

    it('should get request count', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 10,
        keyPrefix: 'test',
      });

      const key = 'user-count';
      limiter.isAllowed(key);
      limiter.isAllowed(key);
      expect(limiter.getRequestCount(key)).toBe(2);
    });

    it('should reset specific key', () => {
      const limiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 2,
        keyPrefix: 'test',
      });

      const key = 'user-reset';
      limiter.isAllowed(key);
      limiter.isAllowed(key);
      expect(limiter.getRequestCount(key)).toBe(2);

      limiter.reset(key);
      expect(limiter.getRequestCount(key)).toBe(0);
    });
  });

  describe('SecurityHeadersGenerator', () => {
    it('should generate security headers', () => {
      const headers = SecurityHeadersGenerator.getHeaders();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toContain('mode=block');
    });

    it('should include production HSTS header', () => {
      const headers = SecurityHeadersGenerator.getHeaders({ production: true });
      expect(headers['Strict-Transport-Security']).toContain(
        'max-age=31536000'
      );
      expect(headers['Strict-Transport-Security']).toContain('preload');
    });

    it('should use relaxed HSTS for development', () => {
      const headers = SecurityHeadersGenerator.getHeaders({
        production: false,
      });
      expect(headers['Strict-Transport-Security']).toContain('max-age=0');
    });

    it('should set CSP for XSS protection', () => {
      const headers = SecurityHeadersGenerator.getHeaders();
      expect(headers['Content-Security-Policy']).toContain(
        "default-src 'self'"
      );
    });

    it('should restrict permissions', () => {
      const headers = SecurityHeadersGenerator.getHeaders();
      expect(headers['Permissions-Policy']).toContain('geolocation=()');
      expect(headers['Permissions-Policy']).toContain('camera=()');
    });
  });

  describe('InputValidator', () => {
    it('should validate email format', () => {
      expect(InputValidator.isValidEmail('valid@example.com')).toBe(true);
      expect(InputValidator.isValidEmail('invalid@')).toBe(false);
      expect(InputValidator.isValidEmail('no-at-sign.com')).toBe(false);
    });

    it('should validate strong passwords', () => {
      expect(InputValidator.isStrongPassword('WeakPass1!')).toBe(false);
      expect(InputValidator.isStrongPassword('StrongPass123!')).toBe(true);
      expect(InputValidator.isStrongPassword('NoNumber!@#')).toBe(false);
    });

    it('should sanitize HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = InputValidator.sanitize(input);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('should sanitize quotes', () => {
      const input = 'Test "quote" and \'apostrophe\'';
      const sanitized = InputValidator.sanitize(input);
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should validate input length', () => {
      expect(InputValidator.isValidLength('abc', 2, 5)).toBe(true);
      expect(InputValidator.isValidLength('a', 2, 5)).toBe(false);
      expect(InputValidator.isValidLength('abcdef', 2, 5)).toBe(false);
    });

    it('should detect SQL injection attempts', () => {
      expect(InputValidator.isSQLInjectionAttempt("' or '1'='1")).toBe(true);
      expect(InputValidator.isSQLInjectionAttempt('select * from users')).toBe(
        true
      );
      expect(InputValidator.isSQLInjectionAttempt('drop table users')).toBe(
        true
      );
      expect(InputValidator.isSQLInjectionAttempt('normal input')).toBe(false);
    });

    it('should detect comments in injection attempts', () => {
      expect(InputValidator.isSQLInjectionAttempt('text -- comment')).toBe(
        true
      );
      expect(InputValidator.isSQLInjectionAttempt('text; delete')).toBe(true);
      expect(InputValidator.isSQLInjectionAttempt('text /* comment */')).toBe(
        true
      );
    });
  });

  describe('ComplianceManager', () => {
    const policy = {
      gdprEnabled: true,
      ccpaEnabled: true,
      dataRetentionDays: 90,
      requireConsentBefore: true,
      allowDataExport: true,
      allowDataDeletion: true,
    };

    it('should require consent when configured', () => {
      const manager = new ComplianceManager(policy);
      expect(manager.hasConsent('user-1')).toBe(false);

      manager.recordConsent('user-1', true);
      expect(manager.hasConsent('user-1')).toBe(true);
    });

    it('should skip consent when not required', () => {
      const noPolicyManager = new ComplianceManager({
        ...policy,
        requireConsentBefore: false,
      });

      expect(noPolicyManager.hasConsent('user-2')).toBe(true);
    });

    it('should log data access', () => {
      const manager = new ComplianceManager(policy);
      manager.logDataAccess('user-3', 'login', 'user authentication');
      manager.logDataAccess('user-3', 'data_access', 'user request');

      const logs = manager.getAccessLog('user-3');
      expect(logs.length).toBe(2);
      expect(logs[0].action).toBe('login');
      expect(logs[1].action).toBe('data_access');
    });

    it('should determine data deletion eligibility', () => {
      const manager = new ComplianceManager(policy);
      expect(manager.canDeleteUserData('user-4')).toBe(false);

      manager.recordConsent('user-4', true);
      expect(manager.canDeleteUserData('user-4')).toBe(true);
    });

    it('should generate data export', () => {
      const manager = new ComplianceManager(policy);
      manager.recordConsent('user-5', true);
      manager.logDataAccess('user-5', 'export', 'GDPR request');

      const userData = { name: 'John Doe', email: 'john@example.com' };
      const exportData = manager.generateDataExport('user-5', userData);

      const parsed = JSON.parse(exportData);
      expect(parsed.userId).toBe('user-5');
      expect(parsed.userData.name).toBe('John Doe');
      expect(parsed.exportId).toBeDefined();
    });

    it('should prevent export when not allowed', () => {
      const noExportManager = new ComplianceManager({
        ...policy,
        allowDataExport: false,
      });

      expect(() => {
        noExportManager.generateDataExport('user-6', {});
      }).toThrow('Data export not allowed');
    });

    it('should check data retention policy', () => {
      const manager = new ComplianceManager({
        ...policy,
        dataRetentionDays: 30,
      });

      const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago

      expect(manager.shouldDeleteOldData(recentDate)).toBe(false);
      expect(manager.shouldDeleteOldData(oldDate)).toBe(true);
    });

    it('should get compliance status', () => {
      const manager = new ComplianceManager(policy);
      const status = manager.getComplianceStatus();

      expect(status.gdprEnabled).toBe(true);
      expect(status.dataRetentionDays).toBe(90);
    });
  });

  describe('AuditLogger', () => {
    it('should log audit events', () => {
      const logger = new AuditLogger();
      logger.log('login', 'auth', 'success', 'user-1');
      logger.log('data_access', 'workspace', 'success', 'user-1');
      logger.log('failed_login', 'auth', 'failure', 'user-2');

      const events = logger.getEvents();
      expect(events.length).toBe(3);
      expect(events[0].action).toBe('login');
      expect(events[0].status).toBe('success');
    });

    it('should filter events by userId', () => {
      const logger = new AuditLogger();
      logger.log('login', 'auth', 'success', 'user-1');
      logger.log('login', 'auth', 'success', 'user-2');

      const user1Events = logger.getEvents({ userId: 'user-1' });
      expect(user1Events.length).toBe(1);
      expect(user1Events[0].userId).toBe('user-1');
    });

    it('should filter events by action', () => {
      const logger = new AuditLogger();
      logger.log('login', 'auth', 'success', 'user-1');
      logger.log('logout', 'auth', 'success', 'user-1');

      const loginEvents = logger.getEvents({ action: 'login' });
      expect(loginEvents.length).toBe(1);
      expect(loginEvents[0].action).toBe('login');
    });

    it('should filter events by status', () => {
      const logger = new AuditLogger();
      logger.log('login', 'auth', 'success', 'user-1');
      logger.log('unauthorized_access', 'admin', 'failure', 'user-2');

      const failureEvents = logger.getEvents({ status: 'failure' });
      expect(failureEvents.length).toBe(1);
      expect(failureEvents[0].status).toBe('failure');
    });

    it('should clear old events', (done) => {
      const logger = new AuditLogger();
      logger.log('old_action', 'test', 'success');

      setTimeout(() => {
        logger.log('new_action', 'test', 'success');

        const beforeClear = logger.getEvents();
        expect(beforeClear.length).toBe(2);

        logger.clearOldEvents(100); // Clear events older than 100ms
        const afterClear = logger.getEvents();
        expect(afterClear.length).toBe(1);
        expect(afterClear[0].action).toBe('new_action');

        done();
      }, 150);
    });

    it('should include event details', () => {
      const logger = new AuditLogger();
      const details = { ipAddress: '192.168.1.1', userAgent: 'Mozilla...' };

      logger.log('login', 'auth', 'success', 'user-1', details);

      const events = logger.getEvents();
      expect(events[0].details).toEqual(details);
    });
  });
});
