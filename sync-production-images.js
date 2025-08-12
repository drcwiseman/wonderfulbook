#!/usr/bin/env node

// Script to sync production images with development database

import https from 'https';
import { execSync } from 'child_process';

console.log('🔄 SYNCING PRODUCTION IMAGES WITH DATABASE');
console.log('==========================================');

// Get current production API response
function getProductionBooks() {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'mywonderfulbooks.com',
            path: '/api/books',
            method: 'GET',
            headers: {
                'User-Agent': 'Image Sync Script'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const books = JSON.parse(data);
                    resolve(books);
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// Test if an image URL works in production
function testProductionImage(imageUrl) {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'mywonderfulbooks.com',
            path: imageUrl,
            method: 'HEAD'
        }, (res) => {
            resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

async function syncImages() {
    try {
        console.log('📡 Fetching production book data...');
        const productionBooks = await getProductionBooks();
        console.log(`   Found ${productionBooks.length} books in production`);
        
        console.log('\n🔍 Checking image accessibility...');
        
        const imageResults = [];
        
        // Test first 5 books' images
        for (let i = 0; i < Math.min(5, productionBooks.length); i++) {
            const book = productionBooks[i];
            if (book.coverImageUrl) {
                const works = await testProductionImage(book.coverImageUrl);
                imageResults.push({
                    title: book.title,
                    imageUrl: book.coverImageUrl,
                    works: works
                });
                console.log(`   ${works ? '✅' : '❌'} ${book.coverImageUrl}`);
            }
        }
        
        // Generate SQL update commands for working images
        console.log('\n📝 Generated SQL Update Commands:');
        console.log('==================================');
        
        const workingImages = imageResults.filter(r => r.works);
        
        if (workingImages.length > 0) {
            console.log('-- Update database with working production images');
            workingImages.forEach(image => {
                const safTitle = image.title.replace(/'/g, "''");
                console.log(`UPDATE books SET cover_image_url = '${image.imageUrl}' WHERE title = '${safTitle}';`);
            });
        } else {
            console.log('-- No working images found in production');
            console.log('-- This suggests the images may have been moved or deleted');
        }
        
        console.log('\n📊 Summary:');
        console.log(`   Working images: ${workingImages.length}/${imageResults.length}`);
        console.log(`   Failed images: ${imageResults.length - workingImages.length}/${imageResults.length}`);
        
        if (workingImages.length === 0) {
            console.log('\n⚠️  NO IMAGES WORKING - Possible causes:');
            console.log('   1. Images were deleted from production uploads directory');
            console.log('   2. New deployment cleared uploads folder');
            console.log('   3. Different deployment/server serving different files');
            console.log('\n💡 Solution: Re-upload book cover images to production');
        }
        
    } catch (error) {
        console.error('❌ Error syncing images:', error.message);
    }
}

syncImages();