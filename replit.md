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

### Email Verification Removal (Aug 11, 2025)
**🚀 SIMPLIFIED USER ONBOARDING - EMAIL VERIFICATION DISABLED**

Removed email verification requirement after user registration for improved user experience:

**Backend Changes:**
- Modified `registerUser()` in `server/storage.ts` to set `emailVerified: true` by default
- Updated registration API route to remove verification email sending
- Disabled email verification routes (`/api/auth/verify-email/:token`, `/api/auth/resend-verification`)
- Updated registration success message to reflect immediate access

**Frontend Changes:**
- Updated registration success flow in `client/src/pages/auth/register.tsx`
- Modified success messaging to emphasize immediate access
- Updated `client/src/pages/email-verified.tsx` to reflect new policy
- Changed call-to-action buttons to direct users to dashboard/bookstore immediately

**Authentication & Access:**
- No changes to authentication middleware - email verification was never enforced for access
- Users can immediately access all features after registration
- Password reset functionality remains fully intact and operational

**User Experience:**
- Registration → Immediate access (no email verification step)
- Streamlined onboarding process
- Reduced friction for new users
- 7-day free trial starts immediately upon registration

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

**Status:** ✅ COMPLETE - New build system implemented and tested

## Critical Bug Fix: Free Trial Access (Aug 11, 2025)
**🚨 URGENT FIX APPLIED - FREE TRIAL USERS BLOCKED**

Fixed critical subscription checking logic that was preventing free trial users from accessing content:

**Issue Identified:**
- `ProtectedRoute` component was blocking ALL users with `tier: "free"` 
- Free trial users couldn't access books/content despite having `status: "active"`
- "Subscription Required" error shown to valid free trial users

**Fix Applied:**
- Updated subscription logic in `client/src/components/ProtectedRoute.tsx`
- Now correctly allows access for users in valid free trials
- Checks both subscription status AND trial end date
- Users with active free trials can now access all content

**Logic Update:**
```typescript
// OLD (BROKEN): Blocked all free tier users
if (userSubscription === "free" || subscriptionStatus !== "active")

// NEW (FIXED): Allow active free trials + paid subscriptions  
const hasActiveSubscription = subscriptionStatus === "active" && (userSubscription === "basic" || userSubscription === "premium");
const isInFreeTrial = userSubscription === "free" && subscriptionStatus === "active" && freeTrialEndedAt && new Date(freeTrialEndedAt) > new Date();
```

**Status:** ⚠️ REQUIRES DEPLOYMENT - COMPREHENSIVE FIX READY

**All Four Subscription Checks Fixed:**
1. ✅ `ProtectedRoute` component in `/client/src/components/ProtectedRoute.tsx`
2. ✅ `useRouteGuard` hook in `/client/src/hooks/useRouteGuard.ts` 
3. ✅ `canAccessBook()` function in `/client/src/pages/book-detail.tsx`
4. ✅ `canAccessFullContent()` function in `/client/src/pages/book-detail-enhanced.tsx`

**What Was Fixed:**
- All three functions now check for active free trial status: `subscriptionTier === "free" && subscriptionStatus === "active" && freeTrialEndedAt > now`
- Free trial users can now access all content during their 7-day trial period
- Subscription checks properly distinguish between expired trials and active trials

**Must Deploy Now:** The live site is still running old code that blocks free trial users

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

**Status:** Ready for deployment with comprehensive build system

## Enhanced Book-Specific Text-to-Speech System (Aug 12, 2025)
**🔊 ADVANCED TTS IMPLEMENTATION - BOOK-FOCUSED USER CONTROL**

Implemented comprehensive book-specific Text-to-Speech functionality that gives users granular control over reading experience:

**🎯 Book-Specific TTS Features:**
- **Individual book settings** - Each book remembers its own TTS preferences
- **Smart text extraction** - Automatically extracts page text from PDF for high-quality reading
- **Text selection reading** - Users can select specific text passages to read aloud
- **Sentence-by-sentence control** - Skip forward/backward through individual sentences
- **Reading progress tracking** - Visual progress bar showing current sentence and percentage
- **Voice customization** - Per-book voice selection, speed, pitch, and volume controls

**🎛️ User Control Options:**
- **Enable/Disable toggle** - Simple on/off switch for TTS per book
- **Reading modes:**
  - Read selected text (highlight and read)
  - Read current page (entire page content)
  - Auto-read new pages (optional)
- **Playback controls** - Play, pause, skip sentences, stop
- **Voice settings** - Choose from available system voices with language preferences
- **Speed control** - Adjustable reading speed from 0.5x to 2.0x
- **Volume control** - Per-book volume settings
- **Text highlighting** - Optional visual highlighting of currently spoken text

**🔧 Technical Implementation:**
- Created `useBookTTS` hook for book-specific TTS management
- Built `BookTTSControls` component with compact, accessible UI
- Integrated into `PremiumPDFReader` with automatic text extraction
- Settings persist per book using localStorage with book ID
- Sentence segmentation for precise reading control
- Error handling and fallback voice selection

**📍 Integration Points:**
- **Book Reader** - Fixed position controls in bottom-left corner
- **PDF Text Extraction** - Automatic extraction on page changes
- **Text Selection** - Real-time detection of user text selections
- **Settings Panel** - Collapsible advanced controls
- **Legacy TTS Coexistence** - Works alongside existing site-wide accessibility TTS

**🎨 User Experience:**
- Compact card interface that stays out of the way
- Quick enable/disable without losing settings
- One-click reading of selections or full pages
- Visual feedback for reading progress
- Responsive design for mobile and desktop
- Keyboard shortcuts still available for power users

**Benefits Over Site-Wide TTS:**
- ✅ Book-specific preferences and settings
- ✅ Higher quality text extraction from PDFs
- ✅ Precise sentence-level control
- ✅ Better reading progress visualization
- ✅ User choice between global and book-specific TTS
- ✅ Persistent settings per book
- ✅ Enhanced mobile reading experience

**Status:** ✅ COMPLETE - Production-ready book-specific TTS system implemented