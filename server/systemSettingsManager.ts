import fs from 'fs';
import path from 'path';

interface SystemSettings {
  maintenanceMode: {
    enabled: boolean;
    message: string;
    estimatedEnd: string;
  };
  platform: {
    siteName: string;
    siteDescription: string;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    maxUsersPerPlan: {
      free: number;
      basic: number;
      premium: number;
    };
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
    enableTwoFactor: boolean;
  };
  email: {
    fromName: string;
    fromEmail: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    welcomeEmailEnabled: boolean;
    reminderEmailsEnabled: boolean;
  };
  features: {
    enableAnalytics: boolean;
    enableCopyProtection: boolean;
    enableDeviceLimit: boolean;
    maxDevicesPerUser: number;
    enableOfflineMode: boolean;
  };
  performance: {
    cacheTimeout: number;
    maxConcurrentReads: number;
    enableRateLimiting: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
}

class SystemSettingsManager {
  private settingsFile: string;
  private cachedSettings: SystemSettings | null = null;

  constructor() {
    this.settingsFile = path.join(process.cwd(), 'system-settings.json');
  }

  /**
   * Get current system settings from environment and saved file
   */
  public getSettings(): SystemSettings {
    // Always get the most current settings from environment variables
    const envSettings = this.getEnvironmentSettings();
    
    // Try to load persisted settings to overlay any manual changes
    const persistedSettings = this.loadPersistedSettings();
    
    // Merge environment settings (base) with persisted settings (overrides)
    const mergedSettings = {
      ...envSettings,
      ...persistedSettings,
      // Always keep email settings from environment to match actual config
      email: envSettings.email
    };

    this.cachedSettings = mergedSettings;
    return mergedSettings;
  }

  /**
   * Save settings to persistent storage
   */
  public saveSettings(settings: SystemSettings): void {
    try {
      // Don't save email settings as they should always come from environment
      const settingsToSave = {
        ...settings,
        email: undefined // Remove email from persisted settings
      };
      
      fs.writeFileSync(this.settingsFile, JSON.stringify(settingsToSave, null, 2));
      this.cachedSettings = settings;
      console.log('System settings saved successfully');
    } catch (error) {
      console.error('Error saving system settings:', error);
      throw new Error('Failed to save system settings');
    }
  }

  /**
   * Get settings from environment variables (always current)
   */
  private getEnvironmentSettings(): SystemSettings {
    return {
      maintenanceMode: {
        enabled: process.env.MAINTENANCE_MODE === 'true' || false,
        message: process.env.MAINTENANCE_MESSAGE || "We're currently performing maintenance. Please check back later.",
        estimatedEnd: process.env.MAINTENANCE_END || ""
      },
      platform: {
        siteName: process.env.SITE_NAME || "Wonderful Books",
        siteDescription: process.env.SITE_DESCRIPTION || "Your Number One Premium Digital Reading Platform",
        allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
        requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
        maxUsersPerPlan: {
          free: parseInt(process.env.MAX_FREE_USERS || "1000"),
          basic: parseInt(process.env.MAX_BASIC_USERS || "5000"),
          premium: parseInt(process.env.MAX_PREMIUM_USERS || "10000")
        }
      },
      security: {
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "1440"),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5"),
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || "8"),
        requireStrongPasswords: process.env.REQUIRE_STRONG_PASSWORDS !== 'false',
        enableTwoFactor: process.env.ENABLE_2FA === 'true'
      },
      email: {
        fromName: process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || "Wonderful Books",
        fromEmail: process.env.EMAIL_FROM || process.env.SMTP_USER || "books@thekingdomclub.org",
        smtpHost: process.env.SMTP_HOST || "mail.thekingdomclub.org",
        smtpPort: parseInt(process.env.SMTP_PORT || "465"),
        smtpSecure: parseInt(process.env.SMTP_PORT || "465") === 465 || process.env.SMTP_SECURE === 'true',
        welcomeEmailEnabled: process.env.WELCOME_EMAIL_ENABLED !== 'false',
        reminderEmailsEnabled: process.env.REMINDER_EMAIL_ENABLED !== 'false'
      },
      features: {
        enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
        enableCopyProtection: process.env.ENABLE_COPY_PROTECTION !== 'false',
        enableDeviceLimit: process.env.ENABLE_DEVICE_LIMIT !== 'false',
        maxDevicesPerUser: parseInt(process.env.MAX_DEVICES_PER_USER || "3"),
        enableOfflineMode: process.env.ENABLE_OFFLINE_MODE === 'true'
      },
      performance: {
        cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || "300"),
        maxConcurrentReads: parseInt(process.env.MAX_CONCURRENT_READS || "10"),
        enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
        rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || "200"),
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "15")
      }
    };
  }

  /**
   * Load persisted settings from file
   */
  private loadPersistedSettings(): Partial<SystemSettings> {
    try {
      if (!fs.existsSync(this.settingsFile)) {
        return {};
      }
      
      const fileContent = fs.readFileSync(this.settingsFile, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.warn('Error loading persisted settings, using defaults:', error);
      return {};
    }
  }
}

export const systemSettingsManager = new SystemSettingsManager();