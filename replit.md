# Wonderful Books

## Overview
Wonderful Books is a subscription-based digital reading platform, akin to Netflix, offering unlimited access to a curated collection of self-improvement and educational books. It features a tiered subscription model (Free Trial, Basic, Premium), comprehensive reading functionalities like progress tracking, bookmarks, personalized recommendations, and a robust admin panel for content and user management. The platform aims to provide a seamless, engaging reading experience with a focus on self-development literature.

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
Authentication is exclusively managed through a local email-based system with bcrypt password hashing (12 salt rounds), email verification, and secure password reset functionality. Replit OAuth has been completely removed from the system. Server-side sessions are stored in PostgreSQL with 1-week expiration. Authorization middleware protects routes and injects user context, ensuring secure access to features and content, including a secured admin panel.

## External Dependencies

### Payment Processing
Stripe is integrated for full payment processing, subscription management (Free Trial, Basic, Premium tiers), and webhook handling for subscription status updates.

### Database Services
Neon Database provides PostgreSQL hosting, utilizing WebSocket-based connections for serverless environments via `@neondatabase/serverless`.

### Development and Hosting
The project is developed and hosted on the Replit platform.