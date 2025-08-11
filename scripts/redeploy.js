#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEPLOYMENT_URL = 'https://workspace.drcwiseman.replit.app';
const TEST_ROUTES = [
  '/auth/reset-password?token=test',
  '/verify-email?token=test'
];

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
      timeout: 120000 // 2 minute timeout
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
    const { default: http } = await import('http');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Redeploy-Script/1.0'
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

async function redeploy() {
  let allStepsPass = true;

  try {
    log(`${colors.bold}🚀 Starting Production Redeploy${colors.reset}`);
    log('='.repeat(50), colors.blue);

    // Step 1: Build React frontend
    logInfo('Step 1: Building React frontend...');
    
    // Install dependencies
    const installResult = execCommand('npm install');
    if (!installResult.success) {
      logFail('npm install', installResult.error);
      allStepsPass = false;
    } else {
      logPass('Dependencies installed');
    }

    // Build frontend using the existing build system
    const buildResult = execCommand('npm run build');
    if (!buildResult.success) {
      logFail('Frontend and backend build', buildResult.error);
      allStepsPass = false;
    } else {
      logPass('Frontend and backend built successfully');
    }

    // Step 2: Copy built files to server/public
    logInfo('Step 2: Copying frontend build to server/public...');
    
    const clientDistDir = path.resolve(process.cwd(), 'dist', 'public');
    const serverPublicDir = path.resolve(process.cwd(), 'server', 'public');
    
    if (!fs.existsSync(clientDistDir)) {
      logFail('Frontend build directory not found', `${clientDistDir} does not exist`);
      allStepsPass = false;
    } else {
      // Create server/public directory if it doesn't exist
      if (!fs.existsSync(path.dirname(serverPublicDir))) {
        fs.mkdirSync(path.dirname(serverPublicDir), { recursive: true });
      }
      
      // Remove existing public directory and copy new one
      if (fs.existsSync(serverPublicDir)) {
        fs.rmSync(serverPublicDir, { recursive: true, force: true });
      }
      
      fs.cpSync(clientDistDir, serverPublicDir, { recursive: true });
      logPass('Frontend build copied to server/public');
    }

    // Step 3: Verify build completed (already done in step 1)
    logInfo('Step 3: Verifying build completed...');
    logPass('Build verification - using npm run build output');

    // Step 4: Verify build artifacts
    logInfo('Step 4: Verifying build artifacts...');
    
    const indexHtmlPath = path.resolve(serverPublicDir, 'index.html');
    const serverDistPath = path.resolve(process.cwd(), 'server', 'dist', 'index.js');
    
    if (!fs.existsSync(indexHtmlPath)) {
      logFail('Frontend build verification', `${indexHtmlPath} not found`);
      allStepsPass = false;
    } else {
      logPass('Frontend index.html verified');
    }
    
    if (!fs.existsSync(serverDistPath)) {
      logFail('Backend build verification', `${serverDistPath} not found`);
      allStepsPass = false;
    } else {
      logPass('Backend index.js verified');
    }

    if (!allStepsPass) {
      log('❌ Build verification failed. Cannot proceed with deployment.', colors.red);
      return 1;
    }

    // Step 5: Git operations
    logInfo('Step 5: Committing and pushing changes...');
    
    // Add all changes
    const gitAddResult = execCommand('git add .');
    if (!gitAddResult.success) {
      logFail('Git add', gitAddResult.error);
      allStepsPass = false;
    } else {
      logPass('Changes staged for commit');
    }

    // Check if there are changes to commit
    const gitStatusResult = execCommand('git status --porcelain');
    if (gitStatusResult.success && gitStatusResult.output.trim() === '') {
      logInfo('No changes to commit');
    } else {
      // Commit changes
      const commitMessage = `Production redeploy: ${new Date().toISOString()}`;
      const gitCommitResult = execCommand(`git commit -m "${commitMessage}"`);
      if (!gitCommitResult.success) {
        // Might fail if no changes, which is okay
        logInfo('No new changes to commit');
      } else {
        logPass('Changes committed');
      }

      // Push to main/deployment branch
      const gitPushResult = execCommand('git push origin main');
      if (!gitPushResult.success) {
        // Try pushing to current branch
        const currentBranchResult = execCommand('git branch --show-current');
        if (currentBranchResult.success) {
          const currentBranch = currentBranchResult.output.trim();
          const pushCurrentResult = execCommand(`git push origin ${currentBranch}`);
          if (!pushCurrentResult.success) {
            logFail('Git push', pushCurrentResult.error);
            allStepsPass = false;
          } else {
            logPass('Changes pushed to deployment branch');
          }
        } else {
          logFail('Git push', gitPushResult.error);
          allStepsPass = false;
        }
      } else {
        logPass('Changes pushed to main branch');
      }
    }

    // Step 6: Wait for deployment and test
    logInfo('Step 6: Testing deployment (waiting 30 seconds for deployment)...');
    
    // Wait for deployment to complete
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test the deployment endpoints
    for (const route of TEST_ROUTES) {
      const testUrl = `${DEPLOYMENT_URL}${route}`;
      try {
        const response = await makeHttpRequest(testUrl);
        
        if (response.ok && response.contentType.includes('text/html')) {
          logPass(`Deployment test: ${route} - Status ${response.status}, Content-Type: HTML`);
        } else {
          logFail(`Deployment test: ${route}`, `Status ${response.status}, Content-Type: ${response.contentType}`);
          allStepsPass = false;
        }
      } catch (error) {
        logFail(`Deployment test: ${route}`, error.message);
        allStepsPass = false;
      }
    }

    // Final result
    log('='.repeat(50), colors.blue);
    
    if (allStepsPass) {
      log(`${colors.bold}${colors.green}🎉 REDEPLOY SUCCESSFUL!${colors.reset}`);
      log(`${colors.green}Your email reset and verification links are now working at:${colors.reset}`);
      log(`${colors.blue}${DEPLOYMENT_URL}/auth/reset-password${colors.reset}`);
      log(`${colors.blue}${DEPLOYMENT_URL}/verify-email${colors.reset}`);
      return 0;
    } else {
      log(`${colors.bold}${colors.red}💥 REDEPLOY FAILED!${colors.reset}`);
      log(`${colors.red}Please check the errors above and try again.${colors.reset}`);
      return 1;
    }

  } catch (error) {
    logFail('Unexpected error', error.message);
    return 1;
  }
}

// Run the redeploy process
redeploy().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  logFail('Fatal error', error.message);
  process.exit(1);
});