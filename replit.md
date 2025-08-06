# Wonderful Books

## Overview

Wonderful Books is a Netflix-style book reading platform that provides unlimited access to a curated collection of self-improvement and educational books. The platform features a subscription-based model with multiple tiers (Free Trial, Basic, Premium) and includes comprehensive reading features like progress tracking, bookmarks, and personalized recommendations.

## Recent Changes (August 6, 2025)

### Step 1 Complete: Secure PDF Reading System ✅
- Fixed routing issues preventing access to book detail pages
- Resolved setLocation and id variable errors in navigation
- Implemented complete PDF streaming with dynamic imports
- Added proper font rendering with Helvetica family
- Created buttery-smooth Apple Books-style reader experience

### Step 2 Complete: Enhanced Reading Progress Tracking ✅
- Implemented dual-endpoint progress tracking (POST /api/progress + POST /api/reading-progress)
- Added automatic page change event tracking with instant saves
- Enhanced resume functionality - users continue exactly where they left off
- Added "Welcome back!" notifications showing last read page
- Implemented background progress saves to prevent data loss
- Database stores: userId, bookId, currentPage, totalPages, progressPercentage, lastReadAt

### Step 3 Complete: Subscription System & Pricing Display ✅
- Fixed subscription button loading states and redirect issues on /subscribe page
- Added subscription plan visibility throughout the platform (header badges, home page status)
- Created prominent PricingSection component on home page to attract customers
- Fixed database subscription tier updates and user authentication flow
- Enhanced pricing cards with hover effects, "Most Popular" badges, and clear CTAs
- Integrated subscription management with proper tier recognition (Free Trial, Basic £9.99, Premium £19.99)

### Step 4 Complete: Bookmark System Implementation ✅
- Fixed authentication issues affecting bookmark API endpoints with comprehensive logging
- Database verification confirmed: bookmark CRUD operations working with test bookmarks
- Enhanced bookmark routes with alternative endpoints for React Query compatibility
- Implemented add/remove bookmarks in reader with instant UI sync
- Added bookmark display in dashboard with recent bookmarks section
- Real-time bookmark synchronization across all pages confirmed working

### Step 5 Complete: Admin Panel & Book Management ✅
- Implemented secure admin panel at `/admin` route with hardcoded authorization (ID: 45814604)
- Created comprehensive PDF upload form with metadata (title, author, description, category, tier, rating)
- Built book management dashboard with visibility toggles and bulk operations
- Added subscription tier assignment with bulk update capabilities
- Implemented analytics dashboard with real-time metrics:
  * Total Users Count
  * Active Subscriptions (Basic + Premium)
  * Monthly Revenue Calculation (Basic: £9.99, Premium: £19.99)
  * Trial Conversion Rate Percentage
- Database integration complete with proper admin authorization middleware

### Step 6 Complete: Enhanced Admin Panel with Full Content Management ✅
- Fixed React hook errors and stabilized TipTap editor implementation
- Created functional ImageUploader component with drag-and-drop support and file validation
- Built PDFUploader component for secure book file uploads with 50MB limit
- Enhanced RichTextEditor with improved callback handling and content management
- Implemented complete book creation workflow:
  * Cover image upload with instant preview and removal
  * Rich text description editor with formatting tools (bold, italic, lists, quotes)
  * PDF file upload with validation and progress feedback
  * Form validation ensuring all required fields are completed
- Added comprehensive admin routes for file handling:
  * `/api/admin/upload-image` for cover image uploads
  * `/api/admin/upload-pdf` for book file uploads
  * Enhanced file serving with subdirectory support
- Integrated analytics refresh after book creation to maintain accurate metrics
- Professional admin interface now fully operational with complete CRUD capabilities

### Step 7 Complete: Manual User Creation & Role Management System ✅
- Fixed critical "users.map is not a function" error with proper array handling and default values
- Enhanced user data validation with comprehensive fallback values for missing properties
- Implemented "Create New User" functionality in admin panel with:
  * Complete user creation form with email, password, name fields
  * Role assignment (user, admin, moderator) with default "user" role
  * Subscription tier assignment (free, basic, premium) with default "free" tier
  * Account status management (active/inactive) with default active status
  * Form validation ensuring all required fields are completed
- Added backend API endpoints:
  * `POST /api/admin/users` for manual user creation with duplicate email checking
  * Enhanced storage methods: `getUserByEmail()` and `createManualUser()`
- Updated user management interface with:
  * Prominent "Create New User" button in admin user management tab
  * Comprehensive creation dialog with role and subscription assignment
  * Proper error handling and success notifications
  * Automatic cache invalidation and analytics refresh after user creation
- All database operations properly integrated with user schema including roles and subscription tiers

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript, following a modern component-based architecture:

- **UI Framework**: React with Vite as the build tool for fast development and optimized production builds
- **Styling**: Tailwind CSS with a custom Netflix-inspired design system using CSS variables for theming
- **Component Library**: Radix UI components wrapped with shadcn/ui for consistent and accessible UI elements
- **State Management**: TanStack Query for server state management and caching, with React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
The server follows a RESTful API design built on Node.js and Express:

- **Runtime**: Node.js with TypeScript and ESM modules
- **Framework**: Express.js with middleware for logging, authentication, and error handling
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit OAuth integration with session-based authentication using connect-pg-simple for session storage
- **API Design**: RESTful endpoints organized by resource (books, users, reading progress, bookmarks, payments)

### Data Storage Solutions
The application uses PostgreSQL as the primary database with a well-structured schema:

- **User Management**: Users table storing profile information, subscription details, and Stripe customer data
- **Content Management**: Books table with metadata, categories, ratings, and file URLs
- **Reading Features**: Separate tables for reading progress tracking and bookmarks with user relationships
- **Session Storage**: Dedicated sessions table for authentication state management
- **Database Migrations**: Drizzle Kit for schema management and version control

### Authentication and Authorization
Security is implemented through Replit's OAuth system:

- **OAuth Provider**: Replit OIDC for user authentication
- **Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Authorization Middleware**: Route protection with user context injection
- **Security Features**: HTTPS-only cookies, CSRF protection, and secure session handling

## External Dependencies

### Payment Processing
- **Stripe Integration**: Full payment processing with subscription management using Stripe's latest API version
- **Subscription Tiers**: Three-tier system (Free Trial, Basic, Premium) with different feature access levels
- **Webhook Handling**: Stripe webhooks for subscription status updates and payment confirmations

### Database Services
- **Neon Database**: PostgreSQL hosting with connection pooling via @neondatabase/serverless
- **Connection Management**: WebSocket-based connections for serverless environments with automatic reconnection

### Development and Hosting
- **Replit Platform**: Native integration with Replit's development environment and hosting
- **Vite Plugins**: Development-specific plugins for error overlay and code mapping
- **Build System**: ESBuild for production builds with Node.js targeting and external package handling

### UI and Design
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography throughout the application
- **Tailwind CSS**: Utility-first CSS framework with custom configuration for the Netflix-inspired design system