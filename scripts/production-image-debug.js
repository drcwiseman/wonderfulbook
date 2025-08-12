#!/usr/bin/env node

// Production Image Debugging Script for mywonderfulbooks.com

import https from 'https';

console.log('🔍 PRODUCTION IMAGE DEBUGGING');
console.log('==============================');

const domain = 'mywonderfulbooks.com';

// Test specific image URLs that should exist
const testImages = [
    '/uploads/1754453446477-kgg86a.png',
    '/uploads/1754453929800-msice.png',
    '/uploads/1754454150690-j5ycd2.png'
];

async function testImageURL(path) {
    return new Promise((resolve) => {
        console.log(`\n🖼️  Testing: https://${domain}${path}`);
        
        const req = https.request({
            hostname: domain,
            path: path,
            method: 'HEAD'
        }, (res) => {
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Content-Type: ${res.headers['content-type']}`);
            console.log(`   Content-Length: ${res.headers['content-length']}`);
            console.log(`   CORS: ${res.headers['access-control-allow-origin']}`);
            resolve({
                path,
                status: res.statusCode,
                success: res.statusCode === 200
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ERROR: ${err.message}`);
            resolve({
                path,
                status: 'ERROR',
                success: false,
                error: err.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`   TIMEOUT: Request timed out`);
            resolve({
                path,
                status: 'TIMEOUT',
                success: false,
                error: 'Request timeout'
            });
        });
        
        req.end();
    });
}

async function testAPI() {
    console.log(`\n📡 Testing API: https://${domain}/api/admin/books`);
    
    return new Promise((resolve) => {
        const req = https.request({
            hostname: domain,
            path: '/api/admin/books',
            method: 'GET',
            headers: {
                'User-Agent': 'Production Debug Script'
            }
        }, (res) => {
            console.log(`   API Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const books = JSON.parse(data);
                        console.log(`   Books found: ${books.length}`);
                        if (books.length > 0) {
                            const book = books[0];
                            console.log(`   Sample coverImage: ${book.coverImage || 'NULL'}`);
                            console.log(`   Sample coverImageUrl: ${book.coverImageUrl || 'NULL'}`);
                        }
                    } else {
                        console.log(`   Response: ${data.substring(0, 200)}`);
                    }
                } catch (e) {
                    console.log(`   JSON Parse Error: ${e.message}`);
                }
                resolve(res.statusCode === 200);
            });
        });
        
        req.on('error', (err) => {
            console.log(`   API ERROR: ${err.message}`);
            resolve(false);
        });
        
        req.end();
    });
}

async function runDiagnostics() {
    console.log('Starting production image diagnostics...\n');
    
    // Test API first
    const apiWorking = await testAPI();
    
    // Test image URLs
    const results = [];
    for (const imagePath of testImages) {
        const result = await testImageURL(imagePath);
        results.push(result);
    }
    
    // Summary
    console.log('\n📊 DIAGNOSTIC SUMMARY');
    console.log('=====================');
    console.log(`✅ API Accessible: ${apiWorking ? 'YES' : 'NO'}`);
    
    const workingImages = results.filter(r => r.success).length;
    console.log(`✅ Images Working: ${workingImages}/${results.length}`);
    
    if (workingImages === 0) {
        console.log('\n❌ CRITICAL ISSUE: No images are accessible');
        console.log('   Possible causes:');
        console.log('   1. Uploads directory not included in production build');
        console.log('   2. Static file serving not configured for /uploads');
        console.log('   3. File permissions issue in production environment');
        console.log('   4. Missing uploads in deployment package');
    } else if (workingImages < results.length) {
        console.log('\n⚠️  PARTIAL ISSUE: Some images missing');
        console.log('   Check individual files in uploads directory');
    } else {
        console.log('\n✅ ALL IMAGES WORKING: Issue may be in frontend rendering');
    }
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Re-run production build with ./build-production.sh');
    console.log('2. Ensure uploads directory is included in deployment');
    console.log('3. Check that /uploads route is properly configured');
    console.log('4. Verify image URLs in frontend components');
}

runDiagnostics().catch(console.error);