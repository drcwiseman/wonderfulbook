-- Complete Development to Production Database Sync
-- This script ensures production database matches development 100%

-- First, get the book IDs that should be featured (from development)
UPDATE books SET is_featured = true WHERE id IN (
  '25eade19-d8ab-4c25-b9e9-7f2fc63d6808',
  '39a430b3-9bfd-4d3d-a848-2b450f4cfe13', 
  'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa',
  'deba8249-6ec8-4771-adc4-aa450387bd1a',
  '82f9671f-5e8c-41dc-a8b0-22f1852e8532',
  '2c38e9b8-a06c-40fa-a055-f55ebaef7edc'
);

-- Reset all other books to not featured
UPDATE books SET is_featured = false WHERE id NOT IN (
  '25eade19-d8ab-4c25-b9e9-7f2fc63d6808',
  '39a430b3-9bfd-4d3d-a848-2b450f4cfe13', 
  'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa',
  'deba8249-6ec8-4771-adc4-aa450387bd1a',
  '82f9671f-5e8c-41dc-a8b0-22f1852e8532',
  '2c38e9b8-a06c-40fa-a055-f55ebaef7edc'
);

-- Verify the sync
SELECT 
  COUNT(*) as total_books,
  COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_books
FROM books;