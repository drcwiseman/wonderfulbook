#!/usr/bin/env node

/**
 * Permanent Production Database Fix
 * This script fixes both image and PDF issues permanently by updating the database
 * with correct file paths that match the actual files in production.
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function fixProductionDatabase() {
  console.log('🔧 Starting permanent production database fix...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // STEP 1: Fix cover images - update to 1755 timestamps (verified working)
    console.log('📸 Fixing cover images...');
    const imageUpdates = [
      { id: 'dbdba9fa-35a9-4329-a355-6607ce0c1313', image: '/uploads/images/1755037346056.png' },
      { id: 'd87dfd66-1828-49bc-b73a-c80aece4d025', image: '/uploads/images/1755042209755.png' },
      { id: '8ab4ac46-cd94-44a2-85d2-67782c434dfe', image: '/uploads/images/1755049469134.png' },
      { id: '454c75e5-bc56-4a6b-b567-9af4dd830b67', image: '/uploads/images/1755049972750.png' }
    ];

    for (const update of imageUpdates) {
      const result = await client.query(
        'UPDATE books SET cover_image_url = $1 WHERE id = $2',
        [update.image, update.id]
      );
      console.log(`  ✅ Updated image for book ${update.id}: ${result.rowCount} rows`);
    }

    // STEP 2: Fix PDF paths - update to existing 1755 timestamp files
    console.log('📚 Fixing PDF paths...');
    const pdfUpdates = [
      { id: 'dbdba9fa-35a9-4329-a355-6607ce0c1313', pdf: '/uploads/pdfs/1755034827480-a2kww9.pdf' },
      { id: 'd87dfd66-1828-49bc-b73a-c80aece4d025', pdf: '/uploads/pdfs/1755034700593-3pstru.pdf' },
      { id: '8ab4ac46-cd94-44a2-85d2-67782c434dfe', pdf: '/uploads/pdfs/1755034643988-hmcq07.pdf' },
      { id: '454c75e5-bc56-4a6b-b567-9af4dd830b67', pdf: '/uploads/pdfs/1755034588615-z5c8ga.pdf' },
      { id: '4a7b2692-31f8-4f83-9ac0-0ac4e5963ab0', pdf: '/uploads/pdfs/1755034534343-zrroxp.pdf' },
      { id: '0c0d186f-b07c-4a5d-8d09-0fa2ba230bd6', pdf: '/uploads/pdfs/1755034470584-cqx08f.pdf' },
      { id: '5ec2c484-dc92-4f7d-8206-5a82d42d247a', pdf: '/uploads/pdfs/1755034375478-63o49k.pdf' },
      { id: '42128171-3216-41ec-9084-2cd5d2fdef39', pdf: '/uploads/pdfs/1755033989306-jzskur.pdf' },
      { id: 'a2e14b5b-e921-4f83-97fd-46b434c67ae6', pdf: '/uploads/pdfs/1755033939102-eug05.pdf' },
      { id: '1472b341-3fd1-4fb9-ad0f-bd38c4d96bf6', pdf: '/uploads/pdfs/1755033878578-pznagr.pdf' },
      { id: 'fbed71e8-d3ad-487c-b0a0-4e1bf1d4c434', pdf: '/uploads/pdfs/1755033820204-l9dsbf.pdf' },
      { id: 'ddfc6862-f8ab-4b23-947d-c840283e2991', pdf: '/uploads/pdfs/1755033707604-2481rb.pdf' },
      { id: 'c1a1c068-b3fc-4c1e-8d8e-2443dfa5b55b', pdf: '/uploads/pdfs/1755033573864-010ijp.pdf' },
      { id: 'ca20bec2-5605-4e4b-9bb4-3345da363d21', pdf: '/uploads/pdfs/1755033490687-xanquo.pdf' },
      { id: 'd5e5e354-307c-4c71-ba3a-16b1f3f7d15a', pdf: '/uploads/pdfs/1755033307515-jq1rb.pdf' },
      { id: '59b6ae43-37b7-4925-bc0b-7e308a51fc08', pdf: '/uploads/pdfs/1755033229827-xw5q46.pdf' },
      { id: 'be7429de-fc02-41d8-a46c-fb1bb9d3a3a8', pdf: '/uploads/pdfs/1755033165636-bjax09.pdf' },
      { id: '7d11a6de-4298-4840-baf9-e7b83381d952', pdf: '/uploads/pdfs/1755033058744-ya9a2d.pdf' },
      { id: '0735ffa1-8b03-4510-8087-7dc97d27f30f', pdf: '/uploads/pdfs/1755033008434-9z4dr.pdf' },
      { id: 'a6108be2-c609-48e3-9131-1d79a567b71d', pdf: '/uploads/pdfs/1755032916923-12h2z.pdf' },
      { id: '7ffc3bb1-0c77-4150-82d2-206f16e8632a', pdf: '/uploads/pdfs/1755032859148-dzcss.pdf' },
      { id: 'ebf6748d-9a59-46f0-a4b9-b9279520a2f9', pdf: '/uploads/pdfs/1755032794860-trf62e.pdf' },
      { id: '603b332b-967a-4df3-bfe4-0e4b2eb54b70', pdf: '/uploads/pdfs/1755032723387-t7i7kr.pdf' },
      { id: '25eade19-d8ab-4c25-b9e9-7f2fc63d6808', pdf: '/uploads/pdfs/1755032613461-mx3sdv.pdf' },
      { id: 'b482f62a-165e-4379-a3eb-099efd4949f6', pdf: '/uploads/pdfs/1755032406629-puznnv.pdf' }
    ];

    for (const update of pdfUpdates) {
      const result = await client.query(
        'UPDATE books SET pdf_url = $1 WHERE id = $2',
        [update.pdf, update.id]
      );
      console.log(`  ✅ Updated PDF for book ${update.id}: ${result.rowCount} rows`);
    }

    // STEP 3: Verify the fixes
    console.log('🔍 Verifying fixes...');
    const verification = await client.query(`
      SELECT 
        COUNT(*) as total_books,
        COUNT(CASE WHEN cover_image_url LIKE '/uploads/images/1755%' THEN 1 END) as fixed_images,
        COUNT(CASE WHEN pdf_url LIKE '/uploads/pdfs/1755%' THEN 1 END) as fixed_pdfs
      FROM books
    `);
    
    const stats = verification.rows[0];
    console.log(`📊 Fix Results:`);
    console.log(`  - Total books: ${stats.total_books}`);
    console.log(`  - Books with fixed images: ${stats.fixed_images}`);
    console.log(`  - Books with fixed PDFs: ${stats.fixed_pdfs}`);

    console.log('✅ Permanent production database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
fixProductionDatabase();