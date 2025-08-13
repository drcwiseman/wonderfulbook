import pg from 'pg';
import https from 'https';
const { Pool } = pg;

// PDF mapping for all 30 Days books
const pdfMapping = {
  'Toxic Thinking': '/uploads/pdfs/1754453468245-7a2lh9.pdf',
  'Self-Doubt': '/uploads/pdfs/1754453915874-oqutoa.pdf',
  'Insecurity': '/uploads/pdfs/1754454019850-f4821w.pdf',
  'Loneliness': '/uploads/pdfs/1754454138199-mlvw7.pdf',
  'Toxic Relationships': '/uploads/pdfs/1754454747556-ejj37p.pdf',
  'Spirit Of Shame': '/uploads/pdfs/1754454880444-jt4n8q.pdf',
  'Frustration': '/uploads/pdfs/1754455632785-zprlp.pdf',
  'Procrastination': '/uploads/pdfs/1754455757797-ta3v7.pdf',
  'Bitterness': '/uploads/pdfs/1754455921052-vkihvn.pdf',
  'Prayerlessness': '/uploads/pdfs/1754456147817-aptmog.pdf',
  'Depression': '/uploads/pdfs/1755032613461-mx3sdv.pdf',
  'Family Conflicts': '/uploads/pdfs/1755032723387-t7i7kr.pdf',
  'Captivity': '/uploads/pdfs/1755032794860-trf62e.pdf',
  'Anxiety': '/uploads/pdfs/1755032859148-dzcss.pdf',
  'Anger': '/uploads/pdfs/1755032916923-12h2z.pdf',
  'Grief': '/uploads/pdfs/1755033008434-9z4dr.pdf',
  'Spiritual Attacks': '/uploads/pdfs/1755033058744-ya9a2d.pdf',
  'Bad Luck': '/uploads/pdfs/1755033229827-xw5q46.pdf',
  'Fear Of Success': '/uploads/pdfs/1755033307515-jq1rb.pdf',
  'Fear of Change': '/uploads/pdfs/1755033490687-xanquo.pdf'
};

function fetchProductionBooks() {
  return new Promise((resolve, reject) => {
    https.get('https://mywonderfulbooks.com/api/books', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function importBooks() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Fetching production books...');
    const prodBooks = await fetchProductionBooks();
    console.log(`Found ${prodBooks.length} books in production`);
    
    // Clear existing books
    await pool.query('TRUNCATE TABLE books CASCADE');
    console.log('Cleared existing books');
    
    let imported = 0;
    for (const book of prodBooks) {
      // Find correct PDF
      let correctPdf = book.pdfUrl;
      for (const [key, pdf] of Object.entries(pdfMapping)) {
        if (book.title && book.title.includes(key)) {
          correctPdf = pdf;
          console.log(`Mapping ${book.title.substring(0, 40)} -> ${pdf}`);
          break;
        }
      }
      
      // Import book with corrected PDF
      await pool.query(
        `INSERT INTO books (
          id, title, author, description, cover_image_url, pdf_url, 
          required_tier, is_featured, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          book.id,
          book.title || 'Untitled',
          book.author || 'Unknown',
          book.description || '',
          book.coverImageUrl || '/uploads/default-cover.jpg',
          correctPdf,
          book.requiredTier || 'free',
          book.isFeatured || false
        ]
      );
      imported++;
    }
    
    console.log(`\nSuccessfully imported ${imported} books with corrected PDFs!`);
    
    // Verify
    const result = await pool.query('SELECT COUNT(*) FROM books');
    console.log(`Total books in database: ${result.rows[0].count}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

importBooks();
