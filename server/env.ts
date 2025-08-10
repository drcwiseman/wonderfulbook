import { cleanEnv, str, num, url, bool } from 'envalid';

export const env = cleanEnv(process.env, {
  // Database
  DATABASE_URL: str(),
  
  // Server
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: num({ default: 5000 }),
  
  // Stripe
  STRIPE_SECRET_KEY: str(),
  VITE_STRIPE_PUBLIC_KEY: str(),
  STRIPE_WEBHOOK_SECRET: str({ default: '' }),
  
  // Email
  SMTP_HOST: str({ default: '' }),
  SMTP_PORT: num({ default: 587 }),
  SMTP_USER: str({ default: '' }),
  SMTP_PASS: str({ default: '' }),
  
  // Testing (for preflight checks)
  PREVIEW_URL: url({ default: 'http://localhost:5000' }),
  TEST_EMAIL: str({ default: 'test@example.com' }),
  TEST_PASSWORD: str({ default: 'test123' }),
  
  // Lighthouse thresholds
  LH_MIN_PERF: num({ default: 90 }),
  LH_MIN_BP: num({ default: 90 }),
  LH_MIN_SEO: num({ default: 90 }),
  LH_MIN_PWA: num({ default: 100 }),
  
  // Reports auth
  REPORTS_USER: str({ default: 'checks' }),
  REPORTS_PASS: str({ default: 'change_me_strong' }),
  
  // Build metadata
  APP_VERSION: str({ default: '1.0.0' }),
  GIT_COMMIT: str({ default: 'unknown' }),
  
  // Optional
  REPL_ID: str({ default: '' }),
  REPL_SLUG: str({ default: '' })
});