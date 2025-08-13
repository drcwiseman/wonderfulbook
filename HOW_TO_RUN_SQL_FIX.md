# How to Run the SQL Commands to Fix PDF Mismatches

## Step-by-Step Instructions

### Method 1: Using Replit Database Pane (EASIEST)

1. **Open the Database Pane in Replit:**
   - In your Replit workspace, look for the "Database" icon in the left sidebar
   - Click on it to open the database pane

2. **Connect to Production Database:**
   - Make sure you're connected to the PRODUCTION database (not development)
   - You should see your production tables listed

3. **Open SQL Query Tab:**
   - Look for a "Query" or "SQL" tab in the database pane
   - Click on it to open the SQL query editor

4. **Copy the SQL Commands:**
   - Open the file `CRITICAL_PDF_FIX.sql` in your workspace
   - Copy ALL the UPDATE statements from that file

5. **Paste and Run:**
   - Paste all the SQL commands into the query editor
   - Click "Run" or "Execute" button
   - You should see messages showing how many rows were updated

### Method 2: Using Command Line (Alternative)

If you have direct access to the production database URL:

```bash
# Connect to production database and run the SQL file
psql "$PRODUCTION_DATABASE_URL" < CRITICAL_PDF_FIX.sql
```

### Method 3: Run Each Command Individually

If you prefer to run commands one by one:

1. Open the database query editor
2. Copy and run each UPDATE statement individually
3. Start with the first book (Toxic Thinking) and verify it works
4. Then continue with the rest

### What These Commands Do

Each UPDATE command fixes one book by changing its PDF URL from a non-existent file to the correct existing PDF:

```sql
-- Example: This changes Toxic Thinking book from wrong PDF to correct one
UPDATE books SET pdf_url = '/uploads/pdfs/1754453468245-7a2lh9.pdf' 
WHERE title LIKE '%Toxic Thinking%' AND pdf_url LIKE '%175504%';
```

### Verification After Running

After running the SQL commands:

1. Go to https://mywonderfulbooks.com
2. Try opening any of the "30 Days to Overcome" books
3. The PDFs should now load correctly with matching content

### Important Notes

- These commands only update books that have the wrong PDF URLs (175504xxx series)
- They won't affect any other books in your database
- The changes are immediate - no deployment needed
- Make sure to run ALL the UPDATE statements to fix all 30 books

### If You Need Help

If you're unsure about any step, you can:
1. Test with just one UPDATE command first
2. Check that book on the website to verify it works
3. Then run the rest of the commands

The key is to run these SQL commands directly on your PRODUCTION database, not the development one.