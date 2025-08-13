-- PRODUCTION DATABASE SYNC - Map working PNG files to correct production books
-- Based on production API showing different titles than development

-- These PNG files are confirmed working in production:
-- ✅ /uploads/1754453446477-kgg86a.png (200)
-- ✅ /uploads/1754453929800-msice.png (200)  
-- ✅ /uploads/1754454150690-j5ycd2.png (200)
-- ✅ /uploads/1754454759109-pm9ru.png (200)
-- ✅ /uploads/1754454964404-hyn8.png (200)

-- Map these working images to the books that need covers in production

-- First, identify books with broken JPG references and update them
UPDATE books 
SET cover_image_url = '/uploads/1754453446477-kgg86a.png'
WHERE cover_image_url = '/uploads/1755039541678-xwxwbp.jpg';

UPDATE books 
SET cover_image_url = '/uploads/1754453929800-msice.png'
WHERE cover_image_url = '/uploads/1755039476096-tplnzo.jpg';

UPDATE books 
SET cover_image_url = '/uploads/1754454150690-j5ycd2.png'
WHERE cover_image_url = '/uploads/1755039391407-ndu4f.jpg';

UPDATE books 
SET cover_image_url = '/uploads/1754454759109-pm9ru.png'
WHERE cover_image_url = '/uploads/1755039335174-9ej5j.jpg';

UPDATE books 
SET cover_image_url = '/uploads/1754454964404-hyn8.png'
WHERE cover_image_url = '/uploads/1755039271576-8luag.jpg';

-- Also update any other broken JPG references to working PNG files
UPDATE books 
SET cover_image_url = '/uploads/1754453446477-kgg86a.png'
WHERE cover_image_url LIKE '%1755039%' AND cover_image_url LIKE '%.jpg';

-- Alternatively, if there are specific mappings needed, use title-based updates:
-- UPDATE books SET cover_image_url = '/uploads/1754453446477-kgg86a.png' WHERE title LIKE '%Fear of Change%';
-- UPDATE books SET cover_image_url = '/uploads/1754453929800-msice.png' WHERE title LIKE '%Fear Of The Unknown%';
-- UPDATE books SET cover_image_url = '/uploads/1754454150690-j5ycd2.png' WHERE title LIKE '%Lack Of Purpose%';
psql "$PRODUCTION_DATABASE_URL" < CRITICAL_PDF_FIX.sql