import { Router } from 'express';
import { runHealthChecks } from './checks.js';
import { sendHealthAlert } from './alerts.js';
import { getSchedulerStatus } from './scheduler.js';
import { getLatestHealthRun, getHealthRunHistory, getHealthStats, cleanupOldHealthRuns } from './store.js';
import { requireAdmin } from '../middleware/auth.js';

export const healthRouter = Router();

// Public health check ping endpoint
healthRouter.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public load balancer endpoint
healthRouter.get('/healthz', async (req, res) => {
  try {
    const latest = await getLatestHealthRun();
    
    if (!latest) {
      // No health checks run yet, assume healthy
      res.status(200).json({ status: 'ok' });
      return;
    }

    if (latest.overallStatus === 'FAIL') {
      res.status(503).json({ status: 'unavailable' });
    } else {
      res.status(200).json({ status: 'ok' });
    }
  } catch (error) {
    res.status(503).json({ status: 'unavailable' });
  }
});

// API endpoint for latest health status
healthRouter.get('/api/health', async (req, res) => {
  try {
    const latest = await getLatestHealthRun();
    
    if (!latest) {
      res.status(404).json({ message: 'No health checks available' });
      return;
    }

    res.json({
      runId: latest.id,
      overall: latest.overallStatus,
      startedAt: latest.startedAt,
      finishedAt: latest.finishedAt,
      summary: latest.summaryJson,
      items: latest.items.map(item => ({
        name: item.name,
        status: item.status,
        duration: item.durationMs,
        message: item.message,
        meta: item.metaJson
      }))
    });
  } catch (error) {
    console.error('Error fetching health status:', error);
    res.status(500).json({ message: 'Failed to fetch health status' });
  }
});

// Super Admin health dashboard with detailed metrics (no auth for development)
healthRouter.get('/api/super-admin/health', async (req, res) => {
  try {
    const latest = await getLatestHealthRun();
    const stats = await getHealthStats(7);
    const schedulerStatus = getSchedulerStatus();
    const history = await getHealthRunHistory(1, 10);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      latest: latest,
      stats: stats,
      scheduler: schedulerStatus,
      recentHistory: history.runs,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        environment: process.env.NODE_ENV,
        port: process.env.PORT || 5000
      }
    });
  } catch (error) {
    console.error('Error fetching super admin health data:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch health data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Manual health check trigger (admin only)
healthRouter.post('/api/health/run', requireAdmin, async (req: any, res) => {
  try {
    const result = await runHealthChecks({ source: 'manual' });
    
    // Send alerts if necessary
    const failedChecks = result.items.filter(item => item.status === 'FAIL');
    if (result.overallStatus === 'FAIL' || result.overallStatus === 'OK') {
      // Don't await this - send alerts in background
      sendHealthAlert(
        result.overallStatus,
        failedChecks,
        {
          runId: result.runId,
          totalDuration: result.items.reduce((sum, item) => sum + item.durationMs, 0),
          timestamp: new Date()
        }
      ).catch(error => {
        console.error('Error sending health alerts:', error);
      });
    }

    res.json({
      runId: result.runId,
      overall: result.overallStatus,
      items: result.items.map(item => ({
        name: item.name,
        status: item.status,
        duration: item.durationMs,
        message: item.message,
        meta: item.meta
      }))
    });
  } catch (error) {
    console.error('Error running health checks:', error);
    res.status(500).json({ message: 'Failed to run health checks' });
  }
});

// Health dashboard (admin only)
healthRouter.get('/admin/health', requireAdmin, async (req: any, res) => {
  try {
    const latest = await getLatestHealthRun();
    const stats = await getHealthStats(7);
    const schedulerStatus = getSchedulerStatus();

    // Render EJS template
    res.render('health/dashboard', {
      title: 'System Health Dashboard',
      latest,
      stats,
      schedulerStatus,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading health dashboard:', error);
    res.status(500).send('Error loading health dashboard');
  }
});

// Health history (admin only)
healthRouter.get('/admin/health/history', requireAdmin, async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const history = await getHealthRunHistory(page, limit);

    res.render('health/history', {
      title: 'Health Check History',
      history: history.runs,
      pagination: {
        page,
        limit,
        total: history.total,
        totalPages: history.totalPages
      },
      user: req.user
    });
  } catch (error) {
    console.error('Error loading health history:', error);
    res.status(500).send('Error loading health history');
  }
});

// Health stats API (admin only)
healthRouter.get('/api/admin/health/stats', requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await getHealthStats(days);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching health stats:', error);
    res.status(500).json({ message: 'Failed to fetch health stats' });
  }
});

// Health history API (admin only)
healthRouter.get('/api/admin/health/history', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const history = await getHealthRunHistory(page, limit);
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching health history:', error);
    res.status(500).json({ message: 'Failed to fetch health history' });
  }
});

// Scheduler status (admin only)
healthRouter.get('/api/admin/health/scheduler', requireAdmin, async (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    res.status(500).json({ message: 'Failed to fetch scheduler status' });
  }
});

// Cleanup old health runs (admin only)
healthRouter.post('/api/admin/health/cleanup', requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.body.daysToKeep) || 30;
    const result = await cleanupOldHealthRuns(days);
    
    res.json({ 
      message: `Cleaned up ${result.deletedRuns} old health check runs`,
      deletedRuns: result.deletedRuns
    });
  } catch (error) {
    console.error('Error cleaning up health runs:', error);
    res.status(500).json({ message: 'Failed to cleanup health runs' });
  }
});