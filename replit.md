# Wonderful Books

## Overview
Wonderful Books is a subscription-based digital reading platform, similar to Netflix, offering a curated collection of self-improvement and educational books. It features a 3-tiered subscription model: a 7-day free trial (3 books), a Basic Plan (£5.99/month for 10 books), and a Premium Plan (£9.99/month for unlimited books). The platform provides comprehensive reading functionalities like progress tracking, bookmarks, and an Apple Books-inspired PDF reader. It also includes a robust admin panel for subscription and content management. The platform aims to deliver a premium, engaging reading experience with a focus on transformational literature, utilizing easyJet's signature bright orange and clean white design.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Development Issues (August 10, 2025)
- **NODE_ENV=production Configuration**: ✅ COMPLETED - Production environment detection and configuration is fully implemented and tested
- **Production Features Working**: Secure cookies, CORS policies, proxy trust, and security headers all properly configured for production
- **"Something went wrong" Errors**: ✅ COMPLETED - All React component errors resolved through comprehensive import fixes and authentication system alignment
- **Authentication System Mismatch**: ✅ COMPLETED - Fixed dashboard route to use session-based auth instead of OAuth, aligning with frontend authentication
- **React Import Issues**: ✅ COMPLETED - Added React imports to all components and pages (100+ files) to resolve JSX compilation errors
- **System Settings Configuration**: ✅ COMPLETED - Comprehensive email configuration with environment defaults and admin overrides, including SMTP credentials, timeouts, rate limiting, and performance settings
- **Current Status**: All systems operational - dashboard, super-admin panel, and comprehensive system settings with full email configuration control

## System Architecture

### Frontend Architecture
The frontend is a React application built with Vite, styled using Tailwind CSS, and utilizes Radix UI components wrapped with shadcn/ui. State management is handled by TanStack Query for server state and React hooks for local state. Wouter is used for routing, and React Hook Form with Zod for form management. The design adheres to a clean, easyJet orange and white color scheme, ensuring WCAG 2.1 AA accessibility compliance for color contrast.

### Backend Architecture
The backend is a Node.js Express server with a RESTful API design. It uses PostgreSQL as the database with Drizzle ORM for type-safe operations.

### Data Storage Solutions
PostgreSQL serves as the primary database, storing user profiles, subscription details, book metadata, reading progress, bookmarks, and session information. Drizzle Kit is used for database migrations and schema management.

### Authentication and Authorization
Authentication is exclusively managed through a local email-based system with bcrypt password hashing (12 salt rounds), email verification, and secure password reset functionality. Server-side sessions are stored in PostgreSQL with a 1-week expiration. Authorization middleware protects routes and injects user context, ensuring secure access to features and content. The system includes comprehensive anti-abuse measures such as device fingerprinting, IP-based rate limiting, and email domain restrictions. An email automation system handles trial reminders and subscription-related communications. A copy protection system enforces a 40% copy limit per book.

#### Route Protection System (Added August 10, 2025)
Comprehensive routing protection implemented with multiple security layers:
- **Frontend Protection**: ProtectedRoute component with authentication guards, subscription checks, and role-based access control
- **Backend Security**: Rate limiting (200 req/15min general, 50 req/15min auth), security headers (CSP, XSS protection), device fingerprinting
- **Access Levels**: Public routes, authentication-required routes, active subscription routes, admin-only routes, super-admin-only routes
- **Security Features**: Automatic redirects for unauthorized access, real-time status checking, comprehensive error handling

### System Design Choices
The platform incorporates a Netflix-style book selection system with time-based locking and billing cycle management. Free Trial users select 3 books for 7 days. Basic Plan users select 10 books for 30-day billing cycles. Premium users have unlimited access. Comprehensive admin interfaces (`/admin` and `/super-admin`) provide separate dashboards for content management and full system control, including user and subscription management with CRUD operations. A health monitoring system provides automated checks, performance tracking, and alerts. A complete navigation system with consistent headers, breadcrumbs, and back buttons is implemented across all major pages.

## External Dependencies

### Payment Processing
Stripe is integrated for payment processing, subscription management (including a 7-day free trial, Basic, and Premium plans), and webhook handling for subscription status updates.

### Database Services
Neon Database provides PostgreSQL hosting, utilizing WebSocket-based connections for serverless environments via `@neondatabase/serverless`.

### Development and Hosting
The project is developed and hosted on the Replit platform.

## Pre-deployment Check Suite (Added August 10, 2025)
Comprehensive production readiness validation system including:
- **Link Validation**: Public and authenticated page link checking with Playwright and Linkinator
- **Performance Testing**: Lighthouse CI with configurable thresholds for performance, accessibility, SEO, and PWA scores
- **Security Validation**: HTTP security headers verification (CSP, HSTS, X-Frame-Options, etc.)
- **Accessibility Testing**: WCAG 2.1 AA compliance checking with pa11y and axe-core
- **Health Monitoring**: Database connectivity and system health endpoint validation
- **Reports Dashboard**: Automated report generation with visual status dashboard and basic auth protection
- **Integration Ready**: Works on both Replit deployments and generic Linux VPS environments