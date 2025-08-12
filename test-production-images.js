#!/usr/bin/env node

// Local Test Script for Image Functionality

const http = require('http');

console.log('🔍 TESTING PRODUCTION IMAGE FIXES');
console.log('==================================');

async function testAPI() {
    return new Promise((resolve) => {
        console.log('📡 Testing /api/books endpoint...');
        
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/books',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const books = JSON.parse(data);
                    console.log(`   ✅ API Status: ${res.statusCode}`);
                    console.log(`   📚 Books found: ${books.length}`);
                    
                    if (books.length > 0) {
                        const book = books[0];
                        const imageUrl = book.coverImageUrl;
                        console.log(`   🖼️  Sample coverImageUrl: ${imageUrl || 'NULL'}`);
                        
                        if (imageUrl) {
                            console.log(`   🔗 Full URL: http://localhost:5000${imageUrl}`);
                            resolve({ success: true, imageUrl });
                        } else {
                            console.log(`   ❌ No image URL found in book data`);
                            resolve({ success: false, reason: 'No image URL' });
                        }
                    } else {
                        console.log(`   ❌ No books found in API response`);
                        resolve({ success: false, reason: 'No books' });
                    }
                } catch (e) {
                    console.log(`   ❌ JSON Parse Error: ${e.message}`);
                    resolve({ success: false, reason: 'Parse error' });
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ API Error: ${err.message}`);
            resolve({ success: false, reason: err.message });
        });
        
        req.end();
    });
}

async function testImage(imagePath) {
    return new Promise((resolve) => {
        console.log(`\n🖼️  Testing image: ${imagePath}`);
        
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: imagePath,
            method: 'HEAD'
        }, (res) => {
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Content-Type: ${res.headers['content-type']}`);
            console.log(`   Content-Length: ${res.headers['content-length']}`);
            resolve(res.statusCode === 200);
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ Image Error: ${err.message}`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            console.log(`   ❌ Timeout`);
            resolve(false);
        });
        
        req.end();
    });
}

async function runTests() {
    console.log('Starting comprehensive image tests...\n');
    
    // Test API first
    const apiResult = await testAPI();
    
    let imageTestResult = false;
    if (apiResult.success && apiResult.imageUrl) {
        // Test the actual image URL from the API
        imageTestResult = await testImage(apiResult.imageUrl);
    } else {
        // Test a known image path
        console.log('\n🔧 Testing fallback image path...');
        imageTestResult = await testImage('/uploads/1754453446477-kgg86a.png');
    }
    
    // Summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('======================');
    console.log(`✅ API Working: ${apiResult.success ? 'YES' : 'NO'}`);
    console.log(`✅ Images Accessible: ${imageTestResult ? 'YES' : 'NO'}`);
    
    if (apiResult.success && imageTestResult) {
        console.log('\n🎉 SUCCESS: Production image fixes are working!');
        console.log('   - API returns proper coverImageUrl properties');
        console.log('   - Static files are served correctly');
        console.log('   - Images are accessible via HTTP');
        console.log('\n🚀 Ready for production deployment!');
    } else {
        console.log('\n❌ ISSUE DETECTED:');
        if (!apiResult.success) {
            console.log(`   - API Problem: ${apiResult.reason}`);
        }
        if (!imageTestResult) {
            console.log(`   - Image serving issue detected`);
        }
    }
}

runTests().catch(console.error);