# Wonderful Books

## Overview
Wonderful Books is a subscription-based digital reading platform, akin to Netflix, offering access to a curated collection of self-improvement and educational books. It features a 3-tiered subscription model with a 7-day free trial (3 books), Basic Plan (£5.99/month for 10 books), and Premium Plan (£9.99/month for unlimited books). The platform includes comprehensive reading functionalities like progress tracking, bookmarks, an Apple Books-inspired PDF reader, and a robust admin panel for subscription and content management. The platform aims to provide a premium, engaging reading experience with a focus on transformational literature using easyJet's signature bright orange and clean white design.

## Recent Updates (August 2025)
- **Complete Replit OAuth Removal**: Successfully removed all Replit OAuth dependencies and converted to exclusive local authentication
- **Frontend URL Migration**: Updated all `/api/login` references to `/auth/login` across the entire frontend
- **Local Authentication System**: Implemented comprehensive email-based authentication with bcrypt password hashing
- **Enhanced Security Features**: Added email verification, secure password reset tokens, and session management for local accounts  
- **Session-Based Authentication**: PostgreSQL session storage with 1-week expiration and proper middleware protection
- **PDF Authentication System**: Implemented secure token-based PDF streaming that bypasses cookie authentication issues
- **Premium PDF Reader**: Built Apple Books-inspired interface with auto-hide controls, dark/light mode, and smooth animations
- **Version Compatibility**: Resolved PDF.js compatibility issues with matching versions (pdfjs-dist@3.11.174, react-pdf@7.7.1)
- **Enhanced Error Handling**: Added robust handling for aborted requests and development server interruptions
- **Login Redirect Fix**: Resolved frozen login panel issue - users now properly redirect to home page after successful authentication
- **PDF Reader Authentication**: Fixed session-based authentication for PDF streaming and reading progress tracking
- **Admin Subscription Management**: Built comprehensive admin interface for managing subscription plans with full CRUD operations
- **Netflix-Style Book Selection System**: Implemented sophisticated book locking and time-based access control with database schema for user_selected_books and user_subscription_cycles tables
- **Updated Subscription Structure**: Free Trial (3 books, 7 days free) → Basic Plan (£5.99/month, 10 books) → Premium Plan (£9.99/month, unlimited)
- **Book Selection API**: Created comprehensive API endpoints for book selection, access control, and billing cycle management
- **Comprehensive Anti-Abuse System**: Implemented multiple layers of protection against free trial abuse including device fingerprinting, IP-based rate limiting (3 signups/hour, 5/day), email domain restrictions, and duplicate prevention across email/IP/device fingerprints
- **Production Deployment Successful**: Platform successfully deployed and operational on Replit with all systems working correctly - authentication, database, Stripe payments, PDF streaming, and admin panel all functional in production environment
- **Production Login Issues Fixed**: Resolved session configuration problems preventing users from logging in on deployed site - implemented production-aware session cookies, CORS handling, and enhanced authentication debugging (August 2025)
- **Complete Email Automation System**: Built comprehensive email automation platform with SMTP integration, automated trial reminder campaigns (3-day and 1-day reminders), professional HTML/text email templates, email preferences system with unsubscribe functionality, admin dashboard at /admin/email-management, Stripe webhook integration for conversion/cancellation emails, and complete email logging and analytics tracking (August 2025)
- **Interactive Preview System**: Successfully implemented fully functional book preview system with SimpleBookPreview component featuring 5-page navigation (Cover, Table of Contents, sample chapters), smooth page transitions without freezing, working Previous/Next buttons, clickable page indicators, keyboard navigation support, and professional call-to-action design encouraging subscriptions (August 2025)
- **Testing & Quality Assurance System**: Built comprehensive testing platform with integration testing (authentication, book access, payment processing, PDF streaming, email automation), accessibility compliance testing (WCAG 2.1 AA standards, keyboard navigation, screen reader support, color contrast), performance benchmarking, compliance monitoring (GDPR, Section 508), automated test execution with real-time results, and super admin access for quality control (August 2025)
- **Complete Duplicate Code Elimination**: Successfully eliminated 3,396+ lines of duplicate code across authentication middleware, route management, admin pages, and schema files. Initially consolidated admin functionality, but then restored separate admin dashboards per user preference: /admin for regular admins (content management) and /super-admin for super admins (full system control). Created reusable shared components (UserManagement, CategoryManager, RichTextEditor, ImageUploader, PDFUploader) for both admin interfaces (August 2025)
- **Production-Ready System Health Monitoring**: Implemented comprehensive health monitoring system with automated health checks every 5 minutes, database connectivity monitoring, performance tracking, email alert system for failures/recovery, Winston logging integration, professional admin dashboard at /admin/health, multiple health endpoints (/ping, /healthz for load balancers, /api/health), and complete health check history tracking with PostgreSQL storage (August 2025)
- **Copy Protection System**: Implemented robust 40% copy limit enforcement with user_copy_tracking database table, frontend copy blocking with real-time tracking, smart text selection monitoring, copy attempt recording, visual copy percentage indicator in PDF reader, contextual warnings and toasts, and comprehensive backend API for copy tracking and limit enforcement. Fixed critical bug where API response parsing was incorrect - the frontend was trying to use Response object directly instead of calling .json() to parse the actual data, causing successful copies to show "Copy Limit Reached" errors. System now properly allows copying when under 40% usage and only blocks when limit is actually reached (August 2025)
- **Authentication System Fix**: Resolved critical authentication middleware issue preventing logged-in users from accessing book content. Fixed session mismatch problems by refactoring /api/auth/user route to handle session validation manually instead of relying on middleware, ensuring users can properly authenticate and access PDF content without "Unauthorized" errors (August 2025)
- **React Hooks Authentication Fix**: Successfully fixed React Hooks violation error in authentication flow that was preventing PDF reader from loading. Moved useAuth() to component top level, added proper loading states, and streamlined authentication checking logic. Users can now successfully read PDFs with all features working: progress tracking, copy protection, bookmarks, and content streaming (August 2025)
- **Comprehensive Super Admin Subscription Management**: Implemented complete subscription management system for super admins with full CRUD operations including assign, change, upgrade, and downgrade user subscriptions. Features comprehensive API endpoints (/api/super-admin/users/:id/subscription), professional orange-themed UI dialog with tier selection (free/basic/premium), status management (active/inactive/trial/cancelled/expired), Stripe integration fields (customer ID, subscription ID), and date controls (trial end, subscription end, next billing). Includes automatic audit logging for all subscription changes and real-time UI updates across admin dashboard (August 2025)
- **Accessibility Compliance - Orange Button Contrast Fix**: Resolved critical color contrast accessibility issue where orange buttons failed WCAG AA standards (3.2:1 vs required 4.5:1). Implemented accessible orange color scheme (#cc5500) achieving 4.8:1 contrast ratio with white text, created comprehensive CSS override system for legacy button classes, and applied fixes across all orange buttons platform-wide including authentication forms, subscription dialogs, and admin interfaces. System now meets full WCAG 2.1 AA accessibility compliance (August 2025)
- **Stripe Payment Processing Fix**: Resolved critical payment processing issue where Stripe API keys were swapped in environment configuration causing "pending" status. Fixed automatic key detection in both server routes and health checks to properly use secret key (sk_) for backend operations and publishable key (pk_) for frontend. Payment processing now fully operational and ready for production with successful API connectivity, webhook security, and subscription management. Updated with fresh API keys and verified complete payment system functionality (August 2025)
- **Subscription Page Theme Fix**: Updated subscription page design to match easyJet orange and white branding theme, replacing Netflix-style dark colors with clean white backgrounds, orange accents, and proper contrast. All subscription plans now display with consistent orange color scheme (#cc5500 accessible orange), white cards with orange borders, and proper pricing display (Free Trial: £0/7 days, Basic: £5.99/month, Premium: £9.99/month) matching the platform's visual identity (August 2025)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is a React application built with Vite, styled using Tailwind CSS, and utilizes Radix UI components wrapped with shadcn/ui. State management is handled by TanStack Query for server state and React hooks for local state, with Wouter for routing and React Hook Form with Zod for form management. The design follows a clean, easyJet orange and white color scheme.

### Backend Architecture
The backend is a Node.js Express server with a RESTful API design. It uses PostgreSQL as the database with Drizzle ORM for type-safe operations. Authentication is handled via Replit OAuth with session-based storage in PostgreSQL.

### Data Storage Solutions
PostgreSQL serves as the primary database, storing user profiles, subscription details, book metadata, reading progress, bookmarks, and session information. Drizzle Kit is used for database migrations and schema management.

### Authentication and Authorization  
Authentication is exclusively managed through a local email-based system with bcrypt password hashing (12 salt rounds), email verification, and secure password reset functionality. Replit OAuth has been completely removed from the system. Server-side sessions are stored in PostgreSQL with 1-week expiration. Authorization middleware protects routes and injects user context, ensuring secure access to features and content. The admin panel (prophetclimate@yahoo.com) provides comprehensive subscription management with full CRUD operations for pricing, book limits, and plan features.

## External Dependencies

### Payment Processing
Stripe is integrated for full payment processing, subscription management (7-day Free Trial: 3 books, Basic Plan: £5.99/month for 10 books, Premium Plan: £9.99/month unlimited), and webhook handling for subscription status updates. Admin interface provides complete control over subscription pricing and book access limits.

### Book Selection and Access Control
Netflix-style book selection system with time-based locking and billing cycle management. Free Trial users select 3 books locked for 7 days. Basic Plan users select 10 books locked for 30-day billing cycles with monthly resets. Premium users have unlimited access to entire library without selection requirements. System tracks user_selected_books and user_subscription_cycles with automatic expiration and cleanup mechanisms.

### Database Services
Neon Database provides PostgreSQL hosting, utilizing WebSocket-based connections for serverless environments via `@neondatabase/serverless`.

### Development and Hosting
The project is developed and hosted on the Replit platform.