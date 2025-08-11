#!/usr/bin/env node

// Production startup script for Replit deployment
// This ensures proper environment configuration for production

// Force production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🚀 Starting production server...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

// Import and run the built server
import('./dist/index.js').then(() => {
  console.log('✅ Production server started successfully');
}).catch(error => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});