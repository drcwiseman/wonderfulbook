import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import winston from 'winston';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { healthCheckRuns, healthCheckItems } from '../../shared/schema.js';
import type { HealthCheckResult } from './index.js';

// Configure Winston logger for health checks (no secrets in logs)
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/health-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/health-combined.log' })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Initialize Stripe client
const actualSecretKey = process.env.VITE_STRIPE_PUBLIC_KEY;
const stripe = actualSecretKey ? new Stripe(actualSecretKey) : null;

export async function runHealthChecks(options: { source?: string } = {}): Promise<{
  runId: string;
  overallStatus: 'OK' | 'WARN' | 'FAIL';
  items: Array<{
    name: string;
    status: 'OK' | 'WARN' | 'FAIL';
    durationMs: number;
    message: string;
    meta: Record<string, any>;
  }>;
}> {
  const startTime = Date.now();
  logger.info('Starting health checks', { source: options.source });

  // Create health check run
  const [run] = await db.insert(healthCheckRuns).values({
    overallStatus: 'OK', // Will be updated
    summaryJson: { source: options.source || 'unknown' }
  }).returning();

  const checks = [
    { name: 'server', check: checkServer },
    { name: 'database', check: checkDatabase },
    { name: 'stripe', check: checkStripe },
    { name: 'smtp', check: checkSMTP },
    { name: 'storage', check: checkStorage },
    { name: 'external_api', check: checkExternalAPI },
  ];

  const results: Array<{
    name: string;
    status: 'OK' | 'WARN' | 'FAIL';
    durationMs: number;
    message: string;
    meta: Record<string, any>;
  }> = [];

  // Run all checks in parallel
  const checkPromises = checks.map(async ({ name, check }) => {
    try {
      const result = await check(options.source === 'manual');
      results.push({ name, ...result });
      
      // Store check item in database
      await db.insert(healthCheckItems).values({
        runId: run.id,
        name,
        status: result.status,
        durationMs: result.durationMs,
        message: result.message,
        metaJson: result.meta
      });

      return result;
    } catch (error) {
      const errorResult = {
        name,
        status: 'FAIL' as const,
        durationMs: 0,
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        meta: { error: error instanceof Error ? error.name : 'UnknownError' }
      };
      
      results.push(errorResult);
      
      await db.insert(healthCheckItems).values({
        runId: run.id,
        name,
        status: 'FAIL',
        durationMs: 0,
        message: errorResult.message,
        metaJson: errorResult.meta
      });

      logger.error('Health check failed', { name, error });
      return errorResult;
    }
  });

  await Promise.all(checkPromises);

  // Determine overall status
  const overallStatus = results.some(r => r.status === 'FAIL') ? 'FAIL' :
                       results.some(r => r.status === 'WARN') ? 'WARN' : 'OK';

  const totalDuration = Date.now() - startTime;

  // Update run with final status
  await db.update(healthCheckRuns)
    .set({
      finishedAt: new Date(),
      overallStatus,
      summaryJson: {
        source: options.source || 'unknown',
        totalDurationMs: totalDuration,
        checksRun: results.length,
        summary: results.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    })
    .where(sql`id = ${run.id}`);

  logger.info('Health checks completed', { 
    runId: run.id, 
    overallStatus, 
    totalDurationMs: totalDuration,
    results: results.map(r => ({ name: r.name, status: r.status, duration: r.durationMs }))
  });

  return {
    runId: run.id,
    overallStatus,
    items: results
  };
}

async function checkServer(isManual = false): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Self-HTTP check
    const port = process.env.PORT || 5000;
    const response = await axios.get(`http://localhost:${port}/api/health/ping`, {
      timeout: 2000
    });

    const durationMs = Date.now() - start;
    
    // Get system info
    const uptime = process.uptime();
    const nodeVersion = process.version;
    let loadAverage: number[] = [];
    
    try {
      if (os.platform() === 'linux') {
        loadAverage = os.loadavg();
      }
    } catch (error) {
      // Ignore load average errors on non-Linux systems
    }

    const meta = {
      nodeVersion,
      uptimeSeconds: Math.floor(uptime),
      loadAverage: loadAverage.length > 0 ? loadAverage : undefined,
      responseTime: durationMs
    };

    if (response.status === 200 && durationMs < 1000) {
      return {
        status: 'OK',
        durationMs,
        message: `Server responding in ${durationMs}ms`,
        meta
      };
    } else if (response.status === 200 && durationMs >= 1000) {
      return {
        status: 'WARN',
        durationMs,
        message: `Server responding slowly (${durationMs}ms)`,
        meta
      };
    } else {
      return {
        status: 'FAIL',
        durationMs,
        message: `Server returned status ${response.status}`,
        meta
      };
    }
  } catch (error) {
    const durationMs = Date.now() - start;
    return {
      status: 'FAIL',
      durationMs,
      message: `Server check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meta: { error: error instanceof Error ? error.name : 'UnknownError' }
    };
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Simple SELECT 1 test
    await db.execute(sql`SELECT 1`);
    
    // Test transaction
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT NOW()`);
      // Transaction will rollback automatically
    });

    const durationMs = Date.now() - start;
    
    if (durationMs < 100) {
      return {
        status: 'OK',
        durationMs,
        message: `Database responding in ${durationMs}ms`,
        meta: { latency: durationMs }
      };
    } else if (durationMs < 1000) {
      return {
        status: 'WARN',
        durationMs,
        message: `Database responding slowly (${durationMs}ms)`,
        meta: { latency: durationMs }
      };
    } else {
      return {
        status: 'FAIL',
        durationMs,
        message: `Database too slow (${durationMs}ms)`,
        meta: { latency: durationMs }
      };
    }
  } catch (error) {
    const durationMs = Date.now() - start;
    return {
      status: 'FAIL',
      durationMs,
      message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meta: { error: error instanceof Error ? error.name : 'UnknownError' }
    };
  }
}

async function checkStripe(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  if (!stripe) {
    return {
      status: 'FAIL',
      durationMs: 0,
      message: 'Stripe client not configured',
      meta: { configured: false }
    };
  }

  try {
    // Check Stripe balance - this verifies API key and connectivity
    const balance = await stripe.balance.retrieve();
    const durationMs = Date.now() - start;
    
    if (durationMs < 3000) {
      return {
        status: 'OK',
        durationMs,
        message: `Stripe API responding in ${durationMs}ms`,
        meta: { 
          available: balance.available?.length || 0,
          pending: balance.pending?.length || 0,
          responseTime: durationMs
        }
      };
    } else {
      return {
        status: 'WARN',
        durationMs,
        message: `Stripe API responding slowly (${durationMs}ms)`,
        meta: { responseTime: durationMs }
      };
    }
  } catch (error) {
    const durationMs = Date.now() - start;
    return {
      status: 'FAIL',
      durationMs,
      message: `Stripe check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meta: { error: error instanceof Error ? error.name : 'UnknownError' }
    };
  }
}

async function checkSMTP(isManual = false): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_USE_SSL === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (!config.host || !config.auth.user || !config.auth.pass) {
      return {
        status: 'FAIL',
        durationMs: 0,
        message: 'SMTP configuration incomplete',
        meta: { configured: false }
      };
    }

    const transporter = nodemailer.createTransport(config);
    
    // Verify SMTP connection
    await transporter.verify();
    
    const durationMs = Date.now() - start;
    
    // Send test email if configured and manual run
    if (isManual && process.env.HEALTH_TEST_EMAIL) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || config.auth.user,
          to: process.env.HEALTH_TEST_EMAIL,
          subject: '[Health Check] SMTP Test Email',
          text: `This is a test email from the health monitoring system.\n\nSent at: ${new Date().toISOString()}\nDuration: ${durationMs}ms`
        });
        
        return {
          status: 'OK',
          durationMs,
          message: `SMTP verified and test email sent in ${durationMs}ms`,
          meta: { testEmailSent: true, responseTime: durationMs }
        };
      } catch (emailError) {
        return {
          status: 'WARN',
          durationMs,
          message: `SMTP verified but test email failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
          meta: { testEmailSent: false, responseTime: durationMs }
        };
      }
    }
    
    if (durationMs < 2000) {
      return {
        status: 'OK',
        durationMs,
        message: `SMTP verified in ${durationMs}ms`,
        meta: { responseTime: durationMs }
      };
    } else {
      return {
        status: 'WARN',
        durationMs,
        message: `SMTP verified but slow (${durationMs}ms)`,
        meta: { responseTime: durationMs }
      };
    }
  } catch (error) {
    const durationMs = Date.now() - start;
    return {
      status: 'FAIL',
      durationMs,
      message: `SMTP check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meta: { error: error instanceof Error ? error.name : 'UnknownError' }
    };
  }
}

async function checkStorage(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const storagePath = process.env.HEALTH_STORAGE_PATH || './uploads';
    const testFile = path.join(storagePath, `health-check-${Date.now()}.tmp`);
    const testContent = `Health check test file created at ${new Date().toISOString()}`;
    
    // Ensure directory exists
    await fs.mkdir(storagePath, { recursive: true });
    
    // Write test file
    await fs.writeFile(testFile, testContent, 'utf8');
    
    // Read test file back
    const readContent = await fs.readFile(testFile, 'utf8');
    
    // Verify content matches
    if (readContent !== testContent) {
      throw new Error('File content mismatch');
    }
    
    // Clean up test file
    await fs.unlink(testFile);
    
    const durationMs = Date.now() - start;
    
    if (durationMs < 100) {
      return {
        status: 'OK',
        durationMs,
        message: `Storage I/O completed in ${durationMs}ms`,
        meta: { path: storagePath, responseTime: durationMs }
      };
    } else if (durationMs < 1000) {
      return {
        status: 'WARN',
        durationMs,
        message: `Storage I/O slow (${durationMs}ms)`,
        meta: { path: storagePath, responseTime: durationMs }
      };
    } else {
      return {
        status: 'FAIL',
        durationMs,
        message: `Storage I/O too slow (${durationMs}ms)`,
        meta: { path: storagePath, responseTime: durationMs }
      };
    }
  } catch (error) {
    const durationMs = Date.now() - start;
    return {
      status: 'FAIL',
      durationMs,
      message: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meta: { error: error instanceof Error ? error.name : 'UnknownError' }
    };
  }
}

async function checkExternalAPI(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const pingUrl = process.env.HEALTH_PING_URL || 'https://api.ipify.org';
    const response = await axios.get(pingUrl, { timeout: 3000 });
    
    const durationMs = Date.now() - start;
    
    if (response.status === 200 && durationMs < 2000) {
      return {
        status: 'OK',
        durationMs,
        message: `External API responding in ${durationMs}ms`,
        meta: { url: pingUrl, responseTime: durationMs, status: response.status }
      };
    } else if (response.status === 200 && durationMs >= 2000) {
      return {
        status: 'WARN',
        durationMs,
        message: `External API responding slowly (${durationMs}ms)`,
        meta: { url: pingUrl, responseTime: durationMs, status: response.status }
      };
    } else {
      return {
        status: 'FAIL',
        durationMs,
        message: `External API returned status ${response.status}`,
        meta: { url: pingUrl, responseTime: durationMs, status: response.status }
      };
    }
  } catch (error) {
    const durationMs = Date.now() - start;
    return {
      status: 'FAIL',
      durationMs,
      message: `External API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meta: { 
        url: process.env.HEALTH_PING_URL || 'https://api.ipify.org',
        error: error instanceof Error ? error.name : 'UnknownError' 
      }
    };
  }
}