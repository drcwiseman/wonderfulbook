#!/usr/bin/env node

/**
 * Create redirect mapping for missing book IDs
 * This prevents users from hitting broken book links
 */

import { Client } from 'pg';

async function createRedirectMapping() {
  console.log('Creating redirect mapping for missing book IDs...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get the first available working book as a fallback
    const workingBooks = await client.query(`
      SELECT id, title, pdf_url 
      FROM books 
      WHERE pdf_url IS NOT NULL 
      ORDER BY title 
      LIMIT 5
    `);

    if (workingBooks.rows.length === 0) {
      console.log('No working books found!');
      return;
    }

    console.log('Available working books:');
    workingBooks.rows.forEach((book, index) => {
      console.log(`  ${index + 1}. ${book.title} (${book.id})`);
    });

    // Use the first book as the default redirect
    const defaultBook = workingBooks.rows[0];
    console.log(`Default redirect book: ${defaultBook.title}`);
    console.log(`Default book ID: ${defaultBook.id}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createRedirectMapping();