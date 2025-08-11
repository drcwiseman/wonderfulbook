#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const log = (message) => console.log(`🔧 ${message}`);
const error = (message) => console.error(`❌ ${message}`);

try {
  // Step 1: Build React frontend
  log('Building React frontend...');
  process.chdir('client');
  execSync('npm run build', { stdio: 'inherit' });
  process.chdir('..');
  
  // Step 2: Copy frontend build to server/public
  log('Copying frontend build to server/public...');
  
  // Remove existing public directory
  const publicDir = 'server/public';
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
  
  // Copy dist/public to server/public (the current build outputs to dist/public)
  const clientDist = 'dist/public';
  if (fs.existsSync(clientDist)) {
    fs.cpSync(clientDist, publicDir, { recursive: true });
    log('Frontend build copied to server/public');
  } else {
    throw new Error('Frontend build directory not found at dist/public');
  }
  
  // Step 3: Build backend TypeScript
  log('Building backend TypeScript...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=server/dist', { stdio: 'inherit' });
  
  // Verify builds
  const backendBuild = 'server/dist/index.js';
  const frontendBuild = 'server/public/index.html';
  
  if (!fs.existsSync(backendBuild)) {
    throw new Error('Backend build failed - index.js not found');
  }
  
  if (!fs.existsSync(frontendBuild)) {
    throw new Error('Frontend build copy failed - index.html not found');
  }
  
  log('✅ Production build completed successfully');
  log(`✅ Backend: ${backendBuild}`);
  log(`✅ Frontend: ${frontendBuild}`);
  
} catch (err) {
  error(`Build failed: ${err.message}`);
  process.exit(1);
}