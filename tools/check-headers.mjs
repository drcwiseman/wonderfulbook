#!/usr/bin/env node

import https from 'https';
import http from 'http';
import { URL } from 'url';

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:5000';
const requiredHeaders = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy'
];

async function checkHeaders(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, { method: 'HEAD' }, (res) => {
      const headers = {};
      const present = {};
      
      // Collect all headers
      Object.keys(res.headers).forEach(key => {
        headers[key] = res.headers[key];
      });
      
      // Check required headers
      requiredHeaders.forEach(header => {
        present[header] = !!res.headers[header.toLowerCase()];
      });
      
      resolve({
        url,
        statusCode: res.statusCode,
        headers,
        requiredHeaders: present,
        allPresent: requiredHeaders.every(h => present[h]),
        missing: requiredHeaders.filter(h => !present[h])
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function main() {
  try {
    const result = await checkHeaders(PREVIEW_URL);
    console.log(JSON.stringify(result, null, 2));
    
    if (!result.allPresent) {
      console.error('Missing required headers:', result.missing.join(', '));
      process.exit(1);
    }
  } catch (error) {
    console.error(JSON.stringify({
      error: error.message,
      url: PREVIEW_URL,
      timestamp: new Date().toISOString()
    }));
    process.exit(1);
  }
}

main();