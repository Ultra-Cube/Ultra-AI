import { Router } from 'express';
import { ControlCenter } from '@ultra-ai/control-center';

export function createControlCenterRoutes(controlCenter: ControlCenter): Router {
  const router = Router();

  /**
   * GET /api/control-center/health
   * Check control center health
   */
  router.get('/health', async (req, res) => {
    try {
      const isRunning = controlCenter.isRunning();
      res.json({
        status: isRunning ? 'ok' : 'stopped',
        running: isRunning,
      });
    } catch (error) {
      res.status(500).json({ error: 'Health check failed' });
    }
  });

  /**
   * POST /api/control-center/start
   * Start control center
   */
  router.post('/start', async (req, res) => {
    try {
      await controlCenter.start();
      res.json({ message: 'Control center started successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start control center' });
    }
  });

  /**
   * POST /api/control-center/stop
   * Stop control center
   */
  router.post('/stop', async (req, res) => {
    try {
      await controlCenter.stop();
      res.json({ message: 'Control center stopped successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop control center' });
    }
  });

  /**
   * GET /api/control-center/directories
   * Get all monitored directories
   */
  router.get('/directories', async (req, res) => {
    try {
      const directories = await controlCenter.getDirectoryManager().getDirectories();
      res.json({ directories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch directories' });
    }
  });

  /**
   * POST /api/control-center/directories
   * Add a directory to monitor
   */
  router.post('/directories', async (req, res) => {
    try {
      const { path, name, permissions, monitored, autoBackup } = req.body;
      
      await controlCenter.getDirectoryManager().addDirectory({
        path,
        name,
        permissions: permissions || [],
        monitored: monitored !== false,
        autoBackup: autoBackup || false,
      });

      res.status(201).json({ message: 'Directory added successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add directory' });
    }
  });

  /**
   * DELETE /api/control-center/directories/:path
   * Remove a directory from monitoring
   */
  router.delete('/directories/:path', async (req, res) => {
    try {
      const { path } = req.params;
      await controlCenter.getDirectoryManager().removeDirectory(path);
      res.json({ message: 'Directory removed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove directory' });
    }
  });

  /**
   * GET /api/control-center/system-stats
   * Get system statistics
   */
  router.get('/system-stats', async (req, res) => {
    try {
      const stats = await controlCenter.getSystemMonitor().getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch system stats' });
    }
  });

  /**
   * GET /api/control-center/services
   * Get all services status
   */
  router.get('/services', async (req, res) => {
    try {
      const services = await controlCenter.getSystemMonitor().getServices();
      res.json({ services });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  /**
   * GET /api/control-center/config
   * Get control center configuration
   */
  router.get('/config', async (req, res) => {
    try {
      const config = controlCenter.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch config' });
    }
  });

  /**
   * PATCH /api/control-center/config
   * Update control center configuration
   */
  router.patch('/config', async (req, res) => {
    try {
      controlCenter.updateConfig(req.body);
      const config = controlCenter.getConfig();
      res.json({ message: 'Configuration updated successfully', config });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update config' });
    }
  });

  return router;
}