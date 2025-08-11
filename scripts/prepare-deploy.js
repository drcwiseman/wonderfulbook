#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logPass(step) {
  log(`✅ PASS: ${step}`, colors.green);
}

function logFail(step, error = '') {
  log(`❌ FAIL: ${step}`, colors.red);
  if (error) {
    log(`   Error: ${error}`, colors.red);
  }
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function execCommand(command, cwd = process.cwd()) {
  try {
    const result = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 120000
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

async function makeHttpRequest(url) {
  try {
    const { default: https } = await import('https');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const req = https.request({
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Deploy-Test-Script/1.0'
        }
      }, (res) => {
        const contentType = res.headers['content-type'] || '';
        resolve({
          status: res.statusCode,
          contentType,
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  } catch (error) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

async function prepareDeploy() {
  let allStepsPass = true;

  try {
    log(`${colors.bold}🚀 Preparing Production Deployment${colors.reset}`);
    log('='.repeat(50), colors.blue);

    // Step 1: Install dependencies and build
    logInfo('Step 1: Installing dependencies and building...');
    
    const installResult = execCommand('npm install');
    if (!installResult.success) {
      logFail('npm install', installResult.error);
      allStepsPass = false;
    } else {
      logPass('Dependencies installed');
    }

    const buildResult = execCommand('npm run build');
    if (!buildResult.success) {
      logFail('Build process', buildResult.error);
      allStepsPass = false;
    } else {
      logPass('Build completed successfully');
    }

    // Step 2: Verify build artifacts
    logInfo('Step 2: Verifying build artifacts...');
    
    const serverPublicIndex = path.resolve(process.cwd(), 'server', 'public', 'index.html');
    const serverDistIndex = path.resolve(process.cwd(), 'server', 'dist', 'index.js');
    
    if (!fs.existsSync(serverPublicIndex)) {
      logFail('Frontend build verification', `${serverPublicIndex} not found`);
      allStepsPass = false;
    } else {
      logPass('Frontend index.html verified');
    }
    
    if (!fs.existsSync(serverDistIndex)) {
      logFail('Backend build verification', `${serverDistIndex} not found`);
      allStepsPass = false;
    } else {
      logPass('Backend index.js verified');
    }

    // Step 3: Test current deployment (optional)
    logInfo('Step 3: Testing current deployment...');
    
    const testUrls = [
      'https://workspace.drcwiseman.replit.app/auth/reset-password?token=test',
      'https://workspace.drcwiseman.replit.app/verify-email?token=test'
    ];

    for (const url of testUrls) {
      try {
        const response = await makeHttpRequest(url);
        const routeName = url.includes('reset-password') ? 'Password Reset' : 'Email Verification';
        
        if (response.ok && response.contentType.includes('text/html')) {
          logPass(`${routeName} route - Status ${response.status}, Content-Type: HTML`);
        } else {
          logInfo(`${routeName} route - Status ${response.status} (will be fixed after redeployment)`);
        }
      } catch (error) {
        logInfo(`${url.split('/').pop()} - ${error.message} (will be fixed after redeployment)`);
      }
    }

    // Final result
    log('='.repeat(50), colors.blue);
    
    if (allStepsPass) {
      log(`${colors.bold}${colors.green}🎉 DEPLOYMENT PREPARATION SUCCESSFUL!${colors.reset}`);
      log(`${colors.green}Your code is ready for deployment.${colors.reset}`);
      log('');
      log(`${colors.bold}Next Steps:${colors.reset}`);
      log(`${colors.blue}1. Click the "Deploy" button in your Replit workspace${colors.reset}`);
      log(`${colors.blue}2. Wait for deployment to complete${colors.reset}`);
      log(`${colors.blue}3. Test your email routes:${colors.reset}`);
      log(`   - https://workspace.drcwiseman.replit.app/auth/reset-password`);
      log(`   - https://workspace.drcwiseman.replit.app/verify-email`);
      return 0;
    } else {
      log(`${colors.bold}${colors.red}💥 PREPARATION FAILED!${colors.reset}`);
      log(`${colors.red}Please check the errors above and try again.${colors.reset}`);
      return 1;
    }

  } catch (error) {
    logFail('Unexpected error', error.message);
    return 1;
  }
}

// Run the preparation process
prepareDeploy().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  logFail('Fatal error', error.message);
  process.exit(1);
});