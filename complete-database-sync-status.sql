-- Complete Database Sync Status Report
-- Run this on PRODUCTION database to complete the sync

-- Step 1: Check current production users
SELECT 'Current Production Users' as status;
SELECT email, role, subscription_status FROM users ORDER BY created_at;

-- Step 2: Add the main admin user (Climate Wiseman)
INSERT INTO users (
  id, email, password_hash, email_verified, first_name, last_name, 
  subscription_status, subscription_tier, created_at, updated_at, 
  auth_provider, role, is_active, last_login_at, books_read_this_month
) VALUES (
  'manual_1754457852879_osie0x', 
  'prophetclimate@yahoo.com', 
  '$2b$12$ezeTWYV/OiwaGPXvzUdM4.m3CC7KAsdctUsm/p9.30r..Uh4jnnWm', 
  true, 'Climate', 'Wiseman', 'active', 'premium', 
  '2025-08-06 05:24:12.879', '2025-08-10 22:17:28.8', 
  'local', 'super_admin', true, '2025-08-10 22:08:40.215', 0
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  subscription_status = EXCLUDED.subscription_status,
  role = EXCLUDED.role;

-- Step 3: Add John Doe test user
INSERT INTO users (
  id, email, password_hash, email_verified, first_name, last_name, 
  subscription_status, subscription_tier, created_at, updated_at, 
  auth_provider, role, is_active, last_login_at, books_read_this_month
) VALUES (
  'di2O3E6bDYAH', 
  'john.doe@example.com', 
  '$2b$12$GeYxS7V5BFWidpu0wtnwCu1oRVZgWxiyU7lND5VxefKofInLRPymi', 
  true, 'John', 'Doe', 'inactive', 'free', 
  '2025-08-06 08:26:24.021979', '2025-08-06 08:26:41.61', 
  'local', 'user', true, '2025-08-06 08:32:42.22', 0
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Step 4: Add admin system user
INSERT INTO users (
  id, email, password_hash, email_verified, first_name, last_name, 
  subscription_status, subscription_tier, created_at, updated_at, 
  auth_provider, role, is_active, last_login_at, books_read_this_month
) VALUES (
  'admin-test-email-system', 
  'admin@wonderfulbooks.com', 
  '$2b$12$ezeTWYV/OiwaGPXvzUdM4.m3CC7KAsdctUsm/p9.30r..Uh4jnnWm', 
  true, 'Admin', 'User', 'inactive', 'free', 
  '2025-08-06 22:53:41.404366', '2025-08-08 03:02:14.468', 
  'local', 'super_admin', true, '2025-08-08 03:02:13.545', 0
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Step 5: Verify sync completed
SELECT 'Sync Results' as status;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as admin_users
FROM users;

-- Step 6: List all users to confirm
SELECT 'Final User List' as status;
SELECT email, first_name, last_name, role, subscription_status, email_verified 
FROM users 
ORDER BY created_at;