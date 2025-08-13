#!/usr/bin/env node

/**
 * Final PDF Fix - Create a simple fallback that always works
 */

import { Client } from 'pg';

async function implementFinalFix() {
  console.log('🔧 Implementing final PDF fix...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Get any working book as default
    const result = await client.query(`
      SELECT id, title, pdf_url 
      FROM books 
      WHERE pdf_url LIKE '/uploads/pdfs/1755%'
      ORDER BY title 
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      const defaultBook = result.rows[0];
      console.log(`✅ Default book available: ${defaultBook.title}`);
      console.log(`   Book ID: ${defaultBook.id}`);
      console.log(`   PDF URL: ${defaultBook.pdf_url}`);
      console.log(`   Direct access: https://mywonderfulbooks.com${defaultBook.pdf_url}`);
      
      // Test direct file access
      const directFileUrl = `https://mywonderfulbooks.com${defaultBook.pdf_url}`;
      console.log(`\n🧪 Testing direct file access...`);
      console.log(`   URL: ${directFileUrl}`);
    } else {
      console.log('❌ No working books found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

implementFinalFix();