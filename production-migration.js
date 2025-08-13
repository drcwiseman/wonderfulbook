#!/usr/bin/env node

// Production database migration script
// This applies the image path fixes directly to the production database

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function applyProductionFixes() {
  console.log('🔄 Connecting to production database...');
  
  // Use the same database URL as the production app
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    console.log('🔧 Applying image path fixes...');
    
    // Read and execute the SQL fixes
    const sqlScript = fs.readFileSync('./fix-production-images.sql', 'utf8');
    const statements = sqlScript.split(';').filter(stmt => stmt.trim());
    
    let updateCount = 0;
    for (const statement of statements) {
      if (statement.trim().startsWith('UPDATE')) {
        await db.execute(sql.raw(statement + ';'));
        updateCount++;
        console.log(`✅ Applied update ${updateCount}`);
      }
    }
    
    console.log(`✅ Applied ${updateCount} image path fixes to production database`);
    
    // Verify the fixes
    const result = await db.execute(sql`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN cover_image_url LIKE '/uploads/images/%' THEN 1 END) as fixed_paths 
      FROM books
    `);
    
    console.log('📊 Verification:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔚 Database connection closed');
  }
}

applyProductionFixes().catch(console.error);