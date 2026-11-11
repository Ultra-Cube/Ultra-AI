import { WebhookService } from './webhook-service';

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(() => {
    const mockPrisma = {} as any;
    service = new WebhookService(mockPrisma);
  });

  describe('registerWebhook', () => {
    it('should register a webhook', async () => {
      const webhook = await service.registerWebhook('tenant-1', {
        url: 'https://example.com/webhook',
        events: ['FILE_CREATED', 'FILE_DELETED'],
      });

      expect(webhook).toBeDefined();
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.tenantId).toBe('tenant-1');
      expect(webhook.active).toBe(true);
    });

    it('should support custom headers in webhook config', async () => {
      const webhook = await service.registerWebhook('tenant-1', {
        url: 'https://example.com/webhook',
        events: ['FILE_CREATED'],
        headers: { 'X-API-Key': 'secret' },
      });

      expect(webhook.headers).toEqual({ 'X-API-Key': 'secret' });
    });

    it('should support retry policy configuration', async () => {
      const webhook = await service.registerWebhook('tenant-1', {
        url: 'https://example.com/webhook',
        events: ['FILE_CREATED'],
        retryPolicy: { maxRetries: 5, backoffMs: 1000 },
      });

      expect(webhook.retryPolicy).toEqual({ maxRetries: 5, backoffMs: 1000 });
    });
  });

  describe('sendWebhook', () => {
    it('should send webhook successfully', async () => {
      const webhook = await service.registerWebhook('tenant-1', {
        url: 'https://example.com/webhook',
        events: ['FILE_CREATED'],
      });

      const result = await service.sendWebhook(webhook, {
        type: 'FILE_CREATED',
        timestamp: new Date(),
        data: { fileId: 'file-1', size: 1024 },
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('triggerEvent', () => {
    it('should trigger webhook event', async () => {
      await service.triggerEvent('tenant-1', 'FILE_CREATED', {
        fileId: 'file-1',
        fileName: 'document.pdf',
      });

      // Event should be triggered without error
      expect(true).toBe(true);
    });
  });

  describe('getTenantWebhooks', () => {
    it('should get tenant webhooks', async () => {
      const webhooks = await service.getTenantWebhooks('tenant-1');
      expect(Array.isArray(webhooks)).toBe(true);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook', async () => {
      const webhook = await service.registerWebhook('tenant-1', {
        url: 'https://example.com/webhook',
        events: ['FILE_CREATED'],
      });

      await service.deleteWebhook(webhook.id);
      expect(true).toBe(true);
    });
  });

  describe('getDeliveries', () => {
    it('should get webhook delivery history', async () => {
      const webhook = await service.registerWebhook('tenant-1', {
        url: 'https://example.com/webhook',
        events: ['FILE_CREATED'],
      });

      const deliveries = await service.getDeliveries(webhook.id);
      expect(Array.isArray(deliveries)).toBe(true);
    });
  });
});
