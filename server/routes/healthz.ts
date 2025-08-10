import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/healthz', async (req, res) => {
  // Set no-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  const startTime = Date.now();
  let dbStatus = 'down';
  
  try {
    // Test database connection with simple query
    await db.execute(sql`SELECT 1 as test`);
    dbStatus = 'up';
  } catch (error) {
    console.error('Health check database error:', error);
  }

  const responseTime = Date.now() - startTime;
  const isHealthy = dbStatus === 'up';

  const health = {
    ok: isHealthy,
    db: dbStatus,
    time: new Date().toISOString(),
    responseTimeMs: responseTime,
    version: process.env.APP_VERSION || '1.0.0',
    commit: process.env.GIT_COMMIT || 'unknown',
    env: process.env.NODE_ENV || 'development'
  };

  // Return appropriate HTTP status
  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

export { router as healthzRouter };