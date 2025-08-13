import fs from 'fs';
import { execSync } from 'child_process';

// Export books data
const exportData = () => {
  try {
    // Get all books from development API
    const response = execSync('curl -s http://localhost:5000/api/books', { encoding: 'utf8' });
    const books = JSON.parse(response);
    
    // Create export file
    const exportData = {
      timestamp: new Date().toISOString(),
      source: 'development',
      bookCount: books.length,
      books: books,
      files: {
        images: fs.readdirSync('uploads').filter(f => f.match(/\.(jpg|jpeg|png)$/i)).length,
        pdfs: fs.readdirSync('uploads/pdfs').filter(f => f.endsWith('.pdf')).length
      }
    };
    
    // Save export
    fs.writeFileSync('development-books-export.json', JSON.stringify(exportData, null, 2));
    
    console.log('✅ Export complete!');
    console.log(`📚 Exported ${books.length} books`);
    console.log(`📁 Export saved to: development-books-export.json`);
    console.log('\nBooks exported:');
    books.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title}`);
    });
    
  } catch (error) {
    console.error('Export failed:', error.message);
  }
};

exportData();
