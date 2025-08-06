-- Production Deployment Fix Script
-- This ensures the sessions table is properly configured for production

-- Create sessions table if it doesn't exist (connect-pg-simple requirement)
CREATE TABLE IF NOT EXISTS sessions (
  sid character varying NOT NULL,
  sess jsonb NOT NULL,
  expire timestamp without time zone NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (sid)
);

-- Create index for session expiration cleanup
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions USING btree (expire);

-- Ensure proper table ownership
ALTER TABLE sessions OWNER TO neondb_owner;

-- Clean up expired sessions
DELETE FROM sessions WHERE expire < NOW();

-- Production validation
SELECT 
  'Sessions table configured correctly' as status,
  COUNT(*) as active_sessions,
  MIN(expire) as earliest_expiry,
  MAX(expire) as latest_expiry
FROM sessions
WHERE expire > NOW();

-- Verify all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'users', 'books', 'categories', 'subscription_plans', 
      'user_selected_books', 'reading_progress', 'sessions',
      'free_trial_abuse_prevention', 'signup_attempts'
    ) THEN 'Required ✓'
    ELSE 'Optional'
  END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;