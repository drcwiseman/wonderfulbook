import { db } from '../db.js';
import { licenses, loans, devices, books, systemConfig } from '../../shared/schema.js';
import { and, eq, lt, desc, count } from 'drizzle-orm';
import { createSignedLicense, wrapKeyWithRSA, type LicenseData } from '../crypto.js';
import type { InsertLicense, License, Device, Loan, Book } from '../../shared/schema.js';

export class LicenseService {
  // Issue a new license for a loan and device
  static async issueLicense(loanId: string, deviceId: string): Promise<{ license: LicenseData; signature: string }> {
    // Get loan, device, and book information
    const [loan] = await db
      .select({
        loan: loans,
        device: devices,
        book: books,
      })
      .from(loans)
      .innerJoin(devices, eq(devices.id, deviceId))
      .innerJoin(books, eq(books.id, loans.bookId))
      .where(and(
        eq(loans.id, loanId),
        eq(loans.status, 'active'),
        eq(devices.isActive, true)
      ));

    if (!loan) {
      throw new Error('Invalid loan or device');
    }

    // Check if user owns the device
    if (loan.device.userId !== loan.loan.userId) {
      throw new Error('Device does not belong to user');
    }

    // Get system configuration for offline window
    const offlineWindowDays = await this.getSystemConfig('OFFLINE_WINDOW_DAYS', '30');
    const offlineExpiresAt = new Date();
    offlineExpiresAt.setDate(offlineExpiresAt.getDate() + parseInt(offlineWindowDays));

    // Check for existing license
    const existingLicense = await db
      .select()
      .from(licenses)
      .where(and(
        eq(licenses.loanId, loanId),
        eq(licenses.deviceId, deviceId),
        eq(licenses.revoked, false)
      ))
      .limit(1);

    if (existingLicense.length > 0) {
      // Return renewed license
      return this.renewLicense(existingLicense[0].id);
    }

    // Generate wrapped encryption key
    const bookKey = loan.book.encryptionKeyId || 'default-key'; // Fallback for existing books
    const wrappedKey = wrapKeyWithRSA(bookKey, loan.device.publicKey);

    // Create license data
    const licenseData: Omit<LicenseData, 'serverTime'> = {
      licenseId: crypto.randomUUID(),
      loanId: loan.loan.id,
      userId: loan.loan.userId,
      deviceId: loan.device.id,
      bookId: loan.book.id,
      policy: {
        offlineExpiresAt: offlineExpiresAt.toISOString(),
        watermark: {
          name: `User ${loan.loan.userId}`,
          email: 'user@example.com', // Would get from user record
          loanId: loan.loan.id,
        },
        copyProtection: {
          enabled: true,
          maxCopyPercentage: 40,
        },
        offlineAccess: {
          enabled: true,
          maxDays: parseInt(offlineWindowDays),
        },
      },
      key: {
        alg: 'AES-GCM',
        keyWrapped: wrappedKey,
      },
      asset: {
        sha256: loan.book.sha256 || '',
        chunkCount: loan.book.chunkCount || 0,
        chunkSize: loan.book.chunkSize || 1048576,
      },
    };

    // Create signed license
    const { license, signature } = await createSignedLicense(licenseData);

    // Store license in database
    const insertData: InsertLicense = {
      loanId: loan.loan.id,
      deviceId: loan.device.id,
      userId: loan.loan.userId,
      bookId: loan.book.id,
      keyWrapped: wrappedKey,
      offlineExpiresAt: new Date(license.policy.offlineExpiresAt),
      policy: license.policy,
      signature,
      serverTime: new Date(license.serverTime),
    };

    await db.insert(licenses).values(insertData);

    return { license, signature };
  }

  // Renew an existing license
  static async renewLicense(licenseId: string): Promise<{ license: LicenseData; signature: string }> {
    const [existingLicense] = await db
      .select({
        license: licenses,
        loan: loans,
        device: devices,
        book: books,
      })
      .from(licenses)
      .innerJoin(loans, eq(loans.id, licenses.loanId))
      .innerJoin(devices, eq(devices.id, licenses.deviceId))
      .innerJoin(books, eq(books.id, licenses.bookId))
      .where(and(
        eq(licenses.id, licenseId),
        eq(licenses.revoked, false),
        eq(loans.status, 'active')
      ));

    if (!existingLicense) {
      throw new Error('License not found or invalid');
    }

    // Get new offline expiry
    const offlineWindowDays = await this.getSystemConfig('OFFLINE_WINDOW_DAYS', '30');
    const newOfflineExpiresAt = new Date();
    newOfflineExpiresAt.setDate(newOfflineExpiresAt.getDate() + parseInt(offlineWindowDays));

    // Create renewed license data
    const renewedLicenseData: Omit<LicenseData, 'serverTime'> = {
      licenseId: existingLicense.license.id,
      loanId: existingLicense.loan.id,
      userId: existingLicense.loan.userId,
      deviceId: existingLicense.device.id,
      bookId: existingLicense.book.id,
      policy: {
        ...existingLicense.license.policy as any,
        offlineExpiresAt: newOfflineExpiresAt.toISOString(),
      },
      key: {
        alg: 'AES-GCM',
        keyWrapped: existingLicense.license.keyWrapped,
      },
      asset: {
        sha256: existingLicense.book.sha256 || '',
        chunkCount: existingLicense.book.chunkCount || 0,
        chunkSize: existingLicense.book.chunkSize || 1048576,
      },
    };

    // Create signed renewed license
    const { license, signature } = await createSignedLicense(renewedLicenseData);

    // Update license in database
    await db
      .update(licenses)
      .set({
        offlineExpiresAt: new Date(license.policy.offlineExpiresAt),
        policy: license.policy,
        signature,
        lastRenewedAt: new Date(),
        renewalCount: (existingLicense.license.renewalCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, licenseId));

    return { license, signature };
  }

  // Get license updates for a device
  static async getLicenseUpdates(deviceId: string, since?: Date): Promise<{
    revoked: string[];
    updated: Array<{ license: LicenseData; signature: string }>;
  }> {
    let query = db
      .select()
      .from(licenses)
      .where(eq(licenses.deviceId, deviceId));

    if (since) {
      query = db
        .select()
        .from(licenses)
        .where(and(
          eq(licenses.deviceId, deviceId),
          lt(licenses.updatedAt, since)
        ));
    }

    const licensesData = await query;

    const revoked = licensesData
      .filter(l => l.revoked)
      .map(l => l.id);

    const updated = licensesData
      .filter(l => !l.revoked && l.lastRenewedAt && (!since || l.lastRenewedAt > since))
      .map(l => ({
        license: this.licenseToLicenseData(l),
        signature: l.signature,
      }));

    return { revoked, updated };
  }

  // Revoke licenses for a loan
  static async revokeLicensesForLoan(loanId: string, revokedBy?: string): Promise<void> {
    await db
      .update(licenses)
      .set({
        revoked: true,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(licenses.loanId, loanId),
        eq(licenses.revoked, false)
      ));
  }

  // Get licenses expiring soon (for background renewal)
  static async getLicensesExpiringSoon(hoursAhead: number = 72): Promise<License[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setHours(expiryThreshold.getHours() + hoursAhead);

    return await db
      .select()
      .from(licenses)
      .where(and(
        eq(licenses.revoked, false),
        lt(licenses.offlineExpiresAt, expiryThreshold)
      ));
  }

  // Helper to get system configuration
  private static async getSystemConfig(key: string, defaultValue: string): Promise<string> {
    const [config] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key))
      .limit(1);

    return config?.value || defaultValue;
  }

  // Convert database license to LicenseData format
  private static licenseToLicenseData(license: License): LicenseData {
    return {
      licenseId: license.id,
      loanId: license.loanId,
      userId: license.userId,
      deviceId: license.deviceId,
      bookId: license.bookId,
      policy: license.policy as any,
      key: {
        alg: 'AES-GCM',
        keyWrapped: license.keyWrapped,
      },
      asset: {
        sha256: '', // Would need to join with books table
        chunkCount: 0,
        chunkSize: 1048576,
      },
      serverTime: license.serverTime?.toISOString() || new Date().toISOString(),
    };
  }
}