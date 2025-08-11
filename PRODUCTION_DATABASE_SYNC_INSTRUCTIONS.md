# Production Database Sync Instructions

## Goal
Make production database match development database 100%

## Current State
- **Development**: 6 featured books, full data set
- **Production**: 0 featured books, same books but different featured status

## Step-by-Step Sync Process

### Option 1: Using Replit Database Panel (Recommended)
1. Open your Replit deployment
2. Go to the Database tab
3. Run this SQL query:

```sql
UPDATE books SET is_featured = true WHERE id IN (
  '25eade19-d8ab-4c25-b9e9-7f2fc63d6808',
  '39a430b3-9bfd-4d3d-a848-2b450f4cfe13', 
  'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa',
  'deba8249-6ec8-4771-adc4-aa450387bd1a',
  '82f9671f-5e8c-41dc-a8b0-22f1852e8532',
  '2c38e9b8-a06c-40fa-a055-f55ebaef7edc'
);
```

4. Verify with: `SELECT COUNT(*) FROM books WHERE is_featured = true;` 
   (Should return 6)

### Option 2: Using SQL File
Run the complete sync script at `scripts/sync-dev-to-production.sql`

## Expected Results After Sync
- Production will have 6 featured books
- "Featured This Week" section will show the same content on both environments
- Both environments will be 100% synchronized

## Verification Commands
After running the sync, test these URLs:

**Development Featured Books:**
```bash
curl "http://localhost:5000/api/books?featured=true" | jq '. | length'
```

**Production Featured Books:**
```bash
curl "https://wonderful-books-drcwiseman.replit.app/api/books?featured=true" | jq '. | length'
```

Both should return `6`.

## Files Created
- `scripts/sync-dev-to-production.sql` - Complete sync script
- This instruction file for reference

## Next Steps
Once you run the SQL on production:
1. Both environments will show identical "Featured This Week" sections
2. Production and development databases will be 100% synchronized
3. The empty featured section issue will be completely resolved