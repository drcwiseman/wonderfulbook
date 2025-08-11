# SIMPLE PRODUCTION USER SYNC

## The Problem
Your production database has 0 development users.
Development and production need identical users.

## Exact Steps to Fix

### Step 1: Find Your Production Database
1. Open browser → https://replit.com
2. Find "wonderful-books" project
3. Click on the project
4. Look for **"Database"** tab in left sidebar

### Step 2: Run ONE Command
Copy this ENTIRE command and paste it in the database interface:

```sql
INSERT INTO users (id, email, password_hash, email_verified, first_name, last_name, subscription_status, subscription_tier, created_at, updated_at, auth_provider, role, is_active, last_login_at, books_read_this_month) VALUES ('manual_1754457852879_osie0x', 'prophetclimate@yahoo.com', '$2b$12$ezeTWYV/OiwaGPXvzUdM4.m3CC7KAsdctUsm/p9.30r..Uh4jnnWm', true, 'Climate', 'Wiseman', 'active', 'premium', '2025-08-06 05:24:12.879', '2025-08-10 22:17:28.8', 'local', 'super_admin', true, '2025-08-10 22:08:40.215', 0);
```

### Step 3: Verify It Worked
Run this check command:
```sql
SELECT COUNT(*) FROM users WHERE email = 'prophetclimate@yahoo.com';
```

**Should return: 1**

## When It's Working
- Login test will pass
- You'll be able to login to production with development credentials
- Both environments will have synchronized users

## Current Status
❌ Not completed - still getting "Invalid email or password"