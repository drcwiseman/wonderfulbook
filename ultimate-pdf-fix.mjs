#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log("=== ULTIMATE PDF FIX - PERMANENT SOLUTION ===");
console.log("");

// Read production data
const prodData = JSON.parse(fs.readFileSync('production-books-complete.json', 'utf8'));
console.log(`Analyzing ${prodData.length} production books...`);

// These are the ACTUAL PDFs we have locally
const pdfMapping = {
  // Map production book titles to EXISTING local PDFs
  "30 Days to Overcome Toxic Thinking": "1754453468245-7a2lh9.pdf",
  "30 Days to Overcome Self-Doubt": "1754453915874-oqutoa.pdf",
  "30 Days To Overcome Insecurity": "1754454019850-f4821w.pdf",
  "30 Days to Overcome Loneliness": "1754454138199-mlvw7.pdf",
  "30 Days To Overcome Toxic Relationships": "1754454747556-ejj37p.pdf",
  "30 Days To Overcome The Spirit Of Shame": "1754454880444-jt4n8q.pdf",
  "30 Days To Overcome Frustration": "1754455632785-zprlp.pdf",
  "30 Days to Overcome Procrastination": "1754455757797-ta3v7.pdf",
  "30 Days To Overcome Bitterness": "1754455921052-vkihvn.pdf",
  "30 Days To Overcome Prayerlessness": "1754456147817-aptmog.pdf",
  "30 Days To Overcome The Spirit Of Depression": "1755032613461-mx3sdv.pdf",
  "30 Days To Overcome Family Conflicts": "1755032723387-t7i7kr.pdf",
  "30 Days To Overcome The Spirit Of Captivity": "1755032794860-trf62e.pdf",
  "30 Days To Overcome The Spirit Of Anxiety": "1755032859148-dzcss.pdf",
  "30 Days To Overcome The Spirit Of Anger": "1755032916923-12h2z.pdf",
  "30 Days To Overcome The Spirit Of Grief": "1755033008434-9z4dr.pdf",
  "30 Days To Overcome The Fear Of Spiritual Attacks": "1755033058744-ya9a2d.pdf",
  "30 Days To Overcome The Fear Of Bad Luck": "1755033229827-xw5q46.pdf",
  "30 Days To Overcome The Fear Of Success": "1755033307515-jq1rb.pdf",
  "30 Days to Overcome the Fear of Change": "1755033490687-xanquo.pdf"
};

console.log("\nCreating SQL to update production database...");
console.log("====================================");

prodData.forEach(book => {
  const shortTitle = book.title?.substring(0, 60);
  
  // Find the matching PDF
  let correctPdf = null;
  for (const [titleKey, pdfFile] of Object.entries(pdfMapping)) {
    if (book.title && book.title.includes(titleKey.replace("30 Days to Overcome", "").replace("30 Days To Overcome", "").trim())) {
      correctPdf = `/uploads/pdfs/${pdfFile}`;
      break;
    }
  }
  
  if (correctPdf && book.pdfUrl !== correctPdf) {
    console.log(`UPDATE books SET pdf_url = '${correctPdf}' WHERE id = '${book.id}'; -- ${shortTitle}`);
  }
});

console.log("\n");
console.log("These SQL updates need to be run on the PRODUCTION database to fix the PDF mismatches permanently.");
