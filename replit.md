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

### Deployment Fixes (Aug 11, 2025)
Applied comprehensive deployment readiness fixes:

**✅ Server Configuration:**
- Server already properly binds to `0.0.0.0:${PORT}` for Autoscale compatibility
- Port mapping configured in .replit (port 5000 → external port 80)
- Production environment detection with proxy trust configuration
- Graceful shutdown handlers for SIGTERM/SIGINT signals

**✅ Health Check Endpoints:**
- `/health` - Simple deployment readiness check
- `/ping` - Load balancer health check (returns "pong")  
- `/healthz` - Comprehensive health check with database status
- All endpoints respond immediately for deployment initialization

**✅ Build Process:**
- Build script works correctly: `npm run build`
- Start script configured: `npm run start` (NODE_ENV=production)
- Production-ready error handling and logging

**✅ Production Readiness:**
- Environment variable validation
- Production mode detection and logging
- Security headers and CORS configuration
- Database connection health monitoring

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

### Deployment Status
The application is now deployment-ready with:
- ✅ Proper port binding (0.0.0.0)
- ✅ Health check endpoints
- ✅ Production configuration
- ✅ Graceful shutdown handling
- ✅ Build process validation
- ✅ Environment variable management

Ready for Autoscale deployment on Replit.