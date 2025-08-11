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

### Deployment Status - READY FOR REDEPLOYMENT (Aug 11, 2025)
**🚀 DEPLOYMENT PREPARATION COMPLETE**

The current deployment at https://workspace.drcwiseman.replit.app is serving an **OLD VERSION** and broken (returns "Not Found" for email routes).

**✅ All Fixes Applied and Verified:**
- Environment detection fixed: Changed from `app.get("env")` to `process.env.NODE_ENV`
- Static file serving configuration corrected for React Router
- Production build process verified working locally
- Server startup sequence optimized for Cloud Run
- Background service initialization properly deferred
- Frontend routing properly configured for `/auth/reset-password` routes
- Production index.html properly generated without development scripts

**✅ Build System Verified (Aug 11, 2025):**
- Created comprehensive deployment scripts (`scripts/prepare-deploy.js`, `scripts/redeploy.js`)
- Build artifacts verified: `server/public/index.html` ✓, `server/dist/index.js` ✓
- All dependencies installed and build process working
- Development server running with all health checks passing

**🎯 READY FOR DEPLOYMENT:**
- All code fixes are complete and tested locally
- Build system produces correct artifacts
- Development environment fully functional
- **Next step: Click "Deploy" button in Replit workspace**

**Status:** ✅ READY - Awaiting manual deployment trigger

## New Build & Deploy System (Aug 11, 2025)
**🚀 COMPREHENSIVE SOLUTION IMPLEMENTED**

**Complete Build Process:**
- `npm run build` now orchestrates full production build
- Builds React frontend → copies to `server/public/`
- Builds backend TypeScript → `server/dist/index.js`
- `npm start` runs production server with proper environment

**React Router Support:**
- Created `server/production.ts` with history fallback support
- All non-API routes serve `index.html` for client-side routing
- Email reset (`/auth/reset-password`) and verification (`/verify-email`) routes guaranteed to work

**Production Environment Fixed:**
- Proper `NODE_ENV=production` detection and enforcement
- Static file serving with caching headers
- Build validation and error handling

**Files Created:**
- `scripts/build-production.js` - Complete build orchestration
- `scripts/start-production.js` - Production startup with validation
- `server/production.ts` - React Router compatible Express serving

**Status:** ✅ COMPLETE - Ready for deployment with comprehensive build system

### Deployment Scripts Created (Aug 11, 2025)
**🛠️ AUTOMATED DEPLOYMENT PIPELINE**

**Created comprehensive deployment automation:**

**`scripts/prepare-deploy.js` (Build & Verify):**
- Installs all dependencies with `npm install`
- Builds frontend and backend with `npm run build`
- Verifies `server/public/index.html` and `server/dist/index.js` exist
- Tests current deployment endpoints (optional)
- Provides clear deployment readiness status

**`scripts/redeploy.js` (Full Automation):**
- Complete build pipeline automation
- Build artifact verification
- Git commit and push (when available)
- Post-deployment endpoint testing
- Comprehensive success/failure reporting

**Usage:**
```bash
# Prepare and verify build (recommended)
node scripts/prepare-deploy.js

# Full automated redeploy (when git available)
node scripts/redeploy.js
```

**Status:** ✅ COMPLETE - Deployment preparation verified, ready for manual deployment