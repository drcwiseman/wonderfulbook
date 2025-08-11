# 🚀 Production Database Migration Guide

## Overview
Your Wonderful Books platform is production-ready with all authentication fixes implemented. This guide covers migrating your development data to production.

## Current Development Data

### Books Dataset (10 Books)
- All by Dr C Wiseman
- Complete metadata including PDFs, descriptions, ratings
- Free tier access configured
- Genres: Self-Help, Personal Development

### Admin User
- Email: prophetclimate@yahoo.com
- Role: super_admin
- Emergency access configured

## Migration Options

### Option 1: Reserved VM Shell Access (Recommended)
```bash
# Access production database through Reserved VM
# Connect to production PostgreSQL
psql $DATABASE_URL

# Run migration scripts
\i development_database_backup.sql
```

### Option 2: Export/Import Approach
```bash
# Export development data
pg_dump $DATABASE_URL > production_migration.sql

# Import to production (run in production environment)
psql $PRODUCTION_DATABASE_URL < production_migration.sql
```

### Option 3: Drizzle Schema Push
```bash
# Push schema changes to production
npm run db:push

# Then import data manually or via admin panel
```

## Migration Steps

### 1. Backup Current Production
```sql
-- Create backup before migration
pg_dump $PRODUCTION_DATABASE_URL > production_backup_$(date +%Y%m%d).sql
```

### 2. Schema Migration
```bash
# Ensure production schema matches development
npm run db:push
```

### 3. Data Migration
Your development database contains:
- 10 curated books with complete metadata
- 1 super admin user with proper authentication
- All necessary configuration data

### 4. Post-Migration Verification
```bash
# Verify book count
psql $PRODUCTION_DATABASE_URL -c "SELECT COUNT(*) FROM books;"

# Verify admin user
psql $PRODUCTION_DATABASE_URL -c "SELECT email, role FROM users WHERE role = 'super_admin';"

# Test emergency access
curl -X POST "https://your-app.replit.app/api/auth/admin-emergency" \
  -H "Content-Type: application/json" \
  -d '{"email": "prophetclimate@yahoo.com", "password": "testpass123"}'
```

## Production Deployment Checklist

### Before Migration
- [ ] Backup existing production database
- [ ] Verify all secrets are configured in production
- [ ] Test emergency access endpoint in development

### During Migration
- [ ] Push schema changes with `npm run db:push`
- [ ] Import book data and user accounts
- [ ] Verify data integrity

### After Migration
- [ ] Test admin login in production
- [ ] Verify book API endpoints
- [ ] Check emergency access portal
- [ ] Restart application if needed

## Environment Variables Required

### Production Secrets
- `DATABASE_URL` - Production PostgreSQL connection
- `SESSION_SECRET` - Secure session signing key
- `STRIPE_SECRET_KEY` - Payment processing
- `SMTP_PASSWORD` - Email functionality

## Session Configuration for Production

Your admin authentication fixes ensure:
```javascript
cookie: {
  httpOnly: true,
  secure: true, // HTTPS in production
  sameSite: 'none', // Cross-origin support
  domain: '.replit.app', // Replit domain scoping
  maxAge: 604800000 // 1 week
}
```

## Emergency Access in Production

After migration, admin access will be available via:
1. **Regular login**: `POST /api/auth/login`
2. **Emergency portal**: `https://your-app.replit.app/admin-emergency.html`
3. **Emergency API**: `POST /api/auth/admin-emergency`

## Troubleshooting

### If Admin Login Fails in Production
1. Check browser cookies are enabled for cross-origin
2. Verify emergency access portal works
3. Check production logs for session creation
4. Ensure database connection is stable

### If Book Data Missing
1. Verify migration completed successfully
2. Check API endpoint returns data
3. Confirm database tables populated
4. Test with development backup

## Success Verification

Production deployment successful when:
- [ ] Admin can login via regular interface
- [ ] Emergency access portal functional
- [ ] Book API returns 10 books
- [ ] Health endpoint reports "ok"
- [ ] PDF streaming works for authenticated users

Your platform is ready for production deployment with all authentication issues resolved.