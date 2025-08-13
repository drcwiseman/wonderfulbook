-- IMMEDIATE FIX: Update ALL 175504xxx PDFs to working ones
-- Run this DIRECTLY on your production database

-- Fix by specific book IDs (more reliable than title matching)
UPDATE books SET pdf_url = '/uploads/pdfs/1754453468245-7a2lh9.pdf' WHERE id = '6f69d071-ca1f-4e49-b025-185fd43ec584';
UPDATE books SET pdf_url = '/uploads/pdfs/1754453915874-oqutoa.pdf' WHERE id = '0573375c-80e5-4da0-907b-f25d691180b9';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454019850-f4821w.pdf' WHERE id = 'f6851fc1-0bf4-4b62-acd6-9b335daef32c';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454138199-mlvw7.pdf' WHERE id = '39d01b6d-f56a-4b6a-9b60-bdeb096712b4';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454747556-ejj37p.pdf' WHERE id = '648c3647-953c-4075-83c6-18db3f528a01';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454880444-jt4n8q.pdf' WHERE id = '158b8c60-925c-4f6f-bec4-75f246fdb3ef';
UPDATE books SET pdf_url = '/uploads/pdfs/1754455632785-zprlp.pdf' WHERE id = '9f13b338-10ac-4a79-9b58-0f68bb16071b';
UPDATE books SET pdf_url = '/uploads/pdfs/1754455757797-ta3v7.pdf' WHERE id = '58c235ff-6880-428c-8b09-38519a3fccee';
UPDATE books SET pdf_url = '/uploads/pdfs/1754455921052-vkihvn.pdf' WHERE id = '901061e7-a7c0-4776-a0c0-c9b4e5ea7fdc';
UPDATE books SET pdf_url = '/uploads/pdfs/1754456147817-aptmog.pdf' WHERE id = '023aed4a-01b9-443d-8228-4f605f10f1b9';
UPDATE books SET pdf_url = '/uploads/pdfs/1755032613461-mx3sdv.pdf' WHERE id = '034df9a4-12e7-48db-a8a8-b4a57ddb3956';
UPDATE books SET pdf_url = '/uploads/pdfs/1755032723387-t7i7kr.pdf' WHERE id = '715003e8-c2bc-4a0d-9169-dde1bb07b000';
UPDATE books SET pdf_url = '/uploads/pdfs/1755032794860-trf62e.pdf' WHERE id = 'e374b2ac-0b41-409e-a319-331b699a2b94';
UPDATE books SET pdf_url = '/uploads/pdfs/1755032859148-dzcss.pdf' WHERE id = '5aba1384-eab9-4124-a810-a9b5048f2eb7';
UPDATE books SET pdf_url = '/uploads/pdfs/1755032916923-12h2z.pdf' WHERE id = 'ae9f3c61-0e79-4be7-8774-29d590db47f6';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033008434-9z4dr.pdf' WHERE id = '9ba3f2d5-68ad-44ab-9b5d-5a293d1cd269';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033058744-ya9a2d.pdf' WHERE id = 'b0406c95-62ce-4108-9928-e157439c3ed5';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033229827-xw5q46.pdf' WHERE id = 'f4160df1-4cbe-4e4f-8150-62e302b70af0';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033307515-jq1rb.pdf' WHERE id = '131d4796-a324-4966-a44a-6a2face0e808';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033490687-xanquo.pdf' WHERE id = '4e002a69-1023-4594-958c-03b4d41bafbd';

-- Additional books that weren't in first batch
UPDATE books SET pdf_url = '/uploads/pdfs/1755033573864-010ijp.pdf' WHERE id = '967b69ad-1043-4e33-8ad3-5f56c017c03e';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033707604-2481rb.pdf' WHERE id = '25dc8985-a5ef-406b-abf1-8a93f75e19e1';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033820204-l9dsbf.pdf' WHERE id = '24093e63-c3d2-4c8d-8c2f-aca97c6ad5a8';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033878578-pznagr.pdf' WHERE id = '3e9c17f9-9638-4631-851b-9f2d10cb8fb5';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033939102-eug05.pdf' WHERE id = '08adeca5-8b09-49e5-84df-ad3e92b23c96';
UPDATE books SET pdf_url = '/uploads/pdfs/1755033989306-jzskur.pdf' WHERE id = '18a58088-bd84-486c-9f84-6c05eed8e636';
UPDATE books SET pdf_url = '/uploads/pdfs/1755034375478-63o49k.pdf' WHERE id = '9e01c2f9-5b9f-48ef-ba36-3f77e27e2bb9';
UPDATE books SET pdf_url = '/uploads/pdfs/1755034534343-zrroxp.pdf' WHERE id = 'a091de4f-b5f4-4033-8e77-ea86f685c2b4';
UPDATE books SET pdf_url = '/uploads/pdfs/1755032613461-mx3sdv.pdf' WHERE id = '85bb3fb1-9cb9-4767-ba97-dd9e8a45e5e8';
UPDATE books SET pdf_url = '/uploads/pdfs/1755034643988-hmcq07.pdf' WHERE id = '3acd86ff-b5ec-48e5-8c66-f8c72e7bc1a9';

-- Verify the fix worked
SELECT COUNT(*) as fixed_books FROM books WHERE pdf_url NOT LIKE '%175504%';