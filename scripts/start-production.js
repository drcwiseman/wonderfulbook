#!/usr/bin/env node

// Production startup script
// Forces production environment and runs the built server

import path from 'path';
import fs from 'fs';

// Force production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

const log = (message) => console.log(`🚀 ${message}`);

log('Starting production server...');
log(`Environment: ${process.env.NODE_ENV}`);
log(`Port: ${process.env.PORT}`);

// Verify production build exists
const serverBuild = 'server/dist/index.js';
const frontendBuild = 'server/public/index.html';

if (!fs.existsSync(serverBuild)) {
  console.error('❌ Server build not found. Run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(frontendBuild)) {
  console.error('❌ Frontend build not found. Run "npm run build" first.');
  process.exit(1);
}

log('✅ Production builds verified');

// Import and start the built server
import(path.resolve(serverBuild)).then(() => {
  log('✅ Production server started successfully');
}).catch(error => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});