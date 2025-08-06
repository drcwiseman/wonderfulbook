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