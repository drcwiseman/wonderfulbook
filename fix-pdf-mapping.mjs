#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log("=== CREATING PROPER PDF MAPPING SOLUTION ===");
console.log("");

// Read production data
const prodData = JSON.parse(fs.readFileSync('prod-books-full.json', 'utf8'));

// Find books with 175504xxx images (the problematic ones)
const problemBooks = prodData.filter(b => 
  b.coverImageUrl && b.coverImageUrl.includes('175504')
);

console.log(`Found ${problemBooks.length} books with 175504xxx images that need mapping`);
console.log("");

// Create precise title-to-PDF mapping based on what we know
const titleToPdfMap = {
  "Toxic Thinking": "1754453468245-7a2lh9.pdf",
  "Self-Doubt": "1754453915874-oqutoa.pdf", 
  "Insecurity": "1754454019850-f4821w.pdf",
  "Loneliness": "1754454138199-mlvw7.pdf",
  "Toxic Relationships": "1754454747556-ejj37p.pdf",
  "Spirit Of Shame": "1754454880444-jt4n8q.pdf",
  "Frustration": "1754455632785-zprlp.pdf",
  "Procrastination": "1754455757797-ta3v7.pdf",
  "Bitterness": "1754455921052-vkihvn.pdf",
  "Prayerlessness": "1754456147817-aptmog.pdf",
  "Depression": "1755032613461-mx3sdv.pdf",
  "Family Conflicts": "1755032723387-t7i7kr.pdf",
  "Captivity": "1755032794860-trf62e.pdf",
  "Anxiety": "1755032859148-dzcss.pdf",
  "Anger": "1755032916923-12h2z.pdf",
  "Grief": "1755033008434-9z4dr.pdf",
  "Spiritual Attacks": "1755033058744-ya9a2d.pdf",
  "Bad Luck": "1755033229827-xw5q46.pdf",
  "Fear Of Success": "1755033307515-jq1rb.pdf",
  "Fear of Change": "1755033490687-xanquo.pdf"
};

console.log("Mapping Table:");
console.log("==============");

problemBooks.forEach(book => {
  const title = book.title || '';
  let mappedPdf = null;
  
  // Find the matching PDF by keywords in title
  for (const [keyword, pdfFile] of Object.entries(titleToPdfMap)) {
    if (title.includes(keyword)) {
      mappedPdf = pdfFile;
      break;
    }
  }
  
  console.log(`\nBook: ${title.substring(0, 50)}`);
  console.log(`  Current PDF: ${book.pdfUrl}`);
  console.log(`  Should map to: /uploads/pdfs/${mappedPdf || 'NO_MATCH_FOUND'}`);
  
  if (mappedPdf) {
    const pdfPath = path.join('uploads/pdfs', mappedPdf);
    const exists = fs.existsSync(pdfPath);
    console.log(`  PDF exists: ${exists ? '✓' : '✗'}`);
  }
});

console.log("\n");
console.log("Solution: Update the fallback system to use these precise mappings");
console.log("This ensures each book loads its correct content, not a mismatched PDF");