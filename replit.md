# Digital Book Streaming Platform

## Project Overview
A comprehensive digital book streaming platform with advanced administrative tools for email system configuration and management. The platform features React with TypeScript frontend, Express.js backend with robust email systems, and comprehensive admin panels.

## Core Technologies
- Frontend: React with TypeScript, Vite, TailwindCSS, shadcn/ui
- Backend: Express.js with TypeScript, Drizzle ORM
- Database: PostgreSQL  
- Email: Nodemailer with SMTP configuration
- Payments: Stripe integration
- Authentication: Express sessions with Passport.js
- File Storage: Object storage with local fallback

## Recent Changes

### Cloud Run Deployment Optimizations (Aug 11, 2025)
Applied comprehensive fixes for Cloud Run deployment failures with advanced startup optimization:

**🚀 Server Startup Sequence (Cloud Run Optimized):**
- Ultra-lightweight health endpoints respond instantly (`/health`, `/ping`, `/healthz`)
- Server starts listening FIRST before ANY heavy initialization
- Background services deferred via `setImmediate()` to prevent blocking deployment
- Minimal production logging to avoid overwhelming Cloud Run initialization
- Graceful error handling for missing environment variables

**⚡ Background Service Initialization:**
- Parallel service initialization with `Promise.allSettled()` for faster startup
- SMTP connection verification skipped in production to prevent blocking
- Email scheduler only initializes if SMTP environment variables are present
- Health monitoring scheduler with production-optimized logging
- Crypto system initialization with enhanced error recovery

**🛡️ Stripe Payment Integration (Cloud Run Safe):**
- Graceful handling of missing Stripe configuration during deployment
- Null checks added to all Stripe API calls to prevent startup failures
- Payment routes return appropriate 503 errors when Stripe not configured
- Webhook endpoints include Stripe availability validation

**🔧 Environment & Dependencies:**
- Simplified required environment variables (only DATABASE_URL mandatory)
- STRIPE_SECRET_KEY validation with fallback handling
- Production vs development mode optimization throughout codebase
- Enhanced error handling for external service dependencies

**📊 Health Monitoring (Production Ready):**
- Immediate health check responses without database dependencies
- Production logging reduced to essential error reporting only
- Health scheduler with timeout protection and error recovery
- Cloud Run compatible health probe endpoints

### Architecture
```
/
├── client/          # React frontend with TypeScript
├── server/          # Express.js backend
│   ├── routes.ts    # Main API routes
│   ├── health/      # Health monitoring system
│   ├── middleware/  # Authentication & security
│   └── storage.ts   # Database abstraction layer
├── shared/          # Shared schemas and types
└── views/           # EJS templates for admin dashboard
```

### Key Features
- Multi-tier subscription system (Free, Basic, Premium)
- Advanced email campaign management
- PDF book streaming and reading
- User analytics and admin dashboard
- Object storage for file management
- Comprehensive security and anti-abuse systems
- Health monitoring and scheduled tasks

### User Preferences
- Follow modern full-stack JavaScript patterns
- Prioritize frontend functionality with minimal backend
- Use TypeScript for type safety
- Maintain clean, production-ready code

### Deployment Status - CRITICAL FIX REQUIRED (Aug 11, 2025)
**⚠️ DEPLOYMENT BROKEN - REDEPLOYMENT NEEDED**

The current deployment at https://workspace.drcwiseman.replit.app is serving an **OLD VERSION** and completely broken (returns "Not Found" for all routes including API endpoints).

**✅ Cloud Run Compatibility Fixes Applied:**
- Environment detection fixed: Changed from `app.get("env")` to `process.env.NODE_ENV`
- Static file serving configuration corrected
- Production build process verified working
- Server startup sequence optimized for Cloud Run
- Background service initialization properly deferred

**✅ Password Reset Fix Applied:**
- Frontend routing properly configured for `/auth/reset-password` routes
- Static file serving will correctly handle client-side routing
- Production index.html properly generated without development scripts

**🚨 Critical Issue:**
- Deployed version is NOT serving the fixed codebase
- API routes return 404 (even `/api/health/ping`)
- Frontend routes return "Not Found" 
- Email verification and password reset completely non-functional

**🎯 IMMEDIATE ACTION REQUIRED:**
- **MUST REDEPLOY** using Replit's deployment system
- Current fixes are NOT live on the deployed application
- Local testing confirms all fixes work correctly
- Password reset functionality will work after redeployment

**Status:** Ready for redeployment with all fixes applied locally