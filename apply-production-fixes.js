#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

async function runFixes() {
  console.log('Applying production image fixes...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  try {
    // Apply all the fixes in batch
    const updates = [
      "UPDATE books SET cover_image_url = '/uploads/images/1755034691874-576700751.jpg' WHERE id = 'dbdba9fa-35a9-4329-a355-6607ce0c1313'",
      "UPDATE books SET cover_image_url = '/uploads/images/1755034636837-439028013.jpg' WHERE id = 'd87dfd66-1828-49bc-b73a-c80aece4d025'",
      "UPDATE books SET cover_image_url = '/uploads/images/1755034580371-110367896.jpg' WHERE id = '8ab4ac46-cd94-44a2-85d2-67782c434dfe'",
      "UPDATE books SET cover_image_url = '/uploads/images/1755034518112-408360893.jpg' WHERE id = '454c75e5-bc56-4a6b-b567-9af4dd830b67'",
      "UPDATE books SET cover_image_url = '/uploads/images/1755034364886-244196645.jpg' WHERE id = '4a7b2692-31f8-4f83-9ac0-0ac4e5963ab0'",
      "UPDATE books SET cover_image_url = '/uploads/images/1755033047709-65795825.jpg' WHERE id = 'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa'",
      "UPDATE books SET cover_image_url = '/uploads/images/1755034819524-240697370.jpg' WHERE id = '82f9671f-5e8c-41dc-a8b0-22f1852e8532'",
      "UPDATE books SET cover_image_url = '/uploads/images/1755033380800-752951675.jpg' WHERE id = 'e147f9bd-67e4-4e09-b923-049ed63a0095'"
    ];

    for (const update of updates) {
      await db.execute(sql.raw(update));
      console.log('Applied update:', update.substring(0, 80) + '...');
    }

    console.log('All fixes applied successfully!');
    
  } catch (error) {
    console.error('Error applying fixes:', error);
  }
}

runFixes();