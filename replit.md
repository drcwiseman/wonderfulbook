# Wonderful Books

## Overview
Wonderful Books is a subscription-based digital reading platform, similar to Netflix, offering a curated collection of self-improvement and educational books. It features a 3-tiered subscription model: a 7-day free trial (3 books), a Basic Plan (£5.99/month for 10 books), and a Premium Plan (£9.99/month for unlimited books). The platform provides comprehensive reading functionalities like progress tracking, bookmarks, and an Apple Books-inspired PDF reader. It also includes a robust admin panel for subscription and content management. The platform aims to deliver a premium, engaging reading experience with a focus on transformational literature, utilizing easyJet's signature bright orange and clean white design.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is a React application built with Vite, styled using Tailwind CSS, and utilizes Radix UI components wrapped with shadcn/ui. State management is handled by TanStack Query for server state and React hooks for local state. Wouter is used for routing, and React Hook Form with Zod for form management. The design adheres to a clean, easyJet orange and white color scheme, ensuring WCAG 2.1 AA accessibility compliance for color contrast.

### Backend Architecture
The backend is a Node.js Express server with a RESTful API design. It uses PostgreSQL as the database with Drizzle ORM for type-safe operations.

### Data Storage Solutions
PostgreSQL serves as the primary database, storing user profiles, subscription details, book metadata, reading progress, bookmarks, and session information. Drizzle Kit is used for database migrations and schema management.

### Authentication and Authorization
Authentication is exclusively managed through a local email-based system with bcrypt password hashing (12 salt rounds), email verification, and secure password reset functionality. Server-side sessions are stored in PostgreSQL with a 1-week expiration. Authorization middleware protects routes and injects user context, ensuring secure access to features and content. The system includes comprehensive anti-abuse measures such as device fingerprinting, IP-based rate limiting, and email domain restrictions. An email automation system handles trial reminders and subscription-related communications. A copy protection system enforces a 40% copy limit per book.

### System Design Choices
The platform incorporates a Netflix-style book selection system with time-based locking and billing cycle management. Free Trial users select 3 books for 7 days. Basic Plan users select 10 books for 30-day billing cycles. Premium users have unlimited access. Comprehensive admin interfaces (`/admin` and `/super-admin`) provide separate dashboards for content management and full system control, including user and subscription management with CRUD operations. A health monitoring system provides automated checks, performance tracking, and alerts. A complete navigation system with consistent headers, breadcrumbs, and back buttons is implemented across all major pages.

## External Dependencies

### Payment Processing
Stripe is integrated for payment processing, subscription management (including a 7-day free trial, Basic, and Premium plans), and webhook handling for subscription status updates.

### Database Services
Neon Database provides PostgreSQL hosting, utilizing WebSocket-based connections for serverless environments via `@neondatabase/serverless`.

### Development and Hosting
The project is developed and hosted on the Replit platform.