#!/usr/bin/env node
import fs from 'fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;

console.log("=== SYNCING PRODUCTION DATA TO LOCAL ===");

// Read production data
const prodData = JSON.parse(fs.readFileSync('production-books-complete.json', 'utf8'));
console.log(`Found ${prodData.length} books in production`);

// Create a mapping of what PDFs actually exist locally
const localPdfs = fs.readdirSync('uploads/pdfs').filter(f => f.endsWith('.pdf'));
console.log(`Found ${localPdfs.length} PDF files locally`);

// Analyze the mismatch
const missingPdfs = [];
prodData.forEach(book => {
  if (book.pdfUrl) {
    const pdfFile = book.pdfUrl.split('/').pop();
    const exists = localPdfs.includes(pdfFile);
    if (!exists) {
      missingPdfs.push({
        title: book.title?.substring(0, 50),
        pdf: pdfFile
      });
    }
  }
});

console.log(`\nBooks with missing PDFs: ${missingPdfs.length}`);
missingPdfs.slice(0, 10).forEach(m => {
  console.log(`  - ${m.title}: ${m.pdf}`);
});

console.log("\nSolution: Import production books into local database with proper PDF mappings");
