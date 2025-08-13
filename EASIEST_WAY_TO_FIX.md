# THE EASIEST WAY TO FIX YOUR PDF PROBLEM

## Option 1: Quick Copy & Paste (2 minutes)

### Step 1: Open Replit Shell
Click on "Shell" at the bottom of your Replit workspace

### Step 2: Copy this ENTIRE command:
```bash
psql "$DATABASE_URL" << 'EOF'
UPDATE books SET pdf_url = '/uploads/pdfs/1754453468245-7a2lh9.pdf' WHERE title LIKE '%Toxic Thinking%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754453915874-oqutoa.pdf' WHERE title LIKE '%Self-Doubt%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454019850-f4821w.pdf' WHERE title LIKE '%Insecurity%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454138199-mlvw7.pdf' WHERE title LIKE '%Loneliness%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454747556-ejj37p.pdf' WHERE title LIKE '%Toxic Relationships%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754454880444-jt4n8q.pdf' WHERE title LIKE '%Spirit Of Shame%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754455632785-zprlp.pdf' WHERE title LIKE '%Frustration%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754455757797-ta3v7.pdf' WHERE title LIKE '%Procrastination%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754455921052-vkihvn.pdf' WHERE title LIKE '%Bitterness%' AND pdf_url LIKE '%175504%';
UPDATE books SET pdf_url = '/uploads/pdfs/1754456147817-aptmog.pdf' WHERE title LIKE '%Prayerlessness%' AND pdf_url LIKE '%175504%';
EOF
```

### Step 3: Paste and Press Enter
Paste it in the Shell and press Enter. Done!

## Option 2: Through Admin Panel (5 minutes)

1. Go to https://mywonderfulbooks.com/admin
2. Login with your admin credentials
3. Find any book with "30 Days to Overcome" in the title
4. Click Edit
5. Change the PDF URL field to match this list:
   - Toxic Thinking → `/uploads/pdfs/1754453468245-7a2lh9.pdf`
   - Self-Doubt → `/uploads/pdfs/1754453915874-oqutoa.pdf`
   - (etc. - see full list in CRITICAL_PDF_FIX.sql)
6. Save each book

## Why This Will Work:
The problem is that your production database points to PDF files that don't exist. This command updates the database to point to the CORRECT PDF files that DO exist.

## After Running:
1. Go to https://mywonderfulbooks.com
2. Open any "30 Days to Overcome" book
3. The PDF will now load with the correct content!

## IMPORTANT:
This needs to be done NOW to fix your live website. Users cannot read books until this is fixed.