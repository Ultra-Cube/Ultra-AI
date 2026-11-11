/**
 * Advanced Search Service Tests
 */

import { AdvancedSearchService, SearchQuery } from './advanced-search-service';

const mockPrisma = {
  file: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

describe('AdvancedSearchService', () => {
  let service: AdvancedSearchService;

  beforeEach(() => {
    service = new AdvancedSearchService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should search files by name', async () => {
      mockPrisma.file.findMany.mockResolvedValue([
        {
          id: 'file-1',
          name: 'test-document',
          description: 'A test document',
          size: 1024,
          mimeType: 'application/pdf',
        },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const query: SearchQuery = { q: 'test' };
      const results = await service.search(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('file');
      expect(results[0].title).toBe('test-document');
    });

    it('should search users by email', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'test@example.com', role: 'ADMIN' },
      ]);

      const query: SearchQuery = { q: 'test', type: 'user' };
      const results = await service.search(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('user');
    });

    it('should filter by tenant', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const query: SearchQuery = { q: 'test', tenantId: 'tenant-1' };
      await service.search(query);

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        })
      );
    });
  });

  describe('getSuggestions', () => {
    it('should return file name suggestions', async () => {
      mockPrisma.file.findMany.mockResolvedValue([
        { name: 'test-file-1' },
        { name: 'test-file-2' },
      ]);

      const suggestions = await service.getSuggestions('test', 'file');

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toBe('test-file-1');
    });

    it('should return email suggestions', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { email: 'test@example.com' },
      ]);

      const suggestions = await service.getSuggestions('test', 'user');

      expect(suggestions[0]).toBe('test@example.com');
    });
  });

  describe('indexDocument', () => {
    it('should index a document', async () => {
      await service.indexDocument('file', 'file-1', {
        name: 'test',
        description: 'Test doc',
      });

      await service.clearIndex();
    });
  });
});
