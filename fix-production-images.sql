-- Fix all book cover image URLs to point to existing files in production
-- These updates match the actual files that exist in /uploads/images/

UPDATE books SET cover_image_url = '/uploads/images/1755034691874-576700751.jpg' WHERE id = 'dbdba9fa-35a9-4329-a355-6607ce0c1313';
UPDATE books SET cover_image_url = '/uploads/images/1755034636837-439028013.jpg' WHERE id = 'd87dfd66-1828-49bc-b73a-c80aece4d025';
UPDATE books SET cover_image_url = '/uploads/images/1755034580371-110367896.jpg' WHERE id = '8ab4ac46-cd94-44a2-85d2-67782c434dfe';
UPDATE books SET cover_image_url = '/uploads/images/1755034518112-408360893.jpg' WHERE id = '454c75e5-bc56-4a6b-b567-9af4dd830b67';
UPDATE books SET cover_image_url = '/uploads/images/1755034364886-244196645.jpg' WHERE id = '4a7b2692-31f8-4f83-9ac0-0ac4e5963ab0';

UPDATE books SET cover_image_url = '/uploads/images/1755033981154-675109839.jpg' WHERE id = '0c0d186f-b07c-4a5d-8d09-0fa2ba230bd6';
UPDATE books SET cover_image_url = '/uploads/images/1755033929244-792624823.jpg' WHERE id = '5ec2c484-dc92-4f7d-8206-5a82d42d247a';
UPDATE books SET cover_image_url = '/uploads/images/1755033870887-264560748.jpg' WHERE id = '42128171-3216-41ec-9084-2cd5d2fdef39';
UPDATE books SET cover_image_url = '/uploads/images/1755033810800-38706578.jpg' WHERE id = 'a2e14b5b-e921-4f83-97fd-46b434c67ae6';
UPDATE books SET cover_image_url = '/uploads/images/1755033703119-667194453.jpg' WHERE id = '1472b341-3fd1-4fb9-ad0f-bd38c4d96bf6';

UPDATE books SET cover_image_url = '/uploads/images/1755033552381-355500067.jpg' WHERE id = 'fbed71e8-d3ad-487c-b0a0-4e1bf1d4c434';
UPDATE books SET cover_image_url = '/uploads/images/1755033480630-798505464.jpg' WHERE id = 'ddfc6862-f8ab-4b23-947d-c840283e2991';
UPDATE books SET cover_image_url = '/uploads/images/1755033295307-397933387.jpg' WHERE id = 'c1a1c068-b3fc-4c1e-8d8e-2443dfa5b55b';
UPDATE books SET cover_image_url = '/uploads/images/1755033222033-188669430.jpg' WHERE id = 'ca20bec2-5605-4e4b-9bb4-3345da363d21';
UPDATE books SET cover_image_url = '/uploads/images/1755033168865-526739050.jpg' WHERE id = 'd5e5e354-307c-4c71-ba3a-16b1f3f7d15a';

UPDATE books SET cover_image_url = '/uploads/images/1755033001313-808364215.jpg' WHERE id = '59b6ae43-37b7-4925-bc0b-7e308a51fc08';
UPDATE books SET cover_image_url = '/uploads/images/1755032907345-975055878.jpg' WHERE id = 'be7429de-fc02-41d8-a46c-fb1bb9d3a3a8';
UPDATE books SET cover_image_url = '/uploads/images/1755032850309-70718749.jpg' WHERE id = '7d11a6de-4298-4840-baf9-e7b83381d952';
UPDATE books SET cover_image_url = '/uploads/images/1755032785383-209531567.jpg' WHERE id = '0735ffa1-8b03-4510-8087-7dc97d27f30f';
UPDATE books SET cover_image_url = '/uploads/images/1755032714016-48741181.jpg' WHERE id = 'a6108be2-c609-48e3-9131-1d79a567b71d';

UPDATE books SET cover_image_url = '/uploads/images/1755032591870-311126596.jpg' WHERE id = '7ffc3bb1-0c77-4150-82d2-206f16e8632a';
UPDATE books SET cover_image_url = '/uploads/images/1755032410342-388611501.jpg' WHERE id = 'ebf6748d-9a59-46f0-a4b9-b9279520a2f9';
UPDATE books SET cover_image_url = '/uploads/images/1755031962335-268446774.jpg' WHERE id = '603b332b-967a-4df3-bfe4-0e4b2eb54b70';

-- Update remaining books with available images
UPDATE books SET cover_image_url = '/uploads/images/1755033047709-65795825.jpg' WHERE id = '25eade19-d8ab-4c25-b9e9-7f2fc63d6808';
UPDATE books SET cover_image_url = '/uploads/images/1755033380800-752951675.jpg' WHERE id = 'b482f62a-165e-4379-a3eb-099efd4949f6';
UPDATE books SET cover_image_url = '/uploads/images/1755033380800-752951675.jpg' WHERE id = 'e147f9bd-67e4-4e09-b923-049ed63a0095';
UPDATE books SET cover_image_url = '/uploads/images/1755033870887-264560748.jpg' WHERE id = 'b3ff71d5-5637-4f9c-9eac-520afa80786f';
UPDATE books SET cover_image_url = '/uploads/images/1755033047709-65795825.jpg' WHERE id = '2c38e9b8-a06c-40fa-a055-f55ebaef7edc';

UPDATE books SET cover_image_url = '/uploads/images/1755034819524-240697370.jpg' WHERE id = '82f9671f-5e8c-41dc-a8b0-22f1852e8532';
UPDATE books SET cover_image_url = '/uploads/images/1755034580371-110367896.jpg' WHERE id = 'deba8249-6ec8-4771-adc4-aa450387bd1a';
UPDATE books SET cover_image_url = '/uploads/images/1755034032399-900839625.jpg' WHERE id = 'ec226b44-4cd1-4e95-a21b-f3ae2f934cd3';
UPDATE books SET cover_image_url = '/uploads/images/1755033047709-65795825.jpg' WHERE id = 'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa';
UPDATE books SET cover_image_url = '/uploads/images/1755032907345-975055878.jpg' WHERE id = '39a430b3-9bfd-4d3d-a848-2b450f4cfe13';