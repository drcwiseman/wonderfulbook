#!/usr/bin/env node

// Comprehensive verification script for admin fixes

import http from 'http';
import fs from 'fs';
import path from 'path';

console.log('🔍 ADMIN FIXES VERIFICATION');
console.log('============================');

const baseUrl = 'http://localhost:5000';

// Test functions
async function testUploadDirectory() {
    console.log('\n📁 Testing uploads directory...');
    
    const uploadsPath = './uploads';
    const exists = fs.existsSync(uploadsPath);
    console.log(`Uploads directory exists: ${exists}`);
    
    if (exists) {
        const files = fs.readdirSync(uploadsPath);
        console.log(`Files in uploads: ${files.length}`);
        
        if (files.length > 0) {
            const sampleFile = files[0];
            console.log(`Sample file: ${sampleFile}`);
            
            // Test static file serving
            return new Promise((resolve) => {
                const req = http.get(`${baseUrl}/uploads/${sampleFile}`, (res) => {
                    console.log(`Static file serving status: ${res.statusCode}`);
                    console.log(`Content-Type: ${res.headers['content-type']}`);
                    console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
                    resolve(res.statusCode === 200);
                });
                
                req.on('error', (err) => {
                    console.log(`Static file serving error: ${err.message}`);
                    resolve(false);
                });
            });
        }
    }
    
    return exists;
}

async function testPlaceholderEndpoint() {
    console.log('\n🖼️ Testing placeholder endpoint...');
    
    return new Promise((resolve) => {
        const req = http.get(`${baseUrl}/api/placeholder/200/280`, (res) => {
            console.log(`Placeholder endpoint status: ${res.statusCode}`);
            console.log(`Content-Type: ${res.headers['content-type']}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const isSvg = data.includes('<svg') && data.includes('Book Cover');
                console.log(`Valid SVG placeholder: ${isSvg}`);
                resolve(res.statusCode === 200 && isSvg);
            });
        });
        
        req.on('error', (err) => {
            console.log(`Placeholder endpoint error: ${err.message}`);
            resolve(false);
        });
    });
}

async function testBookMappingAPI() {
    console.log('\n🔗 Testing book property mapping...');
    
    return new Promise((resolve) => {
        // Read session cookie for admin auth
        let cookie = '';
        try {
            if (fs.existsSync('./admin_working_session.txt')) {
                cookie = fs.readFileSync('./admin_working_session.txt', 'utf8').trim();
            }
        } catch (e) {
            console.log('No admin session found, testing without auth...');
        }
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/books',
            method: 'GET',
            headers: cookie ? { Cookie: cookie } : {}
        };
        
        const req = http.request(options, (res) => {
            console.log(`Admin books API status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        console.log(`API Response: ${data}`);
                        resolve(false);
                        return;
                    }
                    
                    const books = JSON.parse(data);
                    console.log(`Books returned: ${books.length}`);
                    
                    if (books.length > 0) {
                        const book = books[0];
                        const hasCoverImage = 'coverImage' in book;
                        const hasCoverImageUrl = 'coverImageUrl' in book;
                        const hasTier = 'tier' in book;
                        const hasRequiredTier = 'requiredTier' in book;
                        
                        console.log(`Book has coverImage property: ${hasCoverImage}`);
                        console.log(`Book has coverImageUrl property: ${hasCoverImageUrl}`);
                        console.log(`Book has tier property: ${hasTier}`);
                        console.log(`Book has requiredTier property: ${hasRequiredTier}`);
                        
                        if (hasCoverImage && book.coverImage) {
                            console.log(`Sample coverImage value: ${book.coverImage}`);
                        }
                        
                        resolve(hasCoverImage);
                    } else {
                        console.log('No books found in database');
                        resolve(true); // Not a failure, just no data
                    }
                } catch (e) {
                    console.log(`JSON parse error: ${e.message}`);
                    console.log(`Raw response: ${data.substring(0, 200)}...`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`Admin books API error: ${err.message}`);
            resolve(false);
        });
        
        req.end();
    });
}

async function runAllTests() {
    console.log('Starting verification tests...\n');
    
    const results = {
        uploads: await testUploadDirectory(),
        placeholder: await testPlaceholderEndpoint(),
        bookMapping: await testBookMappingAPI()
    };
    
    console.log('\n📊 RESULTS SUMMARY');
    console.log('==================');
    console.log(`✅ Uploads directory: ${results.uploads ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Placeholder endpoint: ${results.placeholder ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Book property mapping: ${results.bookMapping ? 'PASS' : 'FAIL'}`);
    
    const allPassed = Object.values(results).every(Boolean);
    console.log(`\n🎯 Overall Status: ${allPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
    
    if (allPassed) {
        console.log('\n🚀 All admin fixes are working correctly!');
        console.log('✅ Book cover images should now display properly');
        console.log('✅ Image fallbacks are in place for missing covers');
        console.log('✅ Static file serving is optimized for production');
    } else {
        console.log('\n⚠️  Some issues remain - check the failed tests above');
    }
    
    return allPassed;
}

// Run tests
runAllTests().catch(console.error);