# Wonderful Books

## Overview
Wonderful Books is a subscription-based digital reading platform, akin to Netflix, offering unlimited access to a curated collection of self-improvement and educational books. It features a tiered subscription model (Free Trial, Basic, Premium), comprehensive reading functionalities like progress tracking, bookmarks, personalized recommendations, and a robust admin panel for content and user management. The platform aims to provide a seamless, engaging reading experience with a focus on self-development literature.

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
Authentication is managed through Replit OIDC for user sign-in. Server-side sessions are stored in PostgreSQL. Authorization middleware protects routes and injects user context, ensuring secure access to features and content, including a secured admin panel.

## External Dependencies

### Payment Processing
Stripe is integrated for full payment processing, subscription management (Free Trial, Basic, Premium tiers), and webhook handling for subscription status updates.

### Database Services
Neon Database provides PostgreSQL hosting, utilizing WebSocket-based connections for serverless environments via `@neondatabase/serverless`.

### Development and Hosting
The project is developed and hosted on the Replit platform.