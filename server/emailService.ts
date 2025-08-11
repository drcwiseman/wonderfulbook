import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import crypto from 'crypto';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { db } from './db.js';
import { 
  users, 
  emailPreferences, 
  emailLogs, 
  type User, 
  type EmailPreferences,
  type InsertEmailPreferences,
  type InsertEmailLog
} from '../shared/schema.js';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

// Email template data interfaces
interface BaseEmailData {
  firstName: string;
  lastName: string;
  email: string;
  unsubscribeUrl: string;
}

interface TrialReminderData extends BaseEmailData {
  daysLeft: number;
  trialEndDate: string;
  upgradeUrl: string;
}

interface ConversionSuccessData extends BaseEmailData {
  planName: string;
  planPrice: string;
  billingDate: string;
  accountUrl: string;
}

interface CancellationData extends BaseEmailData {
  planName: string;
  endDate: string;
  reactivateUrl: string;
}

interface VerificationData extends BaseEmailData {
  verificationUrl: string;
  fromEmail: string;
}

interface PasswordResetData extends BaseEmailData {
  resetUrl: string;
  fromEmail: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private config: EmailConfig;
  private templatesPath: string;

  constructor() {
    // Load SMTP configuration from environment variables with trimming
    this.config = {
      host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
      port: parseInt((process.env.SMTP_PORT || '587').trim()),
      secure: parseInt((process.env.SMTP_PORT || '587').trim()) === 465, // SSL for port 465, STARTTLS for 587
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').trim(), // Use SMTP_PASSWORD secret
      fromEmail: (process.env.EMAIL_FROM || process.env.SMTP_USER || '').trim(),
      fromName: 'Wonderful Books',
    };

    this.templatesPath = path.join(process.cwd(), 'server', 'email-templates');
    this.initializeTransporter();
  }

  /**
   * Initialize the nodemailer transporter
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
      tls: {
        // Accept self-signed certificates for private SMTP servers
        rejectUnauthorized: false,
      },
    });

    console.log('📧 Email service initialized with SMTP configuration');
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Get or create email preferences for a user
   */
  async getEmailPreferences(userId: string, email: string): Promise<EmailPreferences> {
    let preferences = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      // Create default preferences with unique unsubscribe token
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');
      
      const newPreferences: InsertEmailPreferences = {
        userId,
        email,
        unsubscribeToken,
        marketingEmails: true,
        trialReminders: true,
        subscriptionUpdates: true,
        isUnsubscribedAll: false,
      };

      const inserted = await db
        .insert(emailPreferences)
        .values(newPreferences)
        .returning();

      return inserted[0];
    }

    return preferences[0];
  }

  /**
   * Check if user can receive specific email type
   */
  async canSendEmail(userId: string, emailType: string): Promise<boolean> {
    const preferences = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      return true; // Default to allow if no preferences set
    }

    const prefs = preferences[0];

    // If globally unsubscribed, deny all emails
    if (prefs.isUnsubscribedAll) {
      return false;
    }

    // Check specific email type preferences
    switch (emailType) {
      case 'trial_reminder':
        return prefs.trialReminders ?? true;
      case 'conversion_success':
      case 'cancellation':
        return prefs.subscriptionUpdates ?? true;
      case 'marketing':
        return prefs.marketingEmails ?? true;
      default:
        return true; // Allow unknown types by default
    }
  }

  /**
   * Generate unsubscribe URL
   */
  generateUnsubscribeUrl(token: string): string {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPL_SLUG ?? 'app'}.${process.env.REPL_OWNER ?? 'user'}.replit.app`
      : 'http://localhost:3000';
    
    return `${baseUrl}/unsubscribe?token=${token}`;
  }

  /**
   * Render email template with data
   */
  async renderTemplate(templateName: string, data: any): Promise<{ html: string; text: string }> {
    try {
      const htmlTemplatePath = path.join(this.templatesPath, `${templateName}.html.ejs`);
      const textTemplatePath = path.join(this.templatesPath, `${templateName}.text.ejs`);

      const html = await ejs.renderFile(htmlTemplatePath, data);
      const text = await ejs.renderFile(textTemplatePath, data);

      return { html, text };
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      throw new Error(`Failed to render email template: ${templateName}`);
    }
  }

  /**
   * Log email attempt to database
   */
  async logEmail(logData: InsertEmailLog): Promise<void> {
    try {
      await db.insert(emailLogs).values(logData);
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Send email with template
   */
  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: any,
    emailType: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // Check if user can receive this email type (skip for test users)
      if (userId && !userId.startsWith('test-') && !(await this.canSendEmail(userId, emailType))) {
        console.log(`📧 Email blocked for user ${userId}, type: ${emailType}`);
        await this.logEmail({
          userId,
          email: to,
          emailType,
          subject,
          status: 'blocked',
          errorMessage: 'User has unsubscribed from this email type',
        });
        return false;
      }

      // Render email templates
      const { html, text } = await this.renderTemplate(templateName, templateData);

      // Send email
      const info = await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to,
        subject,
        html,
        text,
      });

      console.log(`📧 Email sent successfully to ${to}, Subject: ${subject}, MessageId: ${info.messageId}`);

      // Log successful send (skip for test users)
      if (!userId?.startsWith('test-')) {
        await this.logEmail({
          userId,
          email: to,
          emailType,
          subject,
          status: 'sent',
          sentAt: new Date(),
        });
      }

      return true;
    } catch (error) {
      console.error(`📧 Failed to send email to ${to}:`, error);

      // Log failed send (skip for test users)
      if (!userId?.startsWith('test-')) {
        await this.logEmail({
          userId,
          email: to,
          emailType,
          subject,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return false;
    }
  }

  /**
   * Send trial reminder email (3 days or 1 day before expiry)
   */
  async sendTrialReminder(user: User, daysLeft: number): Promise<boolean> {
    const preferences = await this.getEmailPreferences(user.id, user.email!);
    const unsubscribeUrl = this.generateUnsubscribeUrl(preferences.unsubscribeToken);

    const templateData: TrialReminderData = {
      firstName: user.firstName || 'Reader',
      lastName: user.lastName || '',
      email: user.email!,
      daysLeft,
      trialEndDate: user.freeTrialEndedAt?.toLocaleDateString() || 'soon',
      upgradeUrl: `${process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
        : 'http://localhost:3000'}/subscription`,
      unsubscribeUrl,
    };

    const subject = daysLeft === 1 
      ? '⏰ Your free trial ends tomorrow - Don\'t lose access!'
      : `📚 ${daysLeft} days left in your Wonderful Books trial`;

    return this.sendEmail(
      user.email!,
      subject,
      'trial-reminder',
      templateData,
      'trial_reminder',
      user.id
    );
  }

  /**
   * Send conversion success email (successful subscription)
   */
  async sendConversionSuccess(user: User, planName: string, planPrice: string): Promise<boolean> {
    const preferences = await this.getEmailPreferences(user.id, user.email!);
    const unsubscribeUrl = this.generateUnsubscribeUrl(preferences.unsubscribeToken);

    const templateData: ConversionSuccessData = {
      firstName: user.firstName || 'Reader',
      lastName: user.lastName || '',
      email: user.email!,
      planName,
      planPrice,
      billingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days from now
      accountUrl: `${process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
        : 'http://localhost:3000'}/account`,
      unsubscribeUrl,
    };

    return this.sendEmail(
      user.email!,
      `🎉 Welcome to ${planName} - Your subscription is active!`,
      'conversion-success',
      templateData,
      'conversion_success',
      user.id
    );
  }

  /**
   * Send cancellation confirmation email
   */
  async sendCancellationConfirmation(user: User, planName: string, endDate: string): Promise<boolean> {
    const preferences = await this.getEmailPreferences(user.id, user.email!);
    const unsubscribeUrl = this.generateUnsubscribeUrl(preferences.unsubscribeToken);

    const templateData: CancellationData = {
      firstName: user.firstName || 'Reader',
      lastName: user.lastName || '',
      email: user.email!,
      planName,
      endDate,
      reactivateUrl: `${process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
        : 'http://localhost:3000'}/subscription`,
      unsubscribeUrl,
    };

    return this.sendEmail(
      user.email!,
      'Subscription cancelled - We\'re sorry to see you go',
      'cancellation',
      templateData,
      'cancellation',
      user.id
    );
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(user: User): Promise<boolean> {
    if (!user.emailVerificationToken) {
      console.error('No email verification token found for user:', user.id);
      return false;
    }

    const preferences = await this.getEmailPreferences(user.id, user.email!);
    const unsubscribeUrl = this.generateUnsubscribeUrl(preferences.unsubscribeToken);
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
      : 'http://localhost:5000';
    
    const verificationUrl = `${baseUrl}/api/auth/verify-email/${user.emailVerificationToken}`;

    const templateData: VerificationData = {
      firstName: user.firstName || 'Reader',
      lastName: user.lastName || '',
      email: user.email!,
      verificationUrl,
      fromEmail: this.config.fromEmail,
      unsubscribeUrl,
    };

    return this.sendEmail(
      user.email!,
      '📧 Verify your email address - Wonderful Books',
      'verification',
      templateData,
      'email_verification',
      user.id
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user: User): Promise<boolean> {
    if (!user.passwordResetToken) {
      console.error('No password reset token found for user:', user.id);
      return false;
    }

    const preferences = await this.getEmailPreferences(user.id, user.email!);
    const unsubscribeUrl = this.generateUnsubscribeUrl(preferences.unsubscribeToken);
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`
      : 'http://localhost:5000';
    
    const resetUrl = `${baseUrl}/auth/reset-password?token=${user.passwordResetToken}`;

    const templateData: PasswordResetData = {
      firstName: user.firstName || 'Reader',
      lastName: user.lastName || '',
      email: user.email!,
      resetUrl,
      fromEmail: this.config.fromEmail,
      unsubscribeUrl,
    };

    return this.sendEmail(
      user.email!,
      '🔐 Reset your password - Wonderful Books',
      'password_reset',
      templateData,
      'password_reset',
      user.id
    );
  }

  /**
   * Get users with trials expiring in X days
   */
  async getUsersWithTrialsExpiring(daysFromNow: number): Promise<User[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    
    // Set to start of day for consistent comparison
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.subscriptionTier, 'free'),
          eq(users.subscriptionStatus, 'active'),
          eq(users.freeTrialUsed, true),
          gte(users.freeTrialEndedAt, startOfDay),
          lt(users.freeTrialEndedAt, endOfDay)
        )
      );
  }

  /**
   * Generate email preview for admin/development
   */
  async generateEmailPreview(templateType: string, userData: Partial<User>): Promise<{ html: string; text: string }> {
    const mockUser: User = {
      id: 'preview-user',
      email: userData.email || 'preview@example.com',
      firstName: userData.firstName || 'John',
      lastName: userData.lastName || 'Doe',
      profileImageUrl: null,
      username: null,
      passwordHash: null,
      emailVerified: true,
      emailVerificationToken: null,
      authProvider: 'local',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      booksReadThisMonth: 0,
      role: 'user',
      isActive: true,
      lastLoginAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      freeTrialUsed: true,
      freeTrialStartedAt: new Date(),
      freeTrialEndedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      registrationIp: null,
      deviceFingerprint: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const unsubscribeUrl = this.generateUnsubscribeUrl('preview-token-123');

    let templateData: any;
    let templateName: string;

    switch (templateType) {
      case 'trial_reminder':
        templateName = 'trial-reminder';
        templateData = {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          daysLeft: 3,
          trialEndDate: mockUser.freeTrialEndedAt?.toLocaleDateString(),
          upgradeUrl: '/subscription',
          unsubscribeUrl,
        };
        break;
      
      case 'conversion_success':
        templateName = 'conversion-success';
        templateData = {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          planName: 'Premium Plan',
          planPrice: '£9.99/month',
          billingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          accountUrl: '/account',
          unsubscribeUrl,
        };
        break;
      
      case 'cancellation':
        templateName = 'cancellation';
        templateData = {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          planName: 'Premium Plan',
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          reactivateUrl: '/subscription',
          unsubscribeUrl,
        };
        break;
      
      case 'email_verification':
        templateName = 'verification';
        templateData = {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          verificationUrl: '/auth/verify-email/mock-token-123',
          fromEmail: this.config.fromEmail,
          unsubscribeUrl,
        };
        break;
      
      case 'password_reset':
        templateName = 'password_reset';
        templateData = {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          resetUrl: '/auth/reset-password?token=mock-token-123',
          fromEmail: this.config.fromEmail,
          unsubscribeUrl,
        };
        break;

      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }

    return this.renderTemplate(templateName, templateData);
  }
}

export const emailService = new EmailService();
export default emailService;