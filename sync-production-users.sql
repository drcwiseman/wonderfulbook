-- Complete User Data Sync from Development to Production
-- This script syncs all verified users from development to production

-- ==================================================
-- STEP 1: SYNC VERIFIED USERS FROM DEVELOPMENT
-- ==================================================

-- User 1: Climate Wiseman (Super Admin)
INSERT INTO users (id, email, password_hash, email_verified, first_name, last_name, subscription_status, subscription_tier, created_at, updated_at, auth_provider, registration_ip, device_fingerprint, stripe_customer_id, stripe_subscription_id, free_trial_used, free_trial_started_at, free_trial_ended_at, role, is_active, last_login_at, books_read_this_month) VALUES ('manual_1754457852879_osie0x', 'prophetclimate@yahoo.com', '$2b$12$ezeTWYV/OiwaGPXvzUdM4.m3CC7KAsdctUsm/p9.30r..Uh4jnnWm', true, 'Climate', 'Wiseman', 'active', 'premium', '2025-08-06 05:24:12.879', '2025-08-10 22:17:28.8', 'local', NULL, NULL, 'cus_SpnEjlCVvi0Fg7', 'sub_1RuhYRAogy3qVYfGZsBqzkB8', false, NULL, NULL, 'super_admin', true, '2025-08-10 22:08:40.215', 0) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, email_verified = EXCLUDED.email_verified, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, subscription_status = EXCLUDED.subscription_status, subscription_tier = EXCLUDED.subscription_tier, updated_at = EXCLUDED.updated_at;

-- User 2: John Doe (Regular User)
INSERT INTO users (id, email, password_hash, email_verified, first_name, last_name, subscription_status, subscription_tier, created_at, updated_at, auth_provider, registration_ip, device_fingerprint, stripe_customer_id, stripe_subscription_id, free_trial_used, free_trial_started_at, free_trial_ended_at, role, is_active, last_login_at, books_read_this_month) VALUES ('di2O3E6bDYAH', 'john.doe@example.com', '$2b$12$GeYxS7V5BFWidpu0wtnwCu1oRVZgWxiyU7lND5VxefKofInLRPymi', true, 'John', 'Doe', 'inactive', 'free', '2025-08-06 08:26:24.021979', '2025-08-06 08:26:41.61', 'local', NULL, NULL, NULL, NULL, false, NULL, NULL, 'user', true, '2025-08-06 08:32:42.22', 0) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, email_verified = EXCLUDED.email_verified, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, subscription_status = EXCLUDED.subscription_status, subscription_tier = EXCLUDED.subscription_tier, updated_at = EXCLUDED.updated_at;

-- User 3: Admin User (Super Admin)
INSERT INTO users (id, email, password_hash, email_verified, first_name, last_name, subscription_status, subscription_tier, created_at, updated_at, auth_provider, registration_ip, device_fingerprint, stripe_customer_id, stripe_subscription_id, free_trial_used, free_trial_started_at, free_trial_ended_at, role, is_active, last_login_at, books_read_this_month) VALUES ('admin-test-email-system', 'admin@wonderfulbooks.com', '$2b$12$ezeTWYV/OiwaGPXvzUdM4.m3CC7KAsdctUsm/p9.30r..Uh4jnnWm', true, 'Admin', 'User', 'inactive', 'free', '2025-08-06 22:53:41.404366', '2025-08-08 03:02:14.468', 'local', NULL, NULL, NULL, NULL, false, NULL, NULL, 'super_admin', true, '2025-08-08 03:02:13.545', 0) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, email_verified = EXCLUDED.email_verified, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, subscription_status = EXCLUDED.subscription_status, subscription_tier = EXCLUDED.subscription_tier, updated_at = EXCLUDED.updated_at;

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Check user sync results
SELECT 
  'Users Synced' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscribers
FROM users;

-- List all synced users
SELECT 
  id, email, first_name, last_name, role, subscription_status, subscription_tier, email_verified
FROM users 
WHERE email_verified = true
ORDER BY created_at;