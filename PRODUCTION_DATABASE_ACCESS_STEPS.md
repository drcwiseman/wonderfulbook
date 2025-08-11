# How to Update Production Database

## The Issue
The SQL you ran was executed against the **development database**, but we need to run it against the **production database**.

## Steps to Access Production Database

### Option 1: Replit Database Tab
1. Go to your Replit deployment: https://wonderful-books-drcwiseman.replit.app
2. Open the Replit interface for your deployment
3. Click on the "Database" tab in the left sidebar
4. This will connect you to the production database
5. Run the SQL command there:

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

### Option 2: Console Access
1. Open your deployment's console/shell
2. Connect to production database using the production DATABASE_URL
3. Run the SQL command

## Verification After Running
After running the SQL on production database:
- https://wonderful-books-drcwiseman.replit.app/api/books?featured=true should return 6 books
- The "Featured This Week" section will appear on production homepage

## Current Status
- Development: ✅ 6 featured books
- Production: ❌ Still 0 featured books (SQL needs to be run on production DB)

The databases are completely separate - development changes don't affect production automatically.