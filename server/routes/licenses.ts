import { Router } from 'express';
import { db } from '../db.js';
import { licenses, loans, devices } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth.js';
import { LicenseService } from '../services/licenseService.js';

const router = Router();

// Issue a license for a loan and device
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { loanId, deviceId } = req.body;
    const userId = req.user!.id;

    if (!loanId || !deviceId) {
      return res.status(400).json({ 
        message: 'Loan ID and Device ID are required' 
      });
    }

    // Verify the loan belongs to the user
    const [loan] = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.id, loanId),
        eq(loans.userId, userId),
        eq(loans.status, 'active')
      ))
      .limit(1);

    if (!loan) {
      return res.status(404).json({ 
        message: 'Active loan not found' 
      });
    }

    // Verify the device belongs to the user
    const [device] = await db
      .select()
      .from(devices)
      .where(and(
        eq(devices.id, deviceId),
        eq(devices.userId, userId),
        eq(devices.isActive, true)
      ))
      .limit(1);

    if (!device) {
      return res.status(404).json({ 
        message: 'Active device not found' 
      });
    }

    const { license, signature } = await LicenseService.issueLicense(loanId, deviceId);

    res.json({
      message: 'License issued successfully',
      license,
      signature
    });

  } catch (error) {
    console.error('License issuance failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid loan') || 
          error.message.includes('Device does not belong')) {
        return res.status(403).json({ message: error.message });
      }
    }
    
    res.status(500).json({ message: 'Failed to issue license' });
  }
});

// Renew a license
router.post('/renew', isAuthenticated, async (req, res) => {
  try {
    const { licenseId } = req.body;
    const userId = req.user!.id;

    if (!licenseId) {
      return res.status(400).json({ 
        message: 'License ID is required' 
      });
    }

    // Verify the license belongs to the user
    const [existingLicense] = await db
      .select()
      .from(licenses)
      .where(and(
        eq(licenses.id, licenseId),
        eq(licenses.userId, userId),
        eq(licenses.revoked, false)
      ))
      .limit(1);

    if (!existingLicense) {
      return res.status(404).json({ 
        message: 'License not found or revoked' 
      });
    }

    const { license, signature } = await LicenseService.renewLicense(licenseId);

    res.json({
      message: 'License renewed successfully',
      license,
      signature
    });

  } catch (error) {
    console.error('License renewal failed:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Failed to renew license' });
  }
});

// Get license updates for a device
router.get('/updates', isAuthenticated, async (req, res) => {
  try {
    const { deviceId, since } = req.query;
    const userId = req.user!.id;

    if (!deviceId) {
      return res.status(400).json({ 
        message: 'Device ID is required' 
      });
    }

    // Verify the device belongs to the user
    const [device] = await db
      .select()
      .from(devices)
      .where(and(
        eq(devices.id, deviceId as string),
        eq(devices.userId, userId)
      ))
      .limit(1);

    if (!device) {
      return res.status(404).json({ 
        message: 'Device not found' 
      });
    }

    const sinceDate = since ? new Date(since as string) : undefined;
    const updates = await LicenseService.getLicenseUpdates(deviceId as string, sinceDate);

    res.json({
      message: 'License updates retrieved successfully',
      ...updates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get license updates:', error);
    res.status(500).json({ message: 'Failed to get license updates' });
  }
});

// Get user's licenses
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    const userLicenses = await db
      .select({
        id: licenses.id,
        loanId: licenses.loanId,
        deviceId: licenses.deviceId,
        bookId: licenses.bookId,
        offlineExpiresAt: licenses.offlineExpiresAt,
        revoked: licenses.revoked,
        lastRenewedAt: licenses.lastRenewedAt,
        renewalCount: licenses.renewalCount,
        createdAt: licenses.createdAt
      })
      .from(licenses)
      .where(eq(licenses.userId, userId));

    res.json({ 
      licenses: userLicenses,
      count: userLicenses.length 
    });

  } catch (error) {
    console.error('Failed to fetch user licenses:', error);
    res.status(500).json({ message: 'Failed to fetch licenses' });
  }
});

// Get licenses expiring soon (for background sync)
router.get('/expiring', isAuthenticated, async (req, res) => {
  try {
    const { hours = '72' } = req.query;
    const hoursAhead = parseInt(hours as string);

    const expiringLicenses = await LicenseService.getLicensesExpiringSoon(hoursAhead);

    const userLicenses = expiringLicenses.filter(license => 
      license.userId === req.user!.id
    );

    res.json({ 
      licenses: userLicenses.map(license => ({
        id: license.id,
        loanId: license.loanId,
        deviceId: license.deviceId,
        bookId: license.bookId,
        offlineExpiresAt: license.offlineExpiresAt,
        renewalCount: license.renewalCount
      })),
      count: userLicenses.length 
    });

  } catch (error) {
    console.error('Failed to fetch expiring licenses:', error);
    res.status(500).json({ message: 'Failed to fetch expiring licenses' });
  }
});

export default router;