# 📧 Production SMTP Configuration Guide

## Issue: SMTP Configuration Mismatch
The production deployment needs the updated SMTP configuration from development to ensure email functionality works correctly.

## Current Development SMTP Setup

### Working Configuration (Development)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587  
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<secret-stored-in-replit>
```

### Code Update Applied
**File: `server/emailService.ts`**
```typescript
pass: (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').trim(),
```
Now correctly reads from `SMTP_PASSWORD` secret as stored in Replit.

## Production Deployment Requirements

### Required Environment Variables for Production
1. **SMTP_HOST** - Gmail SMTP server (smtp.gmail.com)
2. **SMTP_PORT** - Port 587 for STARTTLS
3. **SMTP_USER** - Gmail email address 
4. **SMTP_PASSWORD** - Gmail app password (stored as secret)

### Email Features Enabled
- ✅ Welcome emails for new users
- ✅ Password reset emails  
- ✅ Trial reminder campaigns (3-day and 1-day)
- ✅ Subscription confirmation emails
- ✅ Admin notification emails

## Verification Steps

### 1. Development Health Check
```bash
# SMTP connection verification in development
✅ SMTP connection verified successfully
✅ Email service initialized with SMTP configuration
```

### 2. Production Deployment
When you deploy, ensure the SMTP_PASSWORD secret is available in production environment.

### 3. Test Email Functionality
After deployment, test:
- User registration (welcome email)
- Password reset flow
- Trial reminder system

## Email Templates Available
- Welcome email for new users
- Password reset instructions
- Trial reminder (3 days left)
- Trial reminder (1 day left)  
- Subscription confirmation
- Cancellation notifications

## SMTP Health Monitoring
The system includes automated SMTP health checks every 5 minutes:
```bash
"smtp": {"status": "OK", "duration": 444ms}
```

Your email system will be fully operational in production once the SMTP configuration is properly deployed.