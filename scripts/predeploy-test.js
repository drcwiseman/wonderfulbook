#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_PORT = 5001;
const SERVER_STARTUP_WAIT = 8000; // 8 seconds for server to start
const REQUEST_TIMEOUT = 10000; // 10 second timeout per request

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

function logPass(test) {
  log(`✅ PASS: ${test}`, colors.green);
}

function logFail(test, error) {
  log(`❌ FAIL: ${test}`, colors.red);
  if (error) {
    log(`   Error: ${error}`, colors.red);
  }
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url) {
  const startTime = Date.now();
  
  // Use http module for reliable local testing
  const { default: http } = await import('http');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
    }, REQUEST_TIMEOUT);

    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'Predeploy-Test-Script/1.0'
      }
    }, (res) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      const contentType = res.headers['content-type'] || '';
      
      // Collect response body for debugging
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType,
          duration,
          body: body.substring(0, 200), // First 200 chars for debugging
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Connection failed: ${error.message}`));
    });

    req.on('timeout', () => {
      clearTimeout(timeout);
      req.destroy();
      reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
    });

    req.end();
  });
}

async function runTests() {
  let allPassed = true;
  let serverProcess = null;

  try {
    log(`${colors.bold}🚀 Starting Pre-deployment Tests${colors.reset}`);
    log('='.repeat(50), colors.blue);

    // Step 1: Build the application
    logInfo('Step 1: Building application...');
    try {
      execSync('npm run build', { 
        stdio: 'pipe',
        cwd: process.cwd(),
        timeout: 120000 // 2 minute timeout
      });
      logPass('Application build completed');
    } catch (error) {
      logFail('Application build', error.message);
      return 1;
    }

    // Step 2: Verify build artifacts
    logInfo('Step 2: Verifying build artifacts...');
    
    const buildFiles = [
      'server/public/index.html',
      'server/dist/index.js'
    ];

    for (const file of buildFiles) {
      if (fs.existsSync(file)) {
        logPass(`Build artifact exists: ${file}`);
      } else {
        logFail(`Build artifact missing: ${file}`);
        allPassed = false;
      }
    }

    // Check for assets directory
    const assetsDir = 'server/public/assets';
    if (fs.existsSync(assetsDir)) {
      const assets = fs.readdirSync(assetsDir);
      if (assets.length > 0) {
        logPass(`Assets directory contains ${assets.length} files`);
      } else {
        logFail('Assets directory is empty');
        allPassed = false;
      }
    } else {
      logFail('Assets directory missing');
      allPassed = false;
    }

    if (!allPassed) {
      log(`${colors.red}Build verification failed. Exiting.${colors.reset}`);
      return 1;
    }

    // Step 3: Start production server
    logInfo(`Step 3: Starting production server on port ${TEST_PORT}...`);
    
    serverProcess = spawn('node', ['server/dist/index.js'], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: TEST_PORT.toString()
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverReady = false;
    let serverOutput = '';

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      console.log('[SERVER]', output.trim()); // Debug server output
      if (output.includes('serving on port') || output.includes('Server listening') || output.includes('Production server started')) {
        serverReady = true;
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      console.log('[SERVER ERROR]', output.trim()); // Debug server errors
    });

    serverProcess.on('error', (error) => {
      logFail('Server startup', error.message);
      allPassed = false;
    });

    // Wait for server to start
    logInfo(`Waiting ${SERVER_STARTUP_WAIT/1000} seconds for server startup...`);
    await sleep(SERVER_STARTUP_WAIT);

    if (serverProcess.killed) {
      logFail('Server startup', 'Server process died during startup');
      log(serverOutput, colors.red);
      return 1;
    }

    // Check if server actually started by looking for error patterns
    if (serverOutput.includes('Server initialization failed') || serverOutput.includes('Error:')) {
      logFail('Server startup', 'Server initialization failed');
      log(serverOutput, colors.red);
      return 1;
    }

    logPass('Production server started');

    // Step 4: Run HTTP tests
    logInfo('Step 4: Running HTTP endpoint tests...');

    const tests = [
      {
        name: 'Email reset route (/auth/reset-password?token=testtoken)',
        url: `http://localhost:${TEST_PORT}/auth/reset-password?token=testtoken`,
        expectedStatus: 200,
        expectedContentType: 'text/html'
      },
      {
        name: 'Email verification route (/verify-email?token=testtoken)',
        url: `http://localhost:${TEST_PORT}/verify-email?token=testtoken`,
        expectedStatus: 200,
        expectedContentType: 'text/html'
      },
      {
        name: 'Root route (/)',
        url: `http://localhost:${TEST_PORT}/`,
        expectedStatus: 200,
        expectedContentType: 'text/html'
      }
    ];

    for (const test of tests) {
      try {
        const response = await makeRequest(test.url);
        
        // Check status code
        if (response.status === test.expectedStatus) {
          logPass(`${test.name} - Status ${response.status}`);
        } else {
          logFail(`${test.name} - Status`, `Expected ${test.expectedStatus}, got ${response.status}`);
          allPassed = false;
          continue;
        }

        // Check content type
        const contentTypeMatch = test.expectedContentType === 'text/html' 
          ? response.contentType.includes('text/html')
          : test.expectedContentType === 'application/json'
          ? response.contentType.includes('application/json') || response.contentType.includes('text/plain')
          : true;

        if (contentTypeMatch) {
          logPass(`${test.name} - Content-Type OK (${response.contentType})`);
        } else {
          logFail(`${test.name} - Content-Type`, `Expected ${test.expectedContentType}, got ${response.contentType}`);
          allPassed = false;
        }

        logInfo(`   Response time: ${response.duration}ms`);

      } catch (error) {
        logFail(`${test.name}`, error.message);
        allPassed = false;
      }
    }

    // Final results
    log('='.repeat(50), colors.blue);
    
    if (allPassed) {
      log(`${colors.bold}${colors.green}🎉 ALL TESTS PASSED! Ready for deployment.${colors.reset}`);
      return 0;
    } else {
      log(`${colors.bold}${colors.red}💥 SOME TESTS FAILED! Fix issues before deployment.${colors.reset}`);
      return 1;
    }

  } catch (error) {
    logFail('Unexpected error', error.message);
    return 1;
  } finally {
    // Cleanup: Kill server process
    if (serverProcess && !serverProcess.killed) {
      logInfo('Cleaning up: Stopping test server...');
      serverProcess.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown, then force kill if needed
      await sleep(2000);
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }
  }
}

// Run tests and exit with appropriate code
runTests().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  logFail('Fatal error', error.message);
  process.exit(1);
});