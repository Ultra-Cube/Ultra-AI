/**
 * Advanced Search Service (Elasticsearch Integration)
 * Phase 15
 */

import { PrismaClient, File, User, AnalyticsEvent } from '@prisma/client';

export interface SearchQuery {
  q: string;
  type?: 'file' | 'user' | 'event' | 'all';
  tenantId?: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  score: number;
  metadata?: Record<string, any>;
}

export class AdvancedSearchService {
  // Elasticsearch client would be initialized here in production
  private searchIndex = new Map<string, SearchResult[]>();

  constructor(private prisma: PrismaClient) {}

  /**
   * Index a document for full-text search
   */
  async indexDocument(
    type: string,
    id: string,
    data: Record<string, any>
  ): Promise<void> {
    const key = `${type}:${id}`;
    const result: SearchResult = {
      id,
      type,
      title: data.name || data.title || data.email || '',
      description: data.description || data.message || '',
      score: 1.0,
      metadata: data,
    };
    this.searchIndex.set(key, [result]);
  }

  /**
   * Search across all document types
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const searchTerm = query.q.toLowerCase();
    const results: SearchResult[] = [];

    // Search files
    if (!query.type || query.type === 'file') {
      const files = await this.prisma.file.findMany({
        where: {
          ...(query.tenantId && { tenantId: query.tenantId }),
          OR: [{ name: { contains: searchTerm } }, { description: { contains: searchTerm } }],
        },
        take: query.limit || 20,
      });

      results.push(
        ...files.map((f) => ({
          id: f.id,
          type: 'file',
          title: f.name,
          description: f.description,
          score: 0.9,
          metadata: { size: f.size, mimeType: f.mimeType },
        }))
      );
    }

    // Search users
    if (!query.type || query.type === 'user') {
      const users = await this.prisma.user.findMany({
        where: {
          ...(query.tenantId && { tenantId: query.tenantId }),
          email: { contains: searchTerm },
        },
        take: query.limit || 20,
      });

      results.push(
        ...users.map((u) => ({
          id: u.id,
          type: 'user',
          title: u.email,
          score: 0.8,
          metadata: { role: u.role },
        }))
      );
    }

    return results.sort((a, b) => b.score - a.score).slice(0, query.limit || 20);
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(prefix: string, type?: string): Promise<string[]> {
    if (type === 'file') {
      const files = await this.prisma.file.findMany({
        where: {
          name: { startsWith: prefix },
        },
        select: { name: true },
        take: 10,
      });
      return files.map((f) => f.name);
    }

    if (type === 'user') {
      const users = await this.prisma.user.findMany({
        where: {
          email: { startsWith: prefix },
        },
        select: { email: true },
        take: 10,
      });
      return users.map((u) => u.email);
    }

    return [];
  }

  /**
   * Clear search index (for testing/cleanup)
   */
  async clearIndex(): Promise<void> {
    this.searchIndex.clear();
  }
}
