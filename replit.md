# Digital Book Streaming Platform

## Overview
A comprehensive digital book streaming platform designed to offer an immersive reading experience with advanced administrative capabilities. The platform aims to provide a robust environment for digital book streaming, featuring advanced email system configuration and management. It leverages modern web technologies to deliver a multi-tier subscription system (Free, Basic, Premium), advanced email campaign management, PDF book streaming and reading, user analytics, and robust security. The business vision is to capture a significant share of the digital book market by offering a superior user experience and powerful administrative tools, enabling a rich content ecosystem for readers and publishers alike.

**Latest Enhancement (August 2025):** Implemented a comprehensive dynamic book recommendation email system using private SMTP. This system provides personalized book suggestions through collaborative filtering, content-based recommendations, trending analysis, and user preference matching. The system automatically sends weekly recommendation emails on Mondays at 9:00 AM, significantly enhancing user engagement and retention through data-driven book discovery.

## User Preferences
- Follow modern full-stack JavaScript patterns
- Prioritize frontend functionality with minimal backend
- Use TypeScript for type safety
- Maintain clean, production-ready code

## System Architecture
The platform is built with a clear separation of concerns, employing a React with TypeScript frontend and an Express.js backend.
- **Frontend:** Developed with React, TypeScript, Vite, TailwindCSS, and shadcn/ui for a modern, responsive, and accessible user interface.
  - **UI/UX Decisions:** Focus on intuitive navigation, clean design, and a user-friendly reading experience. Color schemes and component choices (shadcn/ui, TailwindCSS) are geared towards a contemporary aesthetic.
  - **Core Functionality:** Multi-tier subscription management, PDF book streaming with advanced features like book-specific Text-to-Speech (TTS) and social sharing.
  - **Book-Specific TTS:** Implemented with `useBookTTS` hook and `BookTTSControls` component, allowing granular control over voice, speed, pitch, volume, and reading progress, with settings persisting per book using localStorage. Supports text extraction from PDF, text selection reading, and sentence-by-sentence navigation.
  - **Social Sharing:** Utilizes `SocialShareButtons` component and `useSocialShare` hook for multi-platform sharing (Twitter, Facebook, LinkedIn, WhatsApp, Email, Native Share), generating platform-optimized share texts.
- **Backend:** Powered by Express.js with TypeScript, employing Drizzle ORM for PostgreSQL database interactions.
  - **Technical Implementation:** Robust API routes, health monitoring (`/health`, `/ping`, `/healthz`), authentication middleware (Express sessions with Passport.js), and a database abstraction layer (`storage.ts`).
  - **System Design:** Optimized for cloud deployment, particularly Cloud Run, with lightweight health endpoints, deferred background service initialization via `setImmediate()`, and minimal production logging to ensure rapid startup and deployment stability. Graceful error handling for missing environment variables and external service dependencies.
  - **Deployment Strategy:** A comprehensive build system orchestrates the full production build, copying the React frontend to `server/public/` and compiling the backend. `server/production.ts` provides history fallback support for client-side routing.
- **Shared Components:** A `shared/` directory contains common schemas and types for consistent data structures across frontend and backend.
- **Admin Dashboard:** Utilizes EJS templates for administrative tools, including email system configuration and management, user analytics, and overall platform control.
- **Dynamic Book Recommendations:** Advanced recommendation engine using collaborative filtering, content-based analysis, and user behavior tracking. Includes personalized weekly email campaigns, user reading preferences management, and comprehensive recommendation analytics. Features automated email scheduling with beautiful HTML templates and tracking capabilities.
- **Security:** Comprehensive security measures and anti-abuse systems are integrated throughout the platform.
- **Health Monitoring:** Implemented with immediate health check responses, production-optimized logging, and error recovery for schedulers.

## External Dependencies
- **Database:** PostgreSQL (via Drizzle ORM)
- **Email:** Nodemailer (for SMTP configuration and email sending)
- **Payments:** Stripe (for payment processing and subscription management)
- **Authentication:** Passport.js (for user authentication)
- **File Storage:** Object storage (with local fallback for file management, likely for PDF books and other assets)
```