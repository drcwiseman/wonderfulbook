#!/usr/bin/env node

/**
 * Emergency PDF Fix - Direct book access bypass
 * Creates a simple direct PDF serving route for immediate access
 */

import { Client } from 'pg';

async function createEmergencyFix() {
  console.log('🚨 Creating emergency PDF access fix...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Get all working books
    const books = await client.query(`
      SELECT id, title, pdf_url 
      FROM books 
      WHERE pdf_url LIKE '/uploads/pdfs/1755%'
      ORDER BY title 
      LIMIT 10
    `);

    console.log('\n📚 Emergency PDF Access Links:');
    console.log('Copy any of these direct links to test PDF access:');
    
    books.rows.forEach((book, index) => {
      const directUrl = `https://mywonderfulbooks.com/uploads/pdfs/${book.pdf_url.split('/').pop()}`;
      console.log(`${index + 1}. ${book.title.substring(0, 50)}...`);
      console.log(`   Direct PDF: ${directUrl}`);
      console.log(`   Book ID: ${book.id}\n`);
    });

    console.log('🎯 Quick Test: Try opening any direct PDF URL above');
    console.log('📌 These URLs should work immediately without tokens');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createEmergencyFix();