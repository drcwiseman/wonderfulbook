# Replit Secrets Setup Guide

## Quick Setup Instructions

### Step 1: Access Replit Secrets
1. In your Replit workspace, look for **"Secrets"** in the left sidebar tools
2. If you don't see it, search for **"Secrets"** in the search bar
3. Click on **"Secrets"** to open the secrets panel

### Step 2: Add Required Secrets
Click **"New Secret"** for each of these:

## 🔑 REQUIRED SECRETS

### 1. DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Your PostgreSQL connection string
- **Format**: `postgresql://username:password@hostname:port/database_name`
- **Example**: `postgresql://user:pass@db.example.com:5432/wonderfulbooks`

### 2. NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Purpose**: Enables production security headers and optimizations

### 3. SESSION_SECRET
- **Key**: `SESSION_SECRET`
- **Value**: A strong 32+ character random string
- **Example**: `your-super-secure-32-character-secret-key-here-123456`
- **Generate one**: Use a password generator or random string generator

### 4. STRIPE_SECRET_KEY
- **Key**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe secret key (starts with `sk_`)
- **Example**: `sk_test_...` or `sk_live_...`
- **Where to find**: Stripe Dashboard → API Keys → Secret Key

### 5. VITE_STRIPE_PUBLIC_KEY
- **Key**: `VITE_STRIPE_PUBLIC_KEY`
- **Value**: Your Stripe public key (starts with `pk_`)
- **Example**: `pk_test_...` or `pk_live_...`
- **Where to find**: Stripe Dashboard → API Keys → Publishable Key

## 📧 OPTIONAL SECRETS (for email functionality)

### 6. SMTP_HOST
- **Key**: `SMTP_HOST`
- **Value**: Your email server hostname
- **Examples**: 
  - Gmail: `smtp.gmail.com`
  - Outlook: `smtp-mail.outlook.com`
  - Custom: `mail.yourdomain.com`

### 7. SMTP_USER
- **Key**: `SMTP_USER`
- **Value**: Your email address
- **Example**: `your-email@gmail.com`

### 8. SMTP_PASS
- **Key**: `SMTP_PASS`
- **Value**: Your email password or app password
- **Note**: For Gmail, use an App Password, not your regular password

## Step 3: Deployment Process

### After Adding Secrets:
1. **Save all secrets** in the Replit Secrets panel
2. **Redeploy your application**:
   - Go to your deployment dashboard
   - Click "Deploy" to trigger a new deployment
   - Wait for deployment to complete

3. **Verify the deployment**:
   ```bash
   DEPLOYMENT_URL='https://wonderful23-books-drcwiseman.replit.app' ./scripts/deployment-verification.sh
   ```

## Expected Results After Setup

### What Should Work:
- ✅ Health endpoint: `{"status":"ok"}`
- ✅ API endpoints: `/api/books` returns 200 (not 500)
- ✅ Security headers present
- ✅ Database connectivity working
- ✅ Payment processing functional
- ✅ Email system operational

### Verification Commands:
```bash
# Test health
curl https://wonderful23-books-drcwiseman.replit.app/healthz

# Test API
curl https://wonderful23-books-drcwiseman.replit.app/api/books

# Check security headers
curl -I https://wonderful23-books-drcwiseman.replit.app/
```

## Troubleshooting

### Common Issues:

**Secret Not Applied:**
- Redeploy after adding secrets
- Check secret key names are exact (case-sensitive)
- Verify secret values don't have extra spaces

**Database Connection Fails:**
- Verify DATABASE_URL format is correct
- Check database server allows external connections
- Test connection from command line: `psql $DATABASE_URL -c "SELECT 1;"`

**Stripe Integration Issues:**
- Ensure keys start with correct prefix (sk_ for secret, pk_ for public)
- Verify keys are from same Stripe account
- Check Stripe dashboard for API key status

**Email System Not Working:**
- For Gmail, use App Passwords, not regular password
- Check SMTP settings for your email provider
- Verify firewall/security settings allow SMTP

## Security Best Practices

### ✅ Do:
- Store all sensitive data in Replit Secrets
- Use strong, unique SESSION_SECRET
- Use environment-appropriate Stripe keys (test vs live)
- Regularly rotate secrets

### ❌ Don't:
- Put real secrets in .env files
- Commit secrets to version control
- Share secrets in chat or documentation
- Use weak or common session secrets

## Current Status Check

After setting up secrets, your deployment should show:
- **Health Status**: OK
- **API Endpoints**: All responding correctly
- **Security**: Headers present
- **Functionality**: 100% operational

**Deployment URL**: https://wonderful23-books-drcwiseman.replit.app

Once you've added the secrets and redeployed, your Wonderful Books platform will be fully functional and production-ready!