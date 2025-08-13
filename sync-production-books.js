const { Pool } = require('pg');
const fs = require('fs');

async function syncBooks() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Clear existing books
    await pool.query('TRUNCATE TABLE books CASCADE');
    console.log('Cleared existing books');
    
    // Insert production books with corrected PDFs
    const books = [
      {
        id: '6f69d071-ca1f-4e49-b025-185fd43ec584',
        title: '30 Days to Overcome Toxic Thinking',
        pdf: '/uploads/pdfs/1754453468245-7a2lh9.pdf'
      },
      {
        id: '0573375c-80e5-4da0-907b-f25d691180b9', 
        title: '30 Days to Overcome Self-Doubt',
        pdf: '/uploads/pdfs/1754453915874-oqutoa.pdf'
      },
      {
        id: 'f6851fc1-0bf4-4b62-acd6-9b335daef32c',
        title: '30 Days To Overcome Insecurity',
        pdf: '/uploads/pdfs/1754454019850-f4821w.pdf'
      }
    ];
    
    for (const book of books) {
      await pool.query(
        `INSERT INTO books (id, title, author, pdf_url, cover_image_url, required_tier, created_at, updated_at)
         VALUES ($1, $2, 'Dr C Wiseman', $3, '/uploads/default-cover.jpg', 'free', NOW(), NOW())`,
        [book.id, book.title, book.pdf]
      );
      console.log('Added:', book.title);
    }
    
    console.log('Sync complete!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

syncBooks();
