import { resolvers, typeDefs } from './schema';

describe('GraphQL Schema', () => {
  it('should define queries', () => {
    expect(typeDefs).toContain('type Query');
    expect(typeDefs).toContain('users');
    expect(typeDefs).toContain('files');
    expect(typeDefs).toContain('notifications');
  });

  it('should define mutations', () => {
    expect(typeDefs).toContain('type Mutation');
    expect(typeDefs).toContain('createUser');
    expect(typeDefs).toContain('uploadFile');
    expect(typeDefs).toContain('registerWebhook');
  });

  it('should define subscriptions', () => {
    expect(typeDefs).toContain('type Subscription');
    expect(typeDefs).toContain('notificationReceived');
    expect(typeDefs).toContain('fileUploaded');
  });

  it('should define scalar types', () => {
    expect(typeDefs).toContain('scalar DateTime');
    expect(typeDefs).toContain('scalar JSON');
  });

  it('should define enums', () => {
    expect(typeDefs).toContain('enum UserRole');
    expect(typeDefs).toContain('enum NotificationStatus');
  });
});

describe('GraphQL Resolvers', () => {
  const mockContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    services: {
      userService: {},
      fileService: {},
      notificationService: {},
      webhookService: {},
    },
  };

  describe('Query', () => {
    it('should resolve users query', async () => {
      const result = await resolvers.Query.users({}, {}, mockContext);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should resolve files query', async () => {
      const result = await resolvers.Query.files(
        {},
        { limit: 10 },
        mockContext
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should resolve notifications query', async () => {
      const result = await resolvers.Query.notifications({}, {}, mockContext);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should resolve auditLogs query', async () => {
      const result = await resolvers.Query.auditLogs({}, {}, mockContext);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should resolve webhooks query', async () => {
      const result = await resolvers.Query.webhooks({}, {}, mockContext);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Mutation', () => {
    it('should resolve createUser mutation', async () => {
      const result = await resolvers.Mutation.createUser(
        {},
        {
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        mockContext
      );

      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.role).toBe('USER');
      expect(result.tenantId).toBe('tenant-1');
    });

    it('should resolve uploadFile mutation', async () => {
      const result = await resolvers.Mutation.uploadFile(
        {},
        {
          name: 'document.pdf',
          size: 2048,
          type: 'application/pdf',
        },
        mockContext
      );

      expect(result.name).toBe('document.pdf');
      expect(result.size).toBe(2048);
      expect(result.type).toBe('application/pdf');
    });

    it('should resolve sendNotification mutation', async () => {
      const result = await resolvers.Mutation.sendNotification(
        {},
        {
          userId: 'user-1',
          title: 'Test Notification',
          message: 'This is a test',
        },
        mockContext
      );

      expect(result.userId).toBe('user-1');
      expect(result.title).toBe('Test Notification');
      expect(result.status).toBe('SENT');
    });

    it('should resolve registerWebhook mutation', async () => {
      const result = await resolvers.Mutation.registerWebhook(
        {},
        {
          url: 'https://example.com/webhook',
          events: ['FILE_CREATED'],
        },
        mockContext
      );

      expect(result.url).toBe('https://example.com/webhook');
      expect(result.events).toContain('FILE_CREATED');
      expect(result.active).toBe(true);
    });

    it('should resolve deleteWebhook mutation', async () => {
      const result = await resolvers.Mutation.deleteWebhook(
        {},
        { id: 'webhook-1' },
        mockContext
      );

      expect(result).toBe(true);
    });
  });
});
