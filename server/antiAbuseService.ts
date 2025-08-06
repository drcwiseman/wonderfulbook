import { db } from "./db";
import { 
  users, 
  freeTrialAbusePrevention, 
  signupAttempts,
  type User 
} from "@shared/schema";
import { eq, and, gte, count, desc, or } from "drizzle-orm";

export interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookiesEnabled: boolean;
}

export interface RegistrationAttempt {
  email: string;
  ip: string;
  deviceFingerprint?: string;
  userAgent?: string;
}

export class AntiAbuseService {
  
  // Generate a simple device fingerprint hash
  private generateFingerprint(fingerprint: DeviceFingerprint): string {
    const fingerprintString = `${fingerprint.userAgent}-${fingerprint.platform}-${fingerprint.screenResolution}-${fingerprint.timezone}`;
    // Simple hash function (in production, use a proper crypto hash)
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Extract email domain for tracking
  private extractEmailDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || '';
  }

  // Check if IP has too many recent signup attempts
  async checkIpRateLimit(ip: string): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
    const oneHour = new Date(Date.now() - 60 * 60 * 1000);
    const oneDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Check for active blocks
    const activeBlock = await db
      .select()
      .from(signupAttempts)
      .where(
        and(
          eq(signupAttempts.registrationIp, ip),
          gte(signupAttempts.blockUntil, new Date())
        )
      )
      .limit(1);

    if (activeBlock.length > 0) {
      const blockUntil = activeBlock[0].blockUntil;
      const retryAfter = blockUntil ? Math.ceil((blockUntil.getTime() - Date.now()) / 1000) : 3600;
      return { 
        allowed: false, 
        reason: "IP temporarily blocked due to suspicious activity",
        retryAfter 
      };
    }

    // Count recent attempts from this IP
    const recentAttempts = await db
      .select({ count: count() })
      .from(signupAttempts)
      .where(
        and(
          eq(signupAttempts.registrationIp, ip),
          gte(signupAttempts.attemptedAt, oneHour)
        )
      );

    const hourlyAttempts = recentAttempts[0]?.count || 0;
    
    // Allow max 3 attempts per hour from same IP
    if (hourlyAttempts >= 3) {
      // Create a temporary block (1 hour)
      const blockUntil = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(signupAttempts).values({
        registrationIp: ip,
        attemptedAt: new Date(),
        successful: false,
        blockUntil
      });
      
      return { 
        allowed: false, 
        reason: "Too many signup attempts. Please try again later.",
        retryAfter: 3600 
      };
    }

    // Count daily attempts
    const dailyAttempts = await db
      .select({ count: count() })
      .from(signupAttempts)
      .where(
        and(
          eq(signupAttempts.registrationIp, ip),
          gte(signupAttempts.attemptedAt, oneDay)
        )
      );

    const dayAttempts = dailyAttempts[0]?.count || 0;
    
    // Allow max 5 attempts per day from same IP
    if (dayAttempts >= 5) {
      const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.insert(signupAttempts).values({
        registrationIp: ip,
        attemptedAt: new Date(),
        successful: false,
        blockUntil
      });
      
      return { 
        allowed: false, 
        reason: "Daily signup limit reached. Please try again tomorrow.",
        retryAfter: 86400 
      };
    }

    return { allowed: true };
  }

  // Check if user has already used free trial (multiple methods)
  async checkFreeTrialEligibility(attempt: RegistrationAttempt): Promise<{ 
    eligible: boolean; 
    reason?: string; 
    conflictType?: string;
  }> {
    const email = attempt.email.toLowerCase();
    const emailDomain = this.extractEmailDomain(email);
    
    // Check 1: Email already used for free trial
    const emailUsed = await db
      .select()
      .from(freeTrialAbusePrevention)
      .where(eq(freeTrialAbusePrevention.email, email))
      .limit(1);

    if (emailUsed.length > 0) {
      return { 
        eligible: false, 
        reason: "Free trial already used with this email address",
        conflictType: "email"
      };
    }

    // Check 2: Same IP used for free trial recently (within 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ipUsed = await db
      .select()
      .from(freeTrialAbusePrevention)
      .where(
        and(
          eq(freeTrialAbusePrevention.registrationIp, attempt.ip),
          gte(freeTrialAbusePrevention.freeTrialStartedAt, thirtyDaysAgo)
        )
      )
      .limit(1);

    if (ipUsed.length > 0) {
      return { 
        eligible: false, 
        reason: "Free trial already used from this location recently",
        conflictType: "ip"
      };
    }

    // Check 3: Device fingerprint already used
    if (attempt.deviceFingerprint) {
      const fingerprintUsed = await db
        .select()
        .from(freeTrialAbusePrevention)
        .where(
          and(
            eq(freeTrialAbusePrevention.deviceFingerprint, attempt.deviceFingerprint),
            gte(freeTrialAbusePrevention.freeTrialStartedAt, thirtyDaysAgo)
          )
        )
        .limit(1);

      if (fingerprintUsed.length > 0) {
        return { 
          eligible: false, 
          reason: "Free trial already used on this device",
          conflictType: "device"
        };
      }
    }

    // Check 4: Too many trials from same email domain (prevent disposable emails)
    const domainCount = await db
      .select({ count: count() })
      .from(freeTrialAbusePrevention)
      .where(
        and(
          eq(freeTrialAbusePrevention.emailDomain, emailDomain),
          gte(freeTrialAbusePrevention.freeTrialStartedAt, thirtyDaysAgo)
        )
      );

    const domainTrials = domainCount[0]?.count || 0;
    
    // Allow max 2 trials per domain per 30 days (to allow family members)
    if (domainTrials >= 2) {
      return { 
        eligible: false, 
        reason: "Too many free trials from this email domain",
        conflictType: "domain"
      };
    }

    return { eligible: true };
  }

  // Record a successful free trial start
  async recordFreeTrialStart(
    user: User, 
    ip: string, 
    deviceFingerprint?: string
  ): Promise<void> {
    const email = user.email?.toLowerCase();
    if (!email) return;

    const emailDomain = this.extractEmailDomain(email);
    const freeTrialStartedAt = new Date();
    const freeTrialEndedAt = new Date(freeTrialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Record in abuse prevention table
    await db.insert(freeTrialAbusePrevention).values({
      email,
      emailDomain,
      registrationIp: ip,
      deviceFingerprint,
      userId: user.id,
      freeTrialStartedAt,
      freeTrialEndedAt
    });

    // Update user record
    await db
      .update(users)
      .set({
        freeTrialUsed: true,
        freeTrialStartedAt,
        freeTrialEndedAt,
        registrationIp: ip,
        deviceFingerprint,
        subscriptionTier: "free",
        subscriptionStatus: "active",
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Record successful signup attempt
    await db.insert(signupAttempts).values({
      email,
      registrationIp: ip,
      deviceFingerprint,
      attemptedAt: new Date(),
      successful: true
    });
  }

  // Record failed signup attempt
  async recordFailedSignup(attempt: RegistrationAttempt): Promise<void> {
    await db.insert(signupAttempts).values({
      email: attempt.email,
      registrationIp: attempt.ip,
      deviceFingerprint: attempt.deviceFingerprint,
      attemptedAt: new Date(),
      successful: false
    });
  }

  // Check if free trial has expired for a user
  async checkFreeTrialExpired(userId: string): Promise<boolean> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0] || !user[0].freeTrialEndedAt) return false;

    return new Date() > user[0].freeTrialEndedAt;
  }

  // Get abuse statistics for admin dashboard
  async getAbuseStatistics(): Promise<{
    totalSignupAttempts: number;
    blockedAttempts: number;
    freeTrialsUsed: number;
    topAbusiveIps: Array<{ ip: string; attempts: number }>;
    topAbusiveDomains: Array<{ domain: string; trials: number }>;
  }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Total signup attempts in last 7 days
    const totalAttempts = await db
      .select({ count: count() })
      .from(signupAttempts)
      .where(gte(signupAttempts.attemptedAt, sevenDaysAgo));

    // Blocked attempts
    const blockedAttempts = await db
      .select({ count: count() })
      .from(signupAttempts)
      .where(
        and(
          gte(signupAttempts.attemptedAt, sevenDaysAgo),
          eq(signupAttempts.successful, false)
        )
      );

    // Free trials used
    const freeTrialsUsed = await db
      .select({ count: count() })
      .from(freeTrialAbusePrevention)
      .where(gte(freeTrialAbusePrevention.freeTrialStartedAt, sevenDaysAgo));

    // Top abusive IPs (placeholder - would need proper grouping)
    const topAbusiveIps: Array<{ ip: string; attempts: number }> = [];

    // Top abusive domains (placeholder - would need proper grouping)
    const topAbusiveDomains: Array<{ domain: string; trials: number }> = [];

    return {
      totalSignupAttempts: totalAttempts[0]?.count || 0,
      blockedAttempts: blockedAttempts[0]?.count || 0,
      freeTrialsUsed: freeTrialsUsed[0]?.count || 0,
      topAbusiveIps,
      topAbusiveDomains
    };
  }

  // Clean up old records (run periodically)
  async cleanupOldRecords(): Promise<void> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Clean up old signup attempts
    await db
      .delete(signupAttempts)
      .where(gte(signupAttempts.attemptedAt, ninetyDaysAgo));

    // Note: Keep freeTrialAbusePrevention records longer for better abuse detection
  }
}

export const antiAbuseService = new AntiAbuseService();