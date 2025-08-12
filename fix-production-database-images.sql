-- CRITICAL FIX: Update database to match production image URLs
-- The production API returns JPG files but database has PNG references

-- First, let's see what we're working with
SELECT 'Current database state:' as info;
SELECT id, title, cover_image_url FROM books LIMIT 10;

-- Update the book cover URLs to match the production files that exist
-- These JPG files are confirmed to exist and return HTTP 200 in production

UPDATE books 
SET cover_image_url = '/uploads/1755039541678-xwxwbp.jpg'
WHERE title = 'Covenant Wealth: Unlocking God''s Divine Economy through Tithes, Offerings & First Fruits';

UPDATE books 
SET cover_image_url = '/uploads/1755039476096-tplnzo.jpg'
WHERE title = 'Multiply the Vision: A Practical Guide to Equipping Leaders Who Make Disciples';

UPDATE books 
SET cover_image_url = '/uploads/1755039391407-ndu4f.jpg'
WHERE title = '30 Days to Dismantle Evil Altars: Your Step-By-Step Guide To Tear Down Spiritual Structures Fighting Your Life';

UPDATE books 
SET cover_image_url = '/uploads/1755039335174-9ej5j.jpg'
WHERE title = 'How to Build a Powerful Home Altar That Speaks, Protects & Releases Heaven''s Power in Your Daily Life';

UPDATE books 
SET cover_image_url = '/uploads/1755039271576-8luag.jpg'
WHERE title = 'Planted to Flourish: The Power of Being Rooted in God''s House';

-- Verify the updates
SELECT 'Updated database state:' as info;
SELECT id, title, cover_image_url FROM books LIMIT 10;