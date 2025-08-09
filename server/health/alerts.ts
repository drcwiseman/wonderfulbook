import nodemailer from 'nodemailer';
import winston from 'winston';
import { db } from '../db.js';
import { healthAlertState } from '../../shared/schema.js';
import { sql, eq, desc } from 'drizzle-orm';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/health-alerts.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// In-memory cache for cooldown tracking (fallback)
const alertCooldownCache = new Map<string, { lastSent: Date; status: string }>();

export async function sendHealthAlert(
  overallStatus: 'OK' | 'WARN' | 'FAIL',
  failedChecks: Array<{
    name: string;
    status: string;
    message: string;
    durationMs: number;
  }>,
  runSummary: {
    runId: string;
    totalDuration: number;
    timestamp: Date;
  }
): Promise<void> {
  const alertEmails = process.env.HEALTH_ALERT_EMAILS;
  if (!alertEmails) {
    logger.warn('No alert emails configured');
    return;
  }

  const cooldownMinutes = parseInt(process.env.HEALTH_ALERT_COOLDOWN_MIN || '30');
  const now = new Date();

  // Check if we should send an alert based on status change
  if (overallStatus === 'FAIL') {
    const canSendAlert = await checkAlertCooldown('system_failure', 'FAIL', cooldownMinutes);
    if (canSendAlert) {
      await sendFailureAlert(alertEmails, failedChecks, runSummary);
      await updateAlertState('system_failure', 'FAIL', cooldownMinutes);
    } else {
      logger.info('Failure alert suppressed due to cooldown');
    }
  } else if (overallStatus === 'OK') {
    // Check if we need to send a recovery alert
    const lastFailureAlert = await getLastAlertState('system_failure', 'FAIL');
    if (lastFailureAlert && lastFailureAlert.lastSentAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      await sendRecoveryAlert(alertEmails, runSummary);
      await updateAlertState('recovery', 'OK', cooldownMinutes);
      logger.info('Recovery alert sent');
    }
  }
}

async function checkAlertCooldown(
  alertType: string,
  status: string,
  cooldownMinutes: number
): Promise<boolean> {
  try {
    const lastAlert = await getLastAlertState(alertType, status);
    
    if (!lastAlert) {
      return true; // No previous alert, can send
    }

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceLastAlert = Date.now() - lastAlert.lastSentAt.getTime();
    
    return timeSinceLastAlert > cooldownMs;
  } catch (error) {
    logger.error('Error checking alert cooldown:', error);
    
    // Fallback to in-memory cache
    const cacheKey = `${alertType}_${status}`;
    const cached = alertCooldownCache.get(cacheKey);
    
    if (!cached) {
      return true;
    }

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceLastAlert = Date.now() - cached.lastSent.getTime();
    
    return timeSinceLastAlert > cooldownMs;
  }
}

async function getLastAlertState(alertType: string, status: string) {
  try {
    const [alert] = await db.select()
      .from(healthAlertState)
      .where(sql`alert_type = ${alertType} AND status = ${status}`)
      .orderBy(desc(healthAlertState.lastSentAt))
      .limit(1);
    
    return alert;
  } catch (error) {
    logger.error('Error fetching alert state:', error);
    return null;
  }
}

async function updateAlertState(alertType: string, status: string, cooldownMinutes: number) {
  try {
    await db.insert(healthAlertState).values({
      alertType,
      status,
      lastSentAt: new Date(),
      cooldownMinutes,
    });
    
    // Update in-memory cache as backup
    const cacheKey = `${alertType}_${status}`;
    alertCooldownCache.set(cacheKey, {
      lastSent: new Date(),
      status
    });
  } catch (error) {
    logger.error('Error updating alert state:', error);
    
    // Fallback to in-memory cache only
    const cacheKey = `${alertType}_${status}`;
    alertCooldownCache.set(cacheKey, {
      lastSent: new Date(),
      status
    });
  }
}

async function sendFailureAlert(
  alertEmails: string,
  failedChecks: Array<{ name: string; status: string; message: string; durationMs: number }>,
  runSummary: { runId: string; totalDuration: number; timestamp: Date }
) {
  const transporter = await createMailTransporter();
  
  const subject = '[ALERT] System Health: FAIL';
  
  const failureList = failedChecks
    .map(check => `- ${check.name}: ${check.status} (${check.durationMs}ms) - ${check.message}`)
    .join('\n');

  const htmlBody = `
    <h2 style="color: #dc2626;">🚨 System Health Alert</h2>
    <p><strong>Status:</strong> <span style="color: #dc2626;">FAILED</span></p>
    <p><strong>Timestamp:</strong> ${runSummary.timestamp.toISOString()}</p>
    <p><strong>Run ID:</strong> ${runSummary.runId}</p>
    <p><strong>Total Duration:</strong> ${runSummary.totalDuration}ms</p>
    
    <h3>Failed Components:</h3>
    <ul style="color: #dc2626;">
      ${failedChecks.map(check => 
        `<li><strong>${check.name}:</strong> ${check.status} (${check.durationMs}ms)<br/>
         <em>${check.message}</em></li>`
      ).join('')}
    </ul>
    
    <p><em>This alert will not be sent again for ${process.env.HEALTH_ALERT_COOLDOWN_MIN || 30} minutes unless the system recovers and fails again.</em></p>
  `;

  const textBody = `
SYSTEM HEALTH ALERT

Status: FAILED
Timestamp: ${runSummary.timestamp.toISOString()}
Run ID: ${runSummary.runId}
Total Duration: ${runSummary.totalDuration}ms

Failed Components:
${failureList}

This alert will not be sent again for ${process.env.HEALTH_ALERT_COOLDOWN_MIN || 30} minutes unless the system recovers and fails again.
  `;

  const recipients = alertEmails.split(',').map(email => email.trim());
  
  for (const email of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      logger.info('Failure alert sent', { email, runId: runSummary.runId });
    } catch (error) {
      logger.error('Failed to send alert email', { email, error });
    }
  }
}

async function sendRecoveryAlert(
  alertEmails: string,
  runSummary: { runId: string; totalDuration: number; timestamp: Date }
) {
  const transporter = await createMailTransporter();
  
  const subject = '[RECOVERY] System Health: OK';
  
  const htmlBody = `
    <h2 style="color: #16a34a;">✅ System Health Recovery</h2>
    <p><strong>Status:</strong> <span style="color: #16a34a;">RECOVERED</span></p>
    <p><strong>Timestamp:</strong> ${runSummary.timestamp.toISOString()}</p>
    <p><strong>Run ID:</strong> ${runSummary.runId}</p>
    <p><strong>Total Duration:</strong> ${runSummary.totalDuration}ms</p>
    
    <p>All system components are now functioning normally.</p>
  `;

  const textBody = `
SYSTEM HEALTH RECOVERY

Status: RECOVERED
Timestamp: ${runSummary.timestamp.toISOString()}
Run ID: ${runSummary.runId}
Total Duration: ${runSummary.totalDuration}ms

All system components are now functioning normally.
  `;

  const recipients = alertEmails.split(',').map(email => email.trim());
  
  for (const email of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      logger.info('Recovery alert sent', { email, runId: runSummary.runId });
    } catch (error) {
      logger.error('Failed to send recovery email', { email, error });
    }
  }
}

async function createMailTransporter() {
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
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport(config);
}