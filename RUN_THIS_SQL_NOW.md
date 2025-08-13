# URGENT: Fix Production PDFs

The SQL didn't work because it needs to be run on the PRODUCTION database, not development.

## Option 1: Using psql with Production URL

If you have the production database URL as an environment variable:
```bash
psql "$PRODUCTION_DATABASE_URL" < FIX_PRODUCTION_NOW.sql
```

## Option 2: Direct Database Access

1. **Find your production database URL:**
   - Check Replit Secrets for `PRODUCTION_DATABASE_URL`
   - Or check your deployment settings

2. **Connect directly:**
```bash
psql "postgres://[YOUR_PRODUCTION_URL]" < FIX_PRODUCTION_NOW.sql
```

## Option 3: Through Replit Database Pane

1. Click **Database** icon in Replit
2. Make sure it says **"Production"** not "Development"
3. Click **Query** or **SQL** tab
4. Copy ALL content from `FIX_PRODUCTION_NOW.sql`
5. Paste and click **Execute**

## Option 4: Manual Fix via Admin Panel

Go to https://mywonderfulbooks.com/admin and manually edit each book to update the PDF URL.

## The Problem

The production database still has books pointing to PDFs that don't exist (175504xxx series).
The SQL needs to run on the PRODUCTION database where your live website reads from.

## Verification

After running the SQL, check:
```bash
curl -s "https://mywonderfulbooks.com/api/books" | grep -c "175504"
```

Should return 0 if all books are fixed.