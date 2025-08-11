const { Pool } = require('pg');

// Connect to production database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});

async function syncFeaturedBooks() {
  const client = await pool.connect();
  
  try {
    // Mark the same books as featured that are featured in development
    const result = await client.query(`
      UPDATE books SET is_featured = true WHERE id IN (
        '25eade19-d8ab-4c25-b9e9-7f2fc63d6808',
        '39a430b3-9bfd-4d3d-a848-2b450f4cfe13', 
        'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa',
        'deba8249-6ec8-4771-adc4-aa450387bd1a',
        '82f9671f-5e8c-41dc-a8b0-22f1852e8532',
        '2c38e9b8-a06c-40fa-a055-f55ebaef7edc'
      ) RETURNING id, title, is_featured;
    `);
    
    console.log('✅ Featured books updated:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`- ${row.title} (${row.id})`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

syncFeaturedBooks().catch(console.error);
