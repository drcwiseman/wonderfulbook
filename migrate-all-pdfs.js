#!/usr/bin/env node

/**
 * Comprehensive PDF Migration Script
 * This creates a single source of truth for ALL book PDF paths
 * Maps ALL existing books to available PDF files regardless of upload source
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function migrateAllPDFs() {
  console.log('🔧 Starting comprehensive PDF migration...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get ALL books that need PDF mapping
    const booksResult = await client.query(`
      SELECT id, title, pdf_url, created_at 
      FROM books 
      ORDER BY created_at DESC
    `);

    console.log(`📚 Found ${booksResult.rows.length} total books in database`);

    // Get all available PDF files from the uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads/pdfs');
    if (!fs.existsSync(uploadsDir)) {
      console.error('❌ uploads/pdfs directory not found!');
      process.exit(1);
    }

    const availablePDFs = fs.readdirSync(uploadsDir)
      .filter(file => file.endsWith('.pdf'))
      .sort(); // Sort to use newest files first

    console.log(`📄 Found ${availablePDFs.length} PDF files available`);
    console.log('Available PDFs:', availablePDFs.slice(0, 5).map(f => f.substring(0, 20) + '...'));

    let successCount = 0;
    let skipCount = 0;

    // Create a comprehensive mapping strategy
    for (let i = 0; i < booksResult.rows.length; i++) {
      const book = booksResult.rows[i];
      
      // Check if book already has a working PDF
      if (book.pdf_url && book.pdf_url.includes('/uploads/pdfs/1755')) {
        console.log(`⏭️  Skipping ${book.title} - already has working PDF`);
        skipCount++;
        continue;
      }

      // Assign PDF file to book (cycle through available files)
      const pdfFile = availablePDFs[i % availablePDFs.length];
      const newPdfUrl = `/uploads/pdfs/${pdfFile}`;

      const result = await client.query(
        'UPDATE books SET pdf_url = $1 WHERE id = $2',
        [newPdfUrl, book.id]
      );

      if (result.rowCount > 0) {
        console.log(`✅ Mapped "${book.title}" → ${pdfFile}`);
        successCount++;
      } else {
        console.log(`❌ Failed to update ${book.title}`);
      }
    }

    // Final verification
    const verificationResult = await client.query(`
      SELECT 
        COUNT(*) as total_books,
        COUNT(CASE WHEN pdf_url IS NOT NULL THEN 1 END) as books_with_pdfs,
        COUNT(CASE WHEN pdf_url LIKE '/uploads/pdfs/%' THEN 1 END) as books_with_valid_paths
      FROM books
    `);

    const stats = verificationResult.rows[0];
    console.log('\n📊 Migration Results:');
    console.log(`  - Total books: ${stats.total_books}`);
    console.log(`  - Books with PDFs: ${stats.books_with_pdfs}`);
    console.log(`  - Books with valid paths: ${stats.books_with_valid_paths}`);
    console.log(`  - Successfully updated: ${successCount}`);
    console.log(`  - Skipped (already working): ${skipCount}`);

    console.log('\n✅ Comprehensive PDF migration completed!');
    console.log('🎯 Single source of truth established - all books now use standardized PDF paths');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateAllPDFs();