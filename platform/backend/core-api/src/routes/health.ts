import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * Returns the API health status and current timestamp
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
