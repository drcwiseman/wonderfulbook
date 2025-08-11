-- Sync Featured Books to Production Database
-- This script marks the same books as featured that are featured in development

UPDATE books SET is_featured = true WHERE id IN (
  '25eade19-d8ab-4c25-b9e9-7f2fc63d6808',  -- 30 Days To Develop A Spirit Of Excellence
  '39a430b3-9bfd-4d3d-a848-2b450f4cfe13',  -- Covenant Wealth
  'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa',  -- Multiply the Vision
  'deba8249-6ec8-4771-adc4-aa450387bd1a',  -- 30 Days to Dismantle Evil Altars
  '82f9671f-5e8c-41dc-a8b0-22f1852e8532',  -- How to Build a Powerful Home Altar
  '2c38e9b8-a06c-40fa-a055-f55ebaef7edc'   -- Planted to Flourish
);

-- Verify the update
SELECT id, title, is_featured FROM books WHERE is_featured = true;