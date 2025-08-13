#!/usr/bin/env node

console.log("=== PRODUCTION FIX SCRIPT ===");
console.log("");
console.log("This script generates the exact SQL commands needed to fix production.");
console.log("");
console.log("Copy and run these in your production database:");
console.log("==============================================");
console.log("");

// Generate SQL for each book
const updates = [
  ["6f69d071-ca1f-4e49-b025-185fd43ec584", "1754453468245-7a2lh9.pdf", "Toxic Thinking"],
  ["0573375c-80e5-4da0-907b-f25d691180b9", "1754453915874-oqutoa.pdf", "Self-Doubt"],
  ["f6851fc1-0bf4-4b62-acd6-9b335daef32c", "1754454019850-f4821w.pdf", "Insecurity"],
  ["39d01b6d-f56a-4b6a-9b60-bdeb096712b4", "1754454138199-mlvw7.pdf", "Loneliness"],
  ["648c3647-953c-4075-83c6-18db3f528a01", "1754454747556-ejj37p.pdf", "Toxic Relationships"],
  ["158b8c60-925c-4f6f-bec4-75f246fdb3ef", "1754454880444-jt4n8q.pdf", "Spirit Of Shame"],
  ["9f13b338-10ac-4a79-9b58-0f68bb16071b", "1754455632785-zprlp.pdf", "Frustration"],
  ["58c235ff-6880-428c-8b09-38519a3fccee", "1754455757797-ta3v7.pdf", "Procrastination"],
  ["901061e7-a7c0-4776-a0c0-c9b4e5ea7fdc", "1754455921052-vkihvn.pdf", "Bitterness"],
  ["023aed4a-01b9-443d-8228-4f605f10f1b9", "1754456147817-aptmog.pdf", "Prayerlessness"]
];

updates.forEach(([id, pdf, title]) => {
  console.log(`UPDATE books SET pdf_url = '/uploads/pdfs/${pdf}' WHERE id = '${id}'; -- ${title}`);
});

console.log("");
console.log("==============================================");
console.log("Run these SQL commands in your production database to fix all PDF mismatches!");
