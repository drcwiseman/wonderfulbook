import cron from 'node-cron';
import winston from 'winston';
import { runHealthChecks } from './checks.js';
import { sendHealthAlert } from './alerts.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/health-scheduler.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

let healthCheckTask: cron.ScheduledTask | null = null;
let isRunning = false;

export function startHealthScheduler(): void {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Health scheduler disabled in test mode');
    return;
  }

  const cronPattern = process.env.HEALTH_CRON || '*/5 * * * *'; // Default: every 5 minutes

  if (healthCheckTask) {
    logger.info('Health scheduler already running');
    return;
  }

  logger.info('Starting health scheduler', { pattern: cronPattern });

  healthCheckTask = cron.schedule(cronPattern, async () => {
    if (isRunning) {
      logger.warn('Previous health check still running, skipping this iteration');
      return;
    }

    isRunning = true;
    
    try {
      logger.info('Running scheduled health checks');
      const result = await runHealthChecks({ source: 'scheduler' });
      
      // Send alerts if necessary
      const failedChecks = result.items.filter(item => item.status === 'FAIL');
      if (result.overallStatus === 'FAIL' || result.overallStatus === 'OK') {
        await sendHealthAlert(
          result.overallStatus,
          failedChecks,
          {
            runId: result.runId,
            totalDuration: result.items.reduce((sum, item) => sum + item.durationMs, 0),
            timestamp: new Date()
          }
        );
      }

      logger.info('Scheduled health checks completed', {
        runId: result.runId,
        overallStatus: result.overallStatus,
        itemCount: result.items.length,
        failedCount: failedChecks.length
      });
    } catch (error) {
      logger.error('Scheduled health check failed', { error });
    } finally {
      isRunning = false;
    }
  }, {
    scheduled: true,
    timezone: 'Europe/London'
  });

  logger.info('Health scheduler started successfully');
}

export function stopHealthScheduler(): void {
  if (healthCheckTask) {
    healthCheckTask.destroy();
    healthCheckTask = null;
    logger.info('Health scheduler stopped');
  }
}

export function getSchedulerStatus(): {
  isRunning: boolean;
  isHealthCheckRunning: boolean;
  cronPattern: string;
  nextExecution?: Date;
} {
  return {
    isRunning: !!healthCheckTask,
    isHealthCheckRunning: isRunning,
    cronPattern: process.env.HEALTH_CRON || '*/5 * * * *',
    nextExecution: healthCheckTask ? healthCheckTask.nextDate()?.toDate() : undefined
  };
}