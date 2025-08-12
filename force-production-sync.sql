-- FORCE PRODUCTION DATABASE SYNC - Apply all PNG image fixes

-- Update all problematic books with confirmed working PNG images
UPDATE books SET cover_image_url = '/uploads/1754453446477-kgg86a.png' 
WHERE title = 'Covenant Wealth: Unlocking God''s Divine Economy through Tithes, Offerings & First Fruits';

UPDATE books SET cover_image_url = '/uploads/1754453929800-msice.png' 
WHERE title = 'Multiply the Vision: A Practical Guide to Equipping Leaders Who Make Disciples';

UPDATE books SET cover_image_url = '/uploads/1754454150690-j5ycd2.png' 
WHERE title = '30 Days to Dismantle Evil Altars: Your Step-By-Step Guide To Tear Down Spiritual Structures Fighting Your Life';

UPDATE books SET cover_image_url = '/uploads/1754454759109-pm9ru.png' 
WHERE title = 'How to Build a Powerful Home Altar That Speaks, Protects & Releases Heaven''s Power in Your Daily Life';

UPDATE books SET cover_image_url = '/uploads/1754454964404-hyn8.png' 
WHERE title = 'Planted to Flourish: The Power of Being Rooted in God''s House';

-- Also update any other books with broken JPG references to working PNG files
UPDATE books SET cover_image_url = '/uploads/1754454058788-3eba19.png'
WHERE title = '30 Days to Break the Curse of "Almost There": Your Step-By-Step Guide To Stop Near-Success Syndrome and Cross Your Finish Line';

-- Clear any JPG references that are definitely broken
UPDATE books SET cover_image_url = REPLACE(cover_image_url, '1755039541678-xwxwbp.jpg', '1754453446477-kgg86a.png')
WHERE cover_image_url LIKE '%1755039541678-xwxwbp.jpg%';

UPDATE books SET cover_image_url = REPLACE(cover_image_url, '1755039476096-tplnzo.jpg', '1754453929800-msice.png')
WHERE cover_image_url LIKE '%1755039476096-tplnzo.jpg%';

UPDATE books SET cover_image_url = REPLACE(cover_image_url, '1755039391407-ndu4f.jpg', '1754454150690-j5ycd2.png')
WHERE cover_image_url LIKE '%1755039391407-ndu4f.jpg%';

UPDATE books SET cover_image_url = REPLACE(cover_image_url, '1755039335174-9ej5j.jpg', '1754454759109-pm9ru.png')
WHERE cover_image_url LIKE '%1755039335174-9ej5j.jpg%';

UPDATE books SET cover_image_url = REPLACE(cover_image_url, '1755039271576-8luag.jpg', '1754454964404-hyn8.png')
WHERE cover_image_url LIKE '%1755039271576-8luag.jpg%';