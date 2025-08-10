import { Router } from 'express';
import { db } from '../db.js';
import { devices, systemConfig } from '../../shared/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { isAuthenticated } from '../middleware/auth.js';
import { z } from 'zod';
import { generateDeviceFingerprint } from '../crypto.js';
import type { InsertDevice } from '../../shared/schema.js';

const router = Router();

// Register a new device
router.post('/register', isAuthenticated, async (req, res) => {
  try {
    const { name, publicKey } = req.body;
    
    if (!name || !publicKey) {
      return res.status(400).json({ 
        message: 'Device name and public key are required' 
      });
    }

    const userId = req.user!.id;
    
    // Check device limit
    const maxDevicesConfig = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'MAX_DEVICES_PER_USER'))
      .limit(1);
    
    const maxDevices = maxDevicesConfig[0]?.value ? parseInt(maxDevicesConfig[0].value) : 5;
    
    const [deviceCount] = await db
      .select({ count: count() })
      .from(devices)
      .where(and(
        eq(devices.userId, userId),
        eq(devices.isActive, true)
      ));

    if (deviceCount.count >= maxDevices) {
      return res.status(409).json({
        message: `Maximum ${maxDevices} devices allowed per user`,
        currentDevices: deviceCount.count,
        maxDevices
      });
    }

    // Generate device fingerprint
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    const fingerprint = generateDeviceFingerprint(userAgent, ip);

    // Create new device
    const deviceData: InsertDevice = {
      userId,
      name,
      publicKey,
      deviceFingerprint: fingerprint,
      userAgent,
    };

    const [newDevice] = await db
      .insert(devices)
      .values(deviceData)
      .returning();

    res.json({
      deviceId: newDevice.id,
      name: newDevice.name,
      fingerprint: newDevice.deviceFingerprint,
      createdAt: newDevice.createdAt
    });

  } catch (error) {
    console.error('Device registration failed:', error);
    res.status(500).json({ message: 'Device registration failed' });
  }
});

// Get user's devices
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const userDevices = await db
      .select({
        id: devices.id,
        name: devices.name,
        deviceFingerprint: devices.deviceFingerprint,
        lastActiveAt: devices.lastActiveAt,
        isActive: devices.isActive,
        createdAt: devices.createdAt,
      })
      .from(devices)
      .where(eq(devices.userId, userId))
      .orderBy(devices.lastActiveAt);

    res.json({ devices: userDevices });

  } catch (error) {
    console.error('Failed to fetch devices:', error);
    res.status(500).json({ message: 'Failed to fetch devices' });
  }
});

// Deactivate a device
router.delete('/:deviceId', isAuthenticated, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user!.id;

    const [device] = await db
      .select()
      .from(devices)
      .where(and(
        eq(devices.id, deviceId),
        eq(devices.userId, userId)
      ))
      .limit(1);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Deactivate device
    await db
      .update(devices)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(devices.id, deviceId));

    res.json({ message: 'Device deactivated successfully' });

  } catch (error) {
    console.error('Device deactivation failed:', error);
    res.status(500).json({ message: 'Device deactivation failed' });
  }
});

// Update device activity (called periodically by client)
router.put('/:deviceId/activity', isAuthenticated, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user!.id;

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
      return res.status(404).json({ message: 'Device not found' });
    }

    await db
      .update(devices)
      .set({
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(devices.id, deviceId));

    res.json({ message: 'Device activity updated' });

  } catch (error) {
    console.error('Device activity update failed:', error);
    res.status(500).json({ message: 'Device activity update failed' });
  }
});

export default router;