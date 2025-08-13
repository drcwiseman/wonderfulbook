#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log("=== CRITICAL PRODUCTION FIX ===");
console.log("");
console.log("PROBLEM IDENTIFIED:");
console.log("- Books uploaded with 175504xxx images have NO PDFs");
console.log("- These are duplicate entries of existing books");
console.log("- Need to map them to the correct existing PDFs");
console.log("");

// Check what PDFs actually exist
const pdfDir = 'uploads/pdfs';
const existingPdfs = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
console.log(`Found ${existingPdfs.length} PDF files in ${pdfDir}`);

// The Dr C Wiseman books that have valid PDFs
const validBooks = [
  { title: "30 Days To Overcome Toxic Thinking", pdf: "1754453468245-7a2lh9.pdf" },
  { title: "30 Days to Overcome Self-Doubt", pdf: "1754453915874-oqutoa.pdf" },
  { title: "30 Days To Overcome Insecurity", pdf: "1754454019850-f4821w.pdf" },
  { title: "30 Days to Overcome Loneliness", pdf: "1754454138199-mlvw7.pdf" },
  { title: "30 Days To Overcome Toxic Relationships", pdf: "1754454747556-ejj37p.pdf" },
  { title: "30 Days To Overcome The Spirit Of Shame", pdf: "1754454880444-jt4n8q.pdf" },
  { title: "30 Days To Overcome Frustration", pdf: "1755032613461-mx3sdv.pdf" }, // Fear of Failure PDF
  { title: "30 Days to Overcome Procrastination", pdf: "1754455757797-ta3v7.pdf" },
  { title: "30 Days To Overcome Bitterness", pdf: "1754455921052-vkihvn.pdf" },
  { title: "30 Days To Overcome Prayerlessness", pdf: "1754456147817-aptmog.pdf" },
];

console.log("\nPDF Mapping Table:");
validBooks.forEach(book => {
  const pdfPath = path.join(pdfDir, book.pdf);
  const exists = fs.existsSync(pdfPath);
  console.log(`- ${book.title}: ${book.pdf} [${exists ? 'EXISTS' : 'MISSING'}]`);
});

console.log("\n✅ Solution: Update production database to map 175504xxx books to correct PDFs");
console.log("This needs to be done directly in the production database");