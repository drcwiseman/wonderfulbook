import * as cron from 'node-cron';
import { emailService } from './emailService.js';
import { db } from './db.js';
import { eq, and, lt, gte, isNotNull } from 'drizzle-orm';
import { users, emailLogs } from '../shared/schema.js';

class EmailScheduler {
  private isInitialized = false;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize email scheduler with all automated campaigns
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Cloud Run optimization: Skip SMTP verification in production to avoid blocking
      // SMTP will be verified when first email is sent
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (!isProduction) {
        // Only verify in development
        const isConnected = await emailService.verifyConnection();
        if (!isConnected) {
          console.error('SMTP connection failed - email features disabled');
          return;
        }
      }

      // Schedule trial reminder campaigns
      this.scheduleTrialReminders();

      // Schedule cleanup jobs  
      this.scheduleCleanupJobs();

      this.isInitialized = true;
      
      if (!isProduction) {
        console.log('📧 Email scheduler initialized successfully');
        console.log('📅 Scheduled jobs:', Array.from(this.scheduledJobs.keys()));
      }
    } catch (error) {
      console.error('Email scheduler init failed:', error);
    }
  }

  /**
   * Schedule trial reminder email campaigns
   */
  private scheduleTrialReminders(): void {
    // Send 3-day trial reminders daily at 10:00 AM
    const threeDayReminder = cron.schedule('0 10 * * *', async () => {
      console.log('📧 Running 3-day trial reminder campaign...');
      await this.sendTrialReminders(3);
    }, {
      scheduled: false,
      timezone: 'Europe/London' // UK timezone for easyJet-style branding
    });

    // Send 1-day trial reminders daily at 2:00 PM  
    const oneDayReminder = cron.schedule('0 14 * * *', async () => {
      console.log('📧 Running 1-day trial reminder campaign...');
      await this.sendTrialReminders(1);
    }, {
      scheduled: false,
      timezone: 'Europe/London'
    });

    // Store scheduled jobs for management
    this.scheduledJobs.set('trial_reminder_3_day', threeDayReminder);
    this.scheduledJobs.set('trial_reminder_1_day', oneDayReminder);

    // Start the jobs
    threeDayReminder.start();
    oneDayReminder.start();

    console.log('📧 Trial reminder campaigns scheduled:');
    console.log('  - 3-day reminders: Daily at 10:00 AM UK time');
    console.log('  - 1-day reminders: Daily at 2:00 PM UK time');
  }

  /**
   * Schedule cleanup jobs for old email logs
   */
  private scheduleCleanupJobs(): void {
    // Clean up old email logs weekly on Sunday at 3:00 AM
    const cleanupJob = cron.schedule('0 3 * * 0', async () => {
      console.log('📧 Running email logs cleanup...');
      await this.cleanupOldEmailLogs();
    }, {
      scheduled: false,
      timezone: 'Europe/London'
    });

    this.scheduledJobs.set('cleanup_email_logs', cleanupJob);
    cleanupJob.start();

    console.log('📧 Cleanup job scheduled: Weekly on Sunday at 3:00 AM UK time');
  }

  /**
   * Send trial reminder emails to users whose trials expire in X days
   */
  async sendTrialReminders(daysFromNow: number): Promise<void> {
    try {
      const usersToRemind = await emailService.getUsersWithTrialsExpiring(daysFromNow);
      
      if (usersToRemind.length === 0) {
        console.log(`📧 No users found with trials expiring in ${daysFromNow} days`);
        return;
      }

      console.log(`📧 Found ${usersToRemind.length} users with trials expiring in ${daysFromNow} days`);

      let sentCount = 0;
      let blockedCount = 0;
      let failedCount = 0;

      // Process users in batches to avoid overwhelming the SMTP server
      const batchSize = 10;
      for (let i = 0; i < usersToRemind.length; i += batchSize) {
        const batch = usersToRemind.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (user) => {
          // Check if we've already sent this reminder recently (prevent duplicates)
          const recentEmail = await this.hasRecentEmail(user.id, 'trial_reminder', daysFromNow);
          if (recentEmail) {
            console.log(`📧 Skipping duplicate reminder for user ${user.id}`);
            return 'duplicate';
          }

          const success = await emailService.sendTrialReminder(user, daysFromNow);
          return success ? 'sent' : 'failed';
        });

        const results = await Promise.all(batchPromises);
        
        results.forEach(result => {
          switch (result) {
            case 'sent':
              sentCount++;
              break;
            case 'failed':
              failedCount++;
              break;
            case 'duplicate':
              blockedCount++;
              break;
          }
        });

        // Add small delay between batches to be respectful to SMTP server
        if (i + batchSize < usersToRemind.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`📧 Trial reminder campaign (${daysFromNow} days) completed:`);
      console.log(`  - Sent: ${sentCount}`);
      console.log(`  - Blocked/Duplicates: ${blockedCount}`);
      console.log(`  - Failed: ${failedCount}`);

    } catch (error) {
      console.error(`❌ Error sending ${daysFromNow}-day trial reminders:`, error);
    }
  }

  /**
   * Check if user has received a specific email type recently (within 24 hours)
   */
  private async hasRecentEmail(userId: string, emailType: string, daysLeft?: number): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // For trial reminders, include days left in the subject to differentiate
    const subjectPattern = daysLeft 
      ? `%${daysLeft} day${daysLeft !== 1 ? 's' : ''} left%`
      : '%';

    const recentEmails = await db
      .select()
      .from(emailLogs)
      .where(
        and(
          eq(emailLogs.userId, userId),
          eq(emailLogs.emailType, emailType),
          eq(emailLogs.status, 'sent'),
          gte(emailLogs.sentAt, twentyFourHoursAgo),
          daysLeft ? sql`${emailLogs.subject} LIKE ${subjectPattern}` : undefined
        )
      )
      .limit(1);

    return recentEmails.length > 0;
  }

  /**
   * Clean up email logs older than 90 days
   */
  private async cleanupOldEmailLogs(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const deletedLogs = await db
        .delete(emailLogs)
        .where(lt(emailLogs.createdAt, ninetyDaysAgo))
        .returning({ id: emailLogs.id });

      console.log(`📧 Cleaned up ${deletedLogs.length} old email logs (older than 90 days)`);
    } catch (error) {
      console.error('❌ Error cleaning up email logs:', error);
    }
  }

  /**
   * Manually trigger a trial reminder campaign (for admin use)
   */
  async triggerTrialReminderManually(daysFromNow: number): Promise<{ sent: number; failed: number; blocked: number }> {
    console.log(`📧 Manually triggering ${daysFromNow}-day trial reminder campaign...`);
    
    const usersToRemind = await emailService.getUsersWithTrialsExpiring(daysFromNow);
    
    if (usersToRemind.length === 0) {
      return { sent: 0, failed: 0, blocked: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;
    let blockedCount = 0;

    for (const user of usersToRemind) {
      try {
        const success = await emailService.sendTrialReminder(user, daysFromNow);
        if (success) {
          sentCount++;
        } else {
          blockedCount++; // User may have unsubscribed
        }
      } catch (error) {
        console.error(`Failed to send reminder to ${user.email}:`, error);
        failedCount++;
      }
    }

    return { sent: sentCount, failed: failedCount, blocked: blockedCount };
  }

  /**
   * Send conversion success email (called from payment webhook)
   */
  async sendConversionEmail(userId: string, planName: string, planPrice: string): Promise<boolean> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        console.error(`User ${userId} not found for conversion email`);
        return false;
      }

      return await emailService.sendConversionSuccess(user[0], planName, planPrice);
    } catch (error) {
      console.error('Error sending conversion email:', error);
      return false;
    }
  }

  /**
   * Send cancellation confirmation email (called from payment webhook)
   */
  async sendCancellationEmail(userId: string, planName: string, endDate: string): Promise<boolean> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        console.error(`User ${userId} not found for cancellation email`);
        return false;
      }

      return await emailService.sendCancellationConfirmation(user[0], planName, endDate);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      return false;
    }
  }

  /**
   * Get scheduler status for admin dashboard
   */
  getStatus(): {
    initialized: boolean;
    activeJobs: string[];
    jobCount: number;
  } {
    return {
      initialized: this.isInitialized,
      activeJobs: Array.from(this.scheduledJobs.keys()),
      jobCount: this.scheduledJobs.size,
    };
  }

  /**
   * Stop all scheduled jobs (for graceful shutdown)
   */
  stopAll(): void {
    this.scheduledJobs.forEach((job, name) => {
      job.stop();
      console.log(`📧 Stopped email job: ${name}`);
    });
    
    this.scheduledJobs.clear();
    this.isInitialized = false;
    console.log('📧 Email scheduler stopped');
  }

  /**
   * Restart a specific job
   */
  restartJob(jobName: string): boolean {
    const job = this.scheduledJobs.get(jobName);
    if (job) {
      job.stop();
      job.start();
      console.log(`📧 Restarted email job: ${jobName}`);
      return true;
    }
    return false;
  }
}

// Create singleton instance
export const emailScheduler = new EmailScheduler();
export default emailScheduler;