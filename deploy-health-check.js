#!/usr/bin/env node
/**
 * Cloud Run Deployment Health Check Script
 * Validates deployment readiness before deployment
 */

const http = require('http');
const https = require('https');

async function healthCheck(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeoutId = setTimeout(() => {
      reject(new Error(`Health check timeout after ${timeout}ms`));
    }, timeout);

    const req = client.get(url, (res) => {
      clearTimeout(timeoutId);
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(body);
            resolve({ status: res.statusCode, data });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
}

async function validateDeployment() {
  const port = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${port}`;
  
  console.log('🔍 Validating deployment readiness...');
  console.log(`Testing endpoints on port ${port}`);

  const endpoints = [
    { path: '/health', name: 'Health Check' },
    { path: '/ping', name: 'Ping' },
    { path: '/healthz', name: 'Kubernetes Health' }
  ];

  try {
    for (const endpoint of endpoints) {
      console.log(`\n⏱️  Testing ${endpoint.name}: ${baseUrl}${endpoint.path}`);
      const result = await healthCheck(`${baseUrl}${endpoint.path}`, 10000);
      console.log(`✅ ${endpoint.name}: Status ${result.status}`);
      if (typeof result.data === 'object') {
        console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      }
    }

    console.log('\n🚀 All health checks passed! Deployment ready.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    console.error('\nDeployment validation failed. Check server logs.');
    process.exit(1);
  }
}

if (require.main === module) {
  validateDeployment();
}

module.exports = { healthCheck, validateDeployment };