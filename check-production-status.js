#!/usr/bin/env node

// Check production deployment status and image issues

import https from 'https';

console.log('🔍 PRODUCTION STATUS CHECK');
console.log('==========================');

function makeRequest(path, description) {
    return new Promise((resolve, reject) => {
        console.log(`📡 ${description}...`);
        
        const req = https.request({
            hostname: 'mywonderfulbooks.com',
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Production Status Checker'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
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

async function checkProductionStatus() {
    try {
        // Check API books endpoint
        const booksResponse = await makeRequest('/api/books', 'Checking books API');
        
        if (booksResponse.status === 200) {
            const books = JSON.parse(booksResponse.body);
            console.log(`✅ Books API responding: ${books.length} books found`);
            
            // Check first few book cover images
            const mainBooks = books.slice(0, 5);
            console.log('\n📖 Main book covers:');
            
            for (const book of mainBooks) {
                if (book.coverImageUrl) {
                    // Test the image
                    try {
                        const imageResponse = await makeRequest(book.coverImageUrl, `Testing ${book.title.substring(0, 30)}...`);
                        const status = imageResponse.status === 200 ? '✅' : '❌';
                        console.log(`   ${status} ${book.coverImageUrl} (${imageResponse.status})`);
                        
                        if (imageResponse.status !== 200) {
                            console.log(`      Title: "${book.title}"`);
                        }
                    } catch (e) {
                        console.log(`   ❌ ${book.coverImageUrl} (Error: ${e.message})`);
                    }
                } else {
                    console.log(`   ⚠️  "${book.title}" - No cover image URL`);
                }
            }
            
        } else {
            console.log(`❌ Books API failed: ${booksResponse.status}`);
        }
        
        // Check if any of the original PNG files still exist
        console.log('\n🖼️  Checking original PNG files:');
        const originalPngs = [
            '/uploads/1754453446477-kgg86a.png',
            '/uploads/1754453929800-msice.png',
            '/uploads/1754454150690-j5ycd2.png',
            '/uploads/1754454759109-pm9ru.png',
            '/uploads/1754454964404-hyn8.png'
        ];
        
        for (const png of originalPngs) {
            try {
                const response = await makeRequest(png, `Checking ${png}`);
                const status = response.status === 200 ? '✅' : '❌';
                console.log(`   ${status} ${png} (${response.status})`);
            } catch (e) {
                console.log(`   ❌ ${png} (Error: ${e.message})`);
            }
        }
        
    } catch (error) {
        console.error('❌ Production check failed:', error.message);
    }
}

checkProductionStatus();