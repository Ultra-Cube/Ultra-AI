/**
 * Webhooks Service (Phase 16)
 * Manage webhook subscriptions and event delivery
 */

import { PrismaClient } from '@prisma/client';

export interface StoredWebhook {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  active: boolean;
  headers: Record<string, string> | null;
  retryPolicy: { maxRetries: number; backoffMs: number } | null;
  failureCount: number;
  lastFailedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  active?: boolean;
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface WebhookEvent {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
}

export class WebhookService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Register a webhook
   */
  async registerWebhook(
    tenantId: string,
    config: WebhookConfig
  ): Promise<StoredWebhook> {
    // In production, this would use actual Webhook model from Prisma
    // For now, we'll return a mock
    return {
      id: Math.random().toString(),
      tenantId,
      url: config.url,
      events: config.events as any,
      active: config.active !== false,
      headers: config.headers as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryPolicy: config.retryPolicy as any,
      failureCount: 0,
      lastFailedAt: null,
    };
  }

  /**
   * Send webhook event
   */
  async sendWebhook(
    webhook: StoredWebhook,
    event: WebhookEvent
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    // In production, implement actual HTTP delivery logic
    try {
      // Simulate HTTP POST to webhook URL
      console.log(`Sending webhook to ${webhook.url}`, event);
      return { success: true, statusCode: 200 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Trigger webhook event to all subscribed webhooks
   */
  async triggerEvent(
    tenantId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<void> {
    // Find webhooks subscribed to this event
    const webhooks: StoredWebhook[] = []; // In production: await this.prisma.webhook.findMany()

    const event: WebhookEvent = {
      type: eventType,
      timestamp: new Date(),
      data,
    };

    for (const webhook of webhooks) {
      if (webhook.events.includes(eventType)) {
        await this.sendWebhook(webhook, event);
      }
    }
  }

  /**
   * Get webhook deliveries (history)
   */
  async getDeliveries(
    _webhookId: string,
    _limit: number = 50
  ): Promise<
    Array<{
      id: string;
      eventType: string;
      statusCode?: number;
      success: boolean;
      timestamp: Date;
    }>
  > {
    // In production: return from WebhookDelivery model
    return [];
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(_webhookId: string): Promise<void> {
    // In production: await this.prisma.webhook.delete()
  }

  /**
   * Get tenant webhooks
   */
  async getTenantWebhooks(tenantId: string): Promise<StoredWebhook[]> {
    void tenantId;
    // In production: return await this.prisma.webhook.findMany()
    return [];
  }
}
