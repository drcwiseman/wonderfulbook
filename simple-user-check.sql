-- Simple production database user check
-- Run this on production database to see current users

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users
FROM users;

-- List emails to see if our users exist
SELECT email, email_verified, role FROM users ORDER BY created_at;