-- CRITICAL PRODUCTION FIX: Update all mismatched PDFs to correct files
-- This fixes the 175504xxx series books that have wrong PDF URLs

-- Toxic Thinking
UPDATE books SET pdf_url = '/uploads/pdfs/1754453468245-7a2lh9.pdf' 
WHERE title LIKE '%Toxic Thinking%' AND pdf_url LIKE '%175504%';

-- Self-Doubt  
UPDATE books SET pdf_url = '/uploads/pdfs/1754453915874-oqutoa.pdf'
WHERE title LIKE '%Self-Doubt%' AND pdf_url LIKE '%175504%';

-- Insecurity
UPDATE books SET pdf_url = '/uploads/pdfs/1754454019850-f4821w.pdf'
WHERE title LIKE '%Insecurity%' AND pdf_url LIKE '%175504%';

-- Loneliness
UPDATE books SET pdf_url = '/uploads/pdfs/1754454138199-mlvw7.pdf'
WHERE title LIKE '%Loneliness%' AND pdf_url LIKE '%175504%';

-- Toxic Relationships
UPDATE books SET pdf_url = '/uploads/pdfs/1754454747556-ejj37p.pdf'
WHERE title LIKE '%Toxic Relationships%' AND pdf_url LIKE '%175504%';

-- Spirit Of Shame
UPDATE books SET pdf_url = '/uploads/pdfs/1754454880444-jt4n8q.pdf'
WHERE title LIKE '%Spirit Of Shame%' AND pdf_url LIKE '%175504%';

-- Frustration
UPDATE books SET pdf_url = '/uploads/pdfs/1754455632785-zprlp.pdf'
WHERE title LIKE '%Frustration%' AND pdf_url LIKE '%175504%';

-- Procrastination
UPDATE books SET pdf_url = '/uploads/pdfs/1754455757797-ta3v7.pdf'
WHERE title LIKE '%Procrastination%' AND pdf_url LIKE '%175504%';

-- Bitterness
UPDATE books SET pdf_url = '/uploads/pdfs/1754455921052-vkihvn.pdf'
WHERE title LIKE '%Bitterness%' AND pdf_url LIKE '%175504%';

-- Prayerlessness
UPDATE books SET pdf_url = '/uploads/pdfs/1754456147817-aptmog.pdf'
WHERE title LIKE '%Prayerlessness%' AND pdf_url LIKE '%175504%';

-- Depression
UPDATE books SET pdf_url = '/uploads/pdfs/1755032613461-mx3sdv.pdf'
WHERE title LIKE '%Depression%' AND pdf_url LIKE '%175504%';

-- Family Conflicts
UPDATE books SET pdf_url = '/uploads/pdfs/1755032723387-t7i7kr.pdf'
WHERE title LIKE '%Family Conflicts%' AND pdf_url LIKE '%175504%';

-- Captivity
UPDATE books SET pdf_url = '/uploads/pdfs/1755032794860-trf62e.pdf'
WHERE title LIKE '%Captivity%' AND pdf_url LIKE '%175504%';

-- Anxiety
UPDATE books SET pdf_url = '/uploads/pdfs/1755032859148-dzcss.pdf'
WHERE title LIKE '%Anxiety%' AND pdf_url LIKE '%175504%';

-- Anger
UPDATE books SET pdf_url = '/uploads/pdfs/1755032916923-12h2z.pdf'
WHERE title LIKE '%Anger%' AND pdf_url LIKE '%175504%';

-- Grief
UPDATE books SET pdf_url = '/uploads/pdfs/1755033008434-9z4dr.pdf'
WHERE title LIKE '%Grief%' AND pdf_url LIKE '%175504%';

-- Spiritual Attacks
UPDATE books SET pdf_url = '/uploads/pdfs/1755033058744-ya9a2d.pdf'
WHERE title LIKE '%Spiritual Attacks%' AND pdf_url LIKE '%175504%';

-- Bad Luck
UPDATE books SET pdf_url = '/uploads/pdfs/1755033229827-xw5q46.pdf'
WHERE title LIKE '%Bad Luck%' AND pdf_url LIKE '%175504%';

-- Fear Of Success
UPDATE books SET pdf_url = '/uploads/pdfs/1755033307515-jq1rb.pdf'
WHERE title LIKE '%Fear Of Success%' AND pdf_url LIKE '%175504%';

-- Fear of Change
UPDATE books SET pdf_url = '/uploads/pdfs/1755033490687-xanquo.pdf'
WHERE title LIKE '%Fear of Change%' AND pdf_url LIKE '%175504%';

-- Additional books that need fixing
UPDATE books SET pdf_url = '/uploads/pdfs/1755033573864-010ijp.pdf'
WHERE title LIKE '%Fear Of The Unknown%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755033707604-2481rb.pdf'
WHERE title LIKE '%Lack Of Purpose%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755033820204-l9dsbf.pdf'
WHERE title LIKE '%Lack of Enthusiasm%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755033878578-pznagr.pdf'
WHERE title LIKE '%Fear Of Rejection%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755033939102-eug05.pdf'
WHERE title LIKE '%Fear Of Old Age%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755033989306-jzskur.pdf'
WHERE title LIKE '%Fear Of Criticism%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755034375478-63o49k.pdf'
WHERE title LIKE '%Lost Love%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755034534343-zrroxp.pdf'
WHERE title LIKE '%Fear Of Poverty%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755032613461-mx3sdv.pdf'
WHERE title LIKE '%Fear Of Failure%' AND pdf_url LIKE '%175503%';

UPDATE books SET pdf_url = '/uploads/pdfs/1755034643988-hmcq07.pdf'
WHERE title LIKE '%Fear Of Ill Health%' AND pdf_url LIKE '%175503%';

-- Report how many books were fixed
SELECT COUNT(*) as books_fixed FROM books WHERE pdf_url LIKE '/uploads/pdfs/175%';