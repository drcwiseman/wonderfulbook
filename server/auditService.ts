import { storage } from "./storage";
import type { InsertAuditLog } from "@shared/schema";

export class AuditService {
  /**
   * Log a user action to the audit trail
   */
  static async logAction(data: {
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    status?: 'success' | 'failure' | 'warning';
    sessionId?: string;
  }) {
    const logEntry: InsertAuditLog = {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: data.details ? JSON.parse(JSON.stringify(data.details)) : null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.severity || 'info',
      status: data.status || 'success',
      sessionId: data.sessionId,
    };

    try {
      return await storage.createAuditLog(logEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(data: {
    userId?: string;
    action: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_reset' | 'email_verification';
    ipAddress?: string;
    userAgent?: string;
    details?: any;
    sessionId?: string;
  }) {
    const severity = data.action.includes('failure') ? 'warning' : 'info';
    const status = data.action.includes('failure') ? 'failure' : 'success';

    return this.logAction({
      userId: data.userId,
      action: data.action,
      resource: 'auth',
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity,
      status,
      sessionId: data.sessionId,
    });
  }

  /**
   * Log book access and reading events
   */
  static async logBookAccess(data: {
    userId: string;
    bookId: string;
    action: 'book_view' | 'book_open' | 'book_download' | 'reading_progress' | 'bookmark_created';
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    return this.logAction({
      userId: data.userId,
      action: data.action,
      resource: 'book',
      resourceId: data.bookId,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: 'info',
      status: 'success',
      sessionId: data.sessionId,
    });
  }

  /**
   * Log subscription and payment events
   */
  static async logSubscription(data: {
    userId: string;
    action: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'payment_success' | 'payment_failed';
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    const severity = data.action.includes('failed') || data.action.includes('cancelled') ? 'warning' : 'info';
    const status = data.action.includes('failed') ? 'failure' : 'success';

    return this.logAction({
      userId: data.userId,
      action: data.action,
      resource: 'subscription',
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity,
      status,
      sessionId: data.sessionId,
    });
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(data: {
    adminUserId: string;
    action: 'admin_login' | 'user_modified' | 'book_added' | 'book_deleted' | 'subscription_modified' | 'system_config_changed';
    resource?: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    return this.logAction({
      userId: data.adminUserId,
      action: data.action,
      resource: data.resource || 'admin',
      resourceId: data.resourceId,
      details: {
        ...data.details,
        admin_action: true,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: 'info',
      status: 'success',
      sessionId: data.sessionId,
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(data: {
    userId?: string;
    action: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'unauthorized_access' | 'account_locked';
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'warning' | 'error' | 'critical';
    sessionId?: string;
  }) {
    return this.logAction({
      userId: data.userId,
      action: data.action,
      resource: 'security',
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.severity || 'warning',
      status: 'warning',
      sessionId: data.sessionId,
    });
  }

  /**
   * Log system events
   */
  static async logSystemEvent(data: {
    action: 'system_startup' | 'system_shutdown' | 'database_migration' | 'backup_created' | 'backup_restored' | 'email_sent' | 'email_failed';
    details?: any;
    severity?: 'info' | 'warning' | 'error' | 'critical';
  }) {
    return this.logAction({
      action: data.action,
      resource: 'system',
      details: data.details,
      severity: data.severity || 'info',
      status: data.action.includes('failed') ? 'failure' : 'success',
    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getLogs(options?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return storage.getAuditLogs(options);
  }
}