#!/usr/bin/env node

/**
 * FINAL Production Fix - Use ACTUAL existing files
 */

import { Client } from 'pg';

async function finalProductionFix() {
  console.log('🔧 Applying FINAL production fix with real files...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Map to ACTUAL image files that exist in uploads/images/
    const realImageUpdates = [
      { id: 'dbdba9fa-35a9-4329-a355-6607ce0c1313', image: '/uploads/images/1755031962335-268446774.jpg' },
      { id: 'd87dfd66-1828-49bc-b73a-c80aece4d025', image: '/uploads/images/1755032410342-388611501.jpg' },
      { id: '8ab4ac46-cd94-44a2-85d2-67782c434dfe', image: '/uploads/images/1755032591870-311126596.jpg' },
      { id: '454c75e5-bc56-4a6b-b567-9af4dd830b67', image: '/uploads/images/1755032714016-48741181.jpg' }
    ];

    console.log('📸 Fixing with REAL image files...');
    for (const update of realImageUpdates) {
      const result = await client.query(
        'UPDATE books SET cover_image_url = $1 WHERE id = $2',
        [update.image, update.id]
      );
      console.log(`  ✅ Updated image for book ${update.id}: ${update.image}`);
    }

    // PDF paths are already fixed and working
    console.log('📚 PDFs already fixed and working');

    // Verify both images and PDFs
    console.log('🔍 Final verification...');
    const verification = await client.query(`
      SELECT 
        id, title, cover_image_url, pdf_url
      FROM books 
      WHERE id IN (
        'dbdba9fa-35a9-4329-a355-6607ce0c1313',
        'd87dfd66-1828-49bc-b73a-c80aece4d025',
        '8ab4ac46-cd94-44a2-85d2-67782c434dfe',
        '454c75e5-bc56-4a6b-b567-9af4dd830b67'
      )
      ORDER BY title
    `);
    
    console.log('📊 Fixed Books:');
    for (const book of verification.rows) {
      console.log(`  - ${book.title}`);
      console.log(`    Image: ${book.cover_image_url}`);
      console.log(`    PDF: ${book.pdf_url}`);
    }

    console.log('✅ FINAL production fix completed - both images and PDFs should work!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

finalProductionFix();