const { storage } = require('./server/storage.ts');

async function createSampleLogs() {
  // Create sample audit logs directly through storage
  const sampleLogs = [
    {
      userId: 'manual_1754457852879_osie0x',
      action: 'login_success',
      resource: 'auth',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Chrome/91.0 Sample)',
      severity: 'info',
      status: 'success',
      details: { loginMethod: 'email', timestamp: new Date() },
      sessionId: 'sample-session-1'
    },
    {
      userId: 'manual_1754457852879_osie0x',
      action: 'admin_login',
      resource: 'admin',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Chrome/91.0 Sample)',
      severity: 'info',
      status: 'success',
      details: { adminPanel: 'super-admin', permissions: ['read', 'write', 'delete'] },
      sessionId: 'sample-session-1'
    },
    {
      action: 'system_startup',
      resource: 'system',
      severity: 'info',
      status: 'success',
      details: { component: 'audit_system', version: '1.0.0', timestamp: new Date() }
    },
    {
      userId: 'test-user-2',
      action: 'book_access',
      resource: 'book',
      resourceId: 'book-123',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Safari/537.36)',
      severity: 'info',
      status: 'success',
      details: { bookTitle: 'Sample Book', accessType: 'read' }
    },
    {
      userId: 'manual_1754457852879_osie0x',
      action: 'user_modified',
      resource: 'user',
      resourceId: 'target-user-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Chrome/91.0 Sample)',
      severity: 'warning',
      status: 'success',
      details: { adminAction: 'role_change', oldRole: 'user', newRole: 'admin' }
    }
  ];

  for (const logData of sampleLogs) {
    try {
      await storage.createAuditLog(logData);
      console.log('Created audit log:', logData.action);
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
  
  console.log('Sample audit logs created successfully!');
  process.exit(0);
}

createSampleLogs().catch(console.error);
