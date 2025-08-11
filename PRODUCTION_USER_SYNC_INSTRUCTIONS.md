# Production User Data Sync Instructions

## Goal
Sync all verified users from development database to production database for complete environment matching.

## Users to be Synced (3 verified users)

### 1. Climate Wiseman (Super Admin)
- **Email**: prophetclimate@yahoo.com  
- **Role**: super_admin
- **Subscription**: Premium (Active)
- **Stripe**: Connected with customer and subscription IDs

### 2. John Doe (Regular User)
- **Email**: john.doe@example.com
- **Role**: user  
- **Subscription**: Free (Inactive)
- **Status**: Verified, test user

### 3. Admin User (Super Admin)
- **Email**: admin@wonderfulbooks.com
- **Role**: super_admin
- **Subscription**: Free (Inactive)  
- **Status**: System admin account

## Step-by-Step Sync Process

### To Run User Sync on Production Database:

1. **Access Production Database**
   - Go to your Replit deployment
   - Click "Database" tab (connects to production database)

2. **Run User Sync SQL**
   Copy and paste the complete SQL from `sync-production-users.sql`

3. **Verify Sync Results**
   After running the sync, execute this verification query:
   ```sql
   SELECT 
     COUNT(*) as total_users,
     COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
     COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as admin_users
   FROM users;
   ```

   **Expected Results:**
   - Total users: Should increase by 3
   - Verified users: Should include the 3 development users
   - Admin users: Should include 2 super_admin accounts

## What This Sync Includes

### User Data Synced:
- ✅ User credentials (email/password hashes)
- ✅ Profile information (names, roles)
- ✅ Subscription status and tiers
- ✅ Email verification status
- ✅ Stripe customer/subscription IDs
- ✅ Login history and account activity

### Benefits After Sync:
- Same login credentials work on both environments
- Admin accounts accessible on production
- Subscription data matches between environments
- Testing workflows can use same accounts

## Security Note
All password hashes are securely bcrypt encrypted. The sync maintains the same security standards as the original development environment.

## Post-Sync Verification
After running the sync, both environments will have:
- Identical verified user accounts
- Same admin access credentials  
- Matching subscription data
- Consistent user experience across environments