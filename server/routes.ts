import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage.js";
import { db } from "./db.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, feedback, feedbackComments, insertFeedbackSchema, insertFeedbackCommentSchema, users, licenses, loans, bookChunks } from "@shared/schema";
import { insertBookSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { sql, eq, desc, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";
import connectPg from "connect-pg-simple";

import { antiAbuseService } from "./antiAbuseService.js";
import { AuditService } from "./auditService.js";
import { healthRouter } from "./health/routes.js";
import { healthzRouter } from "./routes/healthz.js";
import { securityHeaders, additionalSecurityHeaders } from "./middleware/securityHeaders.js";
import { reportsAuth } from "./middleware/reportsAuth.js";

import { isAuthenticated, requireAdmin, requireSuperAdmin } from './middleware/auth.js';
import { 
  rateLimit, 
  requireAuth, 
  requireSubscription, 
  requireRole,
  requirePremium,
  validateAPIRoute,
  deviceFingerprint
} from "./middleware/routeProtection.js";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Stripe keys are swapped in environment - fix this automatically
const secretKey = process.env.STRIPE_SECRET_KEY?.startsWith('sk_') 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.VITE_STRIPE_PUBLIC_KEY;

if (!secretKey?.startsWith('sk_')) {
  throw new Error('No valid Stripe secret key found. Please verify STRIPE_SECRET_KEY contains a secret key (sk_...)');
}

console.log('Using Stripe secret key starting with:', secretKey.substring(0, 3));
const stripe = new Stripe(secretKey);

export async function registerRoutes(app: Express): Promise<Server> {
  // Production environment detection and configuration
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Trust proxy configuration for production
  app.set("trust proxy", isProduction ? 1 : false);
  
  // CORS configuration
  app.use((req, res, next) => {
    const allowedOrigins = isProduction 
      ? ['https://*.replit.app', 'https://*.replit.dev']
      : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'];
    
    const origin = req.headers.origin;
    if (isProduction) {
      // In production, check if origin matches allowed patterns
      if (origin && (origin.includes('.replit.app') || origin.includes('.replit.dev'))) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    } else {
      // In development, allow localhost origins
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'local-auth-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Enable secure cookies in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: sessionTtl,
    },
    proxy: process.env.NODE_ENV === 'production', // Trust proxy in production
  }));

  // Apply global security middleware
  app.use(securityHeaders);
  app.use(additionalSecurityHeaders);
  app.use(validateAPIRoute);
  app.use(deviceFingerprint);
  
  // Apply rate limiting to API routes
  app.use('/api/', rateLimit(200, 15 * 60 * 1000)); // 200 requests per 15 minutes
  app.use('/api/auth/', rateLimit(50, 15 * 60 * 1000)); // 50 auth requests per 15 minutes

  // DRM and Device Management Routes
  const deviceRoutes = await import('./routes/devices.js');
  const loanRoutes = await import('./routes/loans.js');
  const licenseRoutes = await import('./routes/licenses.js');
  
  app.use('/api/devices', deviceRoutes.default);
  app.use('/api/loans', loanRoutes.default);
  app.use('/api/licenses', licenseRoutes.default);

  // Copy protection routes
  app.get('/api/copy-tracking/:bookId', isAuthenticated, async (req: any, res) => {
    try {
      const { bookId } = req.params;
      const userId = req.user.id;
      
      const tracking = await storage.getCopyTracking(userId, bookId);
      if (!tracking) {
        // Initialize tracking for new book access
        const newTracking = await storage.initializeCopyTracking(userId, bookId);
        return res.json(newTracking);
      }
      
      res.json(tracking);
    } catch (error) {
      console.error('Error fetching copy tracking:', error);
      res.status(500).json({ message: 'Failed to fetch copy tracking' });
    }
  });

  app.post('/api/copy-attempt', isAuthenticated, async (req: any, res) => {
    try {
      const { bookId, charactersCopied } = req.body;
      const userId = req.user.id;
      
      if (!bookId || !charactersCopied || charactersCopied < 0) {
        return res.status(400).json({ message: 'Invalid copy attempt data' });
      }
      
      const result = await storage.recordCopyAttempt(userId, bookId, charactersCopied);
      res.json(result);
    } catch (error) {
      console.error('Error recording copy attempt:', error);
      res.status(500).json({ message: 'Failed to record copy attempt' });
    }
  });

  // Production health check and environment status
  app.get('/api/health', async (req, res) => {
    try {
      const health = {
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        database: {
          connected: !!process.env.DATABASE_URL,
          sessionStore: 'postgresql'
        },
        authentication: {
          sessionSecret: !!process.env.SESSION_SECRET,
          provider: 'local'
        },
        deployment: {
          trustProxy: isProduction,
          secureCookies: isProduction,
          corsEnabled: true
        }
      };
      res.json(health);
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Health check failed',
        error: isProduction ? 'Internal server error' : String(error)
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user session exists
      if (!req.session || !req.session.user) {
        return res.status(401).json({ 
          message: "Unauthorized",
          debug: process.env.NODE_ENV === 'production' ? undefined : {
            hasSession: !!req.session,
            sessionId: req.sessionID
          }
        });
      }

      // Get fresh user data to ensure they still have valid access
      const user = await storage.getUser(req.session.user.id);
      if (!user || !user.isActive) {
        // Clear invalid session
        req.session.destroy();
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local authentication routes with anti-abuse protection
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const userIP = (req.headers['x-forwarded-for'] as string) || 
                    (req.headers['x-real-ip'] as string) || 
                    req.socket.remoteAddress || 
                    req.ip || 
                    '127.0.0.1';
      
      // Extract device fingerprint from request headers/body
      const deviceFingerprint = req.body.deviceFingerprint;
      
      // Check IP rate limiting first
      const ipCheck = await antiAbuseService.checkIpRateLimit(userIP);
      if (!ipCheck.allowed) {
        await antiAbuseService.recordFailedSignup({
          email: userData.email,
          ip: userIP,
          deviceFingerprint,
          userAgent: req.headers['user-agent']
        });
        return res.status(429).json({ 
          message: ipCheck.reason,
          retryAfter: ipCheck.retryAfter
        });
      }
      
      // Check free trial eligibility
      const eligibilityCheck = await antiAbuseService.checkFreeTrialEligibility({
        email: userData.email,
        ip: userIP,
        deviceFingerprint,
        userAgent: req.headers['user-agent']
      });
      
      if (!eligibilityCheck.eligible) {
        await antiAbuseService.recordFailedSignup({
          email: userData.email,
          ip: userIP,
          deviceFingerprint,
          userAgent: req.headers['user-agent']
        });
        return res.status(403).json({ 
          message: eligibilityCheck.reason,
          conflictType: eligibilityCheck.conflictType
        });
      }
      
      // Register the user
      const user = await storage.registerUser(userData);
      
      // Record successful free trial start
      await antiAbuseService.recordFreeTrialStart(user, userIP, deviceFingerprint);
      
      // TODO: Send verification email
      console.log('Email verification token:', user.emailVerificationToken);
      
      res.status(201).json({ 
        message: "Registration successful! Your 7-day free trial has started. Please check your email to verify your account.",
        userId: user.id,
        freeTrialEndsAt: user.freeTrialEndedAt
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Record failed attempt
      const userIP = (req.headers['x-forwarded-for'] as string) || 
                    (req.headers['x-real-ip'] as string) || 
                    req.socket.remoteAddress || 
                    req.ip || 
                    '127.0.0.1';
      
      await antiAbuseService.recordFailedSignup({
        email: req.body.email || 'unknown',
        ip: userIP,
        deviceFingerprint: req.body.deviceFingerprint,
        userAgent: req.headers['user-agent']
      });
      
      if (error.message?.includes('Email already registered') || error.message?.includes('Username already taken')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt:', { 
        email: req.body.email, 
        environment: process.env.NODE_ENV,
        sessionId: req.sessionID,
        userAgent: req.headers['user-agent']?.substring(0, 50)
      });
      
      const loginData = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(loginData.email, loginData.password);
      
      if (!user) {
        console.log('Login failed: Invalid credentials for', loginData.email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.emailVerified) {
        console.log('Login failed: Email not verified for', loginData.email);
        return res.status(401).json({ message: "Please verify your email before signing in" });
      }

      if (!user.isActive) {
        console.log('Login failed: Account deactivated for', loginData.email);
        return res.status(401).json({ message: "Your account has been deactivated" });
      }

      // Create a session for local auth users
      const sessionData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        loginTime: new Date().toISOString()
      };
      
      (req.session as any).user = sessionData;
      
      // Force session save for production environments
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      console.log('Login successful for:', user.email, 'sessionId:', req.sessionID);
      
      res.json({ 
        message: "Login successful", 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName 
        } 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ 
        message: error.message || "Login failed",
        debug: isProduction ? undefined : {
          error: String(error),
          sessionId: req.sessionID,
          environment: process.env.NODE_ENV
        }
      });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const resetToken = await storage.generatePasswordResetToken(email);
      
      if (resetToken) {
        // TODO: Send password reset email
        console.log('Password reset token:', resetToken);
        console.log('Reset URL:', `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`);
      }
      
      // Always return success to prevent email enumeration
      res.json({ message: "If an account with that email exists, we've sent password reset instructions." });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(400).json({ message: error.message || "Request failed" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const resetData = resetPasswordSchema.parse(req.body);
      const success = await storage.resetPassword(resetData.token, resetData.password);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      res.json({ message: "Password reset successful! You can now sign in with your new password." });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(400).json({ message: error.message || "Password reset failed" });
    }
  });

  app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const success = await storage.verifyEmail(token);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      res.json({ message: "Email verified successfully! You can now sign in." });
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Profile update route
  app.put('/api/auth/profile', isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;
      const userId = (req.session as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate input
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }
      
      // Check if email is already taken by another user
      if (email !== (req.session as any).user?.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email address is already in use" });
        }
      }
      
      // Update user profile
      const success = await storage.updateUserProfile(userId, { firstName, lastName, email });
      
      if (!success) {
        return res.status(500).json({ message: "Failed to update profile" });
      }
      
      // Update session with new data
      (req.session as any).user = {
        ...(req.session as any).user,
        firstName,
        lastName,
        email
      };
      
      res.json({ message: "Profile updated successfully" });
    } catch (error: any) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: error.message || "Profile update failed" });
    }
  });

  // Change password route
  app.put('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req.session as any).user?.id;
      const userEmail = (req.session as any).user?.email;
      
      if (!userId || !userEmail) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      
      // Verify current password
      const user = await storage.authenticateUser(userEmail, currentPassword);
      if (!user) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const success = await storage.changeUserPassword(userId, newPassword);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to change password" });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error('Password change error:', error);
      res.status(500).json({ message: error.message || "Password change failed" });
    }
  });

  // Book routes
  app.get('/api/books', async (req, res) => {
    try {
      const { category, search, featured } = req.query;
      
      let books;
      if (featured === 'true') {
        books = await storage.getFeaturedBooks();
      } else if (category) {
        books = await storage.getBooksByCategory(category as string);
      } else if (search) {
        books = await storage.searchBooks(search as string);
      } else {
        books = await storage.getAllBooks();
      }
      
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Categories endpoint
  app.get('/api/categories', async (req, res) => {
    try {
      // Get unique book tiers and categories from the database
      const books = await storage.getAllBooks();
      const tiers = Array.from(new Set(books.map(book => book.requiredTier)));
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // User reading progress endpoint for library
  app.get('/api/user/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserReadingProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user reading progress:", error);
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  app.get('/api/books/:id', async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  // Book Reviews API Routes
  app.get('/api/books/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, sort = 'newest' } = req.query;
      
      const reviews = await storage.getBookReviews(id, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: sort as string
      });
      
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching book reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/books/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const reviewData = {
        userId,
        bookId: id,
        ...req.body
      };
      
      const review = await storage.createBookReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating book review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.post('/api/reviews/:reviewId/helpful', isAuthenticated, async (req: any, res) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user.claims.sub;
      const { isHelpful } = req.body;
      
      const vote = await storage.voteReviewHelpful(reviewId, userId, isHelpful);
      res.json(vote);
    } catch (error) {
      console.error("Error voting on review:", error);
      res.status(500).json({ message: "Failed to vote on review" });
    }
  });

  // Protected book creation route (admin only)
  app.post('/api/books', isAuthenticated, async (req, res) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  // Enhanced Reading progress routes for Step 2
  app.get('/api/reading-progress/:bookId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getReadingProgress(userId, req.params.bookId);
      res.json(progress || { currentPage: 1, totalPages: 0, progressPercentage: "0.00" });
    } catch (error) {
      console.error("Error fetching reading progress:", error);
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  app.post('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId, currentPage, totalPages, progressPercentage } = req.body;
      
      const currentPageNum = parseInt(currentPage, 10);
      const totalPagesNum = parseInt(totalPages, 10);
      
      // Validate inputs to prevent NaN
      if (isNaN(currentPageNum) || isNaN(totalPagesNum)) {
        return res.status(400).json({ message: "Invalid page numbers" });
      }
      
      const progressData = {
        userId,
        bookId,
        currentPage: currentPageNum,
        totalPages: totalPagesNum,
        progressPercentage: String(progressPercentage),
        lastReadAt: new Date(),
      };
      
      const progress = await storage.upsertReadingProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(500).json({ message: "Failed to update reading progress" });
    }
  });

  // Alternative endpoint for Step 2 requirements: POST /api/progress with bookId + pageNumber
  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId, pageNumber, currentPage, totalPages } = req.body;
      const actualPageNumber = pageNumber || currentPage;
      
      console.log('Progress update request:', { bookId, pageNumber, currentPage, actualPageNumber, totalPages, userId });
      
      const progressPercentage = totalPages > 0 ? ((actualPageNumber / totalPages) * 100).toFixed(2) : "0.00";
      
      const currentPageNum = parseInt(actualPageNumber, 10);
      const totalPagesNum = parseInt(totalPages || 0, 10);
      
      // Validate inputs to prevent NaN - but be more lenient
      if (isNaN(currentPageNum) || currentPageNum < 1) {
        console.log('Invalid currentPageNum:', currentPageNum, 'from actualPageNumber:', actualPageNumber);
        return res.status(400).json({ message: "Invalid current page number" });
      }
      
      if (isNaN(totalPagesNum) || totalPagesNum < 1) {
        console.log('Invalid totalPagesNum:', totalPagesNum, 'from totalPages:', totalPages);
        return res.status(400).json({ message: "Invalid total pages number" });
      }
      
      const progressData = {
        userId,
        bookId,
        currentPage: currentPageNum,
        totalPages: totalPagesNum,
        progressPercentage,
        lastReadAt: new Date(),
      };
      
      const progress = await storage.upsertReadingProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(500).json({ message: "Failed to update reading progress" });
    }
  });

  // Get user's last read page for resuming
  app.get('/api/progress/:bookId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getReadingProgress(userId, req.params.bookId);
      
      if (progress) {
        res.json({
          lastPage: progress.currentPage,
          totalPages: progress.totalPages,
          progressPercentage: progress.progressPercentage,
          lastReadAt: progress.lastReadAt
        });
      } else {
        res.json({
          lastPage: 1,
          totalPages: 0,
          progressPercentage: "0.00",
          lastReadAt: null
        });
      }
    } catch (error) {
      console.error("Error fetching last read page:", error);
      res.status(500).json({ message: "Failed to fetch last read page" });
    }
  });

  // Dashboard API endpoint
  app.get('/api/user/dashboard', async (req: any, res) => {
    try {
      // Check if user session exists - use same auth pattern as /api/auth/user
      if (!req.session || !req.session.user) {
        return res.status(401).json({ 
          message: "Unauthorized",
          debug: process.env.NODE_ENV !== 'production' ? {
            hasSession: !!req.session,
            sessionId: req.sessionID,
            sessionData: req.session
          } : undefined
        });
      }
      
      const userId = req.session.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get reading statistics
      const readingHistory = await storage.getUserReadingHistory(userId);
      const bookmarks = await storage.getUserBookmarks(userId);
      
      res.json({
        user,
        readingHistory: readingHistory.slice(0, 10), // Last 10 books
        bookmarks: bookmarks.slice(0, 10), // Recent bookmarks
        stats: {
          booksInProgress: readingHistory.length,
          totalBookmarks: bookmarks.length,
          currentTier: user.subscriptionTier || 'free',
          subscriptionStatus: user.subscriptionStatus || 'inactive'
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Get reading history
  app.get('/api/reading-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserReadingHistory(userId);
      
      // Fetch book details for each progress entry
      const historyWithBooks = await Promise.all(
        history.map(async (progress) => {
          const book = await storage.getBook(progress.bookId);
          return {
            ...progress,
            book
          };
        })
      );
      
      res.json(historyWithBooks);
    } catch (error) {
      console.error("Error fetching reading history:", error);
      res.status(500).json({ message: "Failed to fetch reading history" });
    }
  });

  // Bookmarks routes
  app.get('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId } = req.query;
      console.log('Fetching bookmarks for user:', userId, 'book:', bookId);
      const bookmarks = await storage.getUserBookmarks(userId, bookId as string);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Alternative bookmark route with bookId in path for React Query compatibility
  app.get('/api/bookmarks/:bookId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId } = req.params;
      console.log('Fetching bookmarks via path for user:', userId, 'book:', bookId);
      const bookmarks = await storage.getUserBookmarks(userId, bookId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Creating bookmark for user:', userId, 'data:', req.body);
      const bookmarkData = {
        ...req.body,
        userId,
      };
      const bookmark = await storage.createBookmark(bookmarkData);
      console.log('Bookmark created successfully:', bookmark.id);
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete('/api/bookmarks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Deleting bookmark:', req.params.id, 'for user:', userId);
      await storage.deleteBookmark(req.params.id);
      console.log('Bookmark deleted successfully:', req.params.id);
      res.json({ message: "Bookmark deleted successfully" });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for PDFs
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'));
      }
    },
  });



  // Regular Admin Users Endpoint (limited to 5 users for overview)
  app.get('/api/admin/users', requireAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 5, 5); // Max 5 for overview
      const search = req.query.search || '';
      const role = req.query.role || '';
      
      const users = await storage.getAllUsers({ page, limit, search, role });
      res.json(users);
    } catch (error) {
      console.error('Error fetching users for admin:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Update user status (admin only)
  app.patch('/api/admin/users/:userId/status', requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      const updatedUser = await storage.updateUserStatus(userId, isActive);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // Regular admin analytics endpoint (simplified version of super admin stats)
  app.get('/api/admin/analytics', requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      
      // Return simplified analytics for regular admin
      const adminAnalytics = {
        totalUsers: stats.totalUsers,
        activeSubscriptions: Object.values(stats.subscriptionBreakdown).reduce((sum, count) => sum + count, 0) - (stats.subscriptionBreakdown['free'] || 0),
        monthlyRevenue: ((stats.subscriptionBreakdown['basic'] || 0) * 5.99) + ((stats.subscriptionBreakdown['premium'] || 0) * 9.99),
        conversionRate: Math.round(((Object.values(stats.subscriptionBreakdown).reduce((sum, count) => sum + count, 0) - (stats.subscriptionBreakdown['free'] || 0)) / stats.totalUsers) * 100),
        popularBooks: stats.popularBooks || [],
        // Additional insights for admin dashboard
        recentSignups: stats.recentSignups,
        totalBooks: stats.totalBooks
      };
      
      res.json(adminAnalytics);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Super Admin Routes - User Management
  
  // Get all users with pagination and filters
  app.get('/api/super-admin/users', requireSuperAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || '';
      const role = req.query.role || '';
      
      const users = await storage.getAllUsers({ page, limit, search, role });
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Update user role
  app.patch('/api/super-admin/users/:userId/role', requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Update user details (name, email)
  app.patch('/api/super-admin/users/:userId', requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'First name, last name, and email are required' });
      }
      
      const updatedUser = await storage.updateUserDetails(userId, { firstName, lastName, email });
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user details:', error);
      res.status(500).json({ message: 'Failed to update user details' });
    }
  });

  // Reset user password
  app.post('/api/super-admin/users/:userId/reset-password', requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      
      await storage.resetUserPassword(userId, newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting user password:', error);
      res.status(500).json({ message: 'Failed to reset user password' });
    }
  });

  // Delete user
  app.delete('/api/super-admin/users/:userId', requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      await storage.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Deactivate/activate user
  app.patch('/api/super-admin/users/:userId/status', requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      const updatedUser = await storage.updateUserStatus(userId, isActive);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // Get system statistics
  // Super Admin Audit Logs
  app.get('/api/super-admin/audit-logs', requireSuperAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const { userId, action, severity, startDate, endDate } = req.query;

      const options: any = { page, limit };
      if (userId) options.userId = userId;
      if (action && action !== 'all') options.action = action;
      if (severity && severity !== 'all') options.severity = severity;
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const result = await storage.getAuditLogs(options);
      res.json(result);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  app.get('/api/super-admin/stats', requireSuperAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ message: 'Failed to fetch system stats' });
    }
  });

  // Get audit logs
  app.get('/api/super-admin/audit-logs', requireSuperAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const logs = await storage.getAuditLogs({ page, limit });
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Delete user (soft delete)
  app.delete('/api/super-admin/users/:userId', requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      
      // Prevent self-deletion
      if (userId === currentUserId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Reset user password (super admin only)
  app.post('/api/super-admin/users/:userId/reset-password', requireSuperAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      
      await storage.resetUserPassword(userId, newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // System Settings API Endpoints
  app.get('/api/super-admin/system-settings', requireSuperAdmin, async (req: any, res) => {
    try {
      // Default system settings structure
      const defaultSettings = {
        maintenanceMode: {
          enabled: false,
          message: "We're currently performing maintenance. Please check back later.",
          estimatedEnd: ""
        },
        platform: {
          siteName: "Wonderful Books",
          siteDescription: "Your premium digital reading platform",
          allowRegistration: true,
          requireEmailVerification: true,
          maxUsersPerPlan: {
            free: 1000,
            basic: 5000,
            premium: 10000
          }
        },
        security: {
          sessionTimeout: 1440, // 24 hours in minutes
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireStrongPasswords: true,
          enableTwoFactor: false
        },
        email: {
          fromName: process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || "Wonderful Books",
          fromEmail: process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@wonderfulbooks.com",
          smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
          smtpPort: parseInt(process.env.SMTP_PORT || "587"),
          smtpSecure: parseInt(process.env.SMTP_PORT || "587") === 465 || process.env.SMTP_SECURE === 'true',
          welcomeEmailEnabled: true,
          reminderEmailsEnabled: true
        },
        features: {
          enableAnalytics: true,
          enableCopyProtection: true,
          enableDeviceLimit: true,
          maxDevicesPerUser: 3,
          enableOfflineMode: false
        },
        performance: {
          cacheTimeout: 300, // 5 minutes
          maxConcurrentReads: 10,
          enableRateLimiting: true,
          rateLimitRequests: 200,
          rateLimitWindow: 15 // minutes
        }
      };

      // In a real implementation, you would fetch these from database
      // For now, return the default settings
      res.json(defaultSettings);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({ message: 'Failed to fetch system settings' });
    }
  });

  app.put('/api/super-admin/system-settings', requireSuperAdmin, async (req: any, res) => {
    try {
      const settings = req.body;
      
      // In a real implementation, you would save these to database
      // For now, just return success
      console.log('System settings updated:', settings);
      
      res.json({ 
        message: 'System settings updated successfully',
        settings 
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      res.status(500).json({ message: 'Failed to update system settings' });
    }
  });

  app.post('/api/super-admin/test-email', requireSuperAdmin, async (req: any, res) => {
    try {
      // In a real implementation, you would test the email configuration
      // For now, just simulate success
      console.log('Testing email configuration...');
      
      // Simulate email test
      setTimeout(() => {
        console.log('Email test completed successfully');
      }, 1000);
      
      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      console.error('Error testing email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  app.post('/api/super-admin/clear-cache', requireSuperAdmin, async (req: any, res) => {
    try {
      // In a real implementation, you would clear the actual cache
      console.log('Clearing system cache...');
      
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ message: 'Failed to clear cache' });
    }
  });

  // Admin image upload route
  app.post('/api/admin/upload-image', requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // For now, we'll save to a simple uploads directory
      // In production, you'd want to use cloud storage
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, req.file.buffer);

      const imageUrl = `/uploads/${fileName}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Serve uploaded files with proper subdirectory support
  app.get('/uploads/:subfolder?/:filename?', (req, res) => {
    const subfolder = req.params.subfolder;
    const filename = req.params.filename;
    
    let filePath;
    if (subfolder && filename) {
      // Two-level path: /uploads/images/file.jpg
      filePath = path.join(process.cwd(), 'uploads', subfolder, filename);
    } else if (subfolder) {
      // Single-level path: /uploads/file.jpg
      filePath = path.join(process.cwd(), 'uploads', subfolder);
    } else {
      return res.status(404).json({ error: 'File path not specified' });
    }
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  // Admin routes
  app.get('/api/admin/books', requireAdmin, async (req: any, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching books for admin:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Delete a book (admin)
  app.delete("/api/admin/books/:id", requireAdmin, async (req: any, res) => {
    try {
      const bookId = req.params.id;
      await storage.deleteBook(bookId);
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Bulk delete books (admin)
  app.post("/api/admin/books/bulk-delete", requireAdmin, async (req: any, res) => {
    try {
      const { bookIds } = req.body;
      if (!Array.isArray(bookIds) || bookIds.length === 0) {
        return res.status(400).json({ message: "Book IDs array is required" });
      }

      const result = await storage.deleteMultipleBooks(bookIds);
      res.json({ 
        message: `${result.totalDeleted} book(s) deleted successfully`,
        totalDeleted: result.totalDeleted,
        deletedBooks: result.deletedBooks
      });
    } catch (error) {
      console.error("Error bulk deleting books:", error);
      res.status(500).json({ message: "Failed to delete books" });
    }
  });

  app.get('/api/admin/analytics', requireAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin subscription plan routes
  app.get("/api/admin/subscription-plans", requireAdmin, async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/admin/subscription-plans/:id", requireAdmin, async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      res.status(500).json({ error: "Failed to fetch subscription plan" });
    }
  });

  app.post("/api/admin/subscription-plans", requireAdmin, async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  app.put("/api/admin/subscription-plans/:id", requireAdmin, async (req, res) => {
    try {
      const plan = await storage.updateSubscriptionPlan(req.params.id, req.body);
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/subscription-plans/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSubscriptionPlan(req.params.id);
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  // Create new book with enhanced features
  app.post('/api/admin/books', requireAdmin, async (req: any, res) => {
    try {
      const { categories, ...bookData } = req.body;
      
      // Convert rating to string if it's a number for proper validation
      if (typeof bookData.rating === 'number') {
        bookData.rating = bookData.rating.toString();
      }
      
      // Map frontend fields to backend schema
      const mappedData = {
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        coverImageUrl: bookData.coverImage,
        pdfUrl: bookData.fileUrl,
        rating: bookData.rating,
        requiredTier: bookData.tier,
      };
      
      const validatedData = insertBookSchema.parse(mappedData);
      const book = await storage.createBook(validatedData, categories || []);
      res.json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      console.error("Validation error details:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  // Image upload route for admin
  app.post('/api/admin/upload-image', requireAdmin, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads/images');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, req.file.buffer);

      const imageUrl = `/uploads/images/${fileName}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  app.post('/api/admin/upload-pdf', requireAdmin, upload.single('pdf'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads/pdfs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, req.file.buffer);

      const fileUrl = `/uploads/pdfs/${fileName}`;
      res.json({ fileUrl });
    } catch (error) {
      console.error('PDF upload error:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  app.patch('/api/admin/books/:id', requireAdmin, async (req: any, res) => {
    try {
      const bookId = req.params.id;
      const { categories, ...updates } = req.body;
      const book = await storage.updateBook(bookId, updates, categories);
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.patch('/api/admin/books/bulk', requireAdmin, async (req: any, res) => {
    try {
      const { bookIds, updates } = req.body;
      await storage.bulkUpdateBooks(bookIds, updates);
      res.json({ message: "Books updated successfully" });
    } catch (error) {
      console.error("Error bulk updating books:", error);
      res.status(500).json({ message: "Failed to update books" });
    }
  });

  // Toggle featured status
  app.patch('/api/admin/books/:id/featured', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;
      
      const book = await storage.toggleFeatured(id, isFeatured);
      res.json(book);
    } catch (error) {
      console.error('Error toggling featured status:', error);
      res.status(500).json({ message: 'Failed to toggle featured status' });
    }
  });

  // Delete single book
  app.delete('/api/admin/books/:id', requireAdmin, async (req: any, res) => {
    try {
      const bookId = req.params.id;
      const result = await storage.deleteBook(bookId);
      
      // Delete associated files
      if (result.book) {
        const deleteFileIfExists = (filePath: string) => {
          try {
            const fullPath = path.join(process.cwd(), filePath.startsWith('/') ? filePath.substring(1) : filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log(`Deleted file: ${fullPath}`);
            }
          } catch (error) {
            console.error(`Failed to delete file ${filePath}:`, error);
          }
        };

        // Delete cover image and PDF file
        if (result.book.coverImageUrl) {
          deleteFileIfExists(result.book.coverImageUrl);
        }
        if (result.book.pdfUrl) {
          deleteFileIfExists(result.book.pdfUrl);
        }
      }

      res.json({ 
        message: "Book deleted successfully", 
        deletedBook: result.book,
        filesDeleted: result.filesDeleted 
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Delete multiple books
  app.delete('/api/admin/books/bulk', requireAdmin, async (req: any, res) => {
    try {
      const { bookIds } = req.body;
      
      if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
        return res.status(400).json({ message: "No book IDs provided" });
      }

      const result = await storage.deleteMultipleBooks(bookIds);
      
      // Delete associated files for all successfully deleted books
      const deleteFileIfExists = (filePath: string) => {
        try {
          const fullPath = path.join(process.cwd(), filePath.startsWith('/') ? filePath.substring(1) : filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted file: ${fullPath}`);
          }
        } catch (error) {
          console.error(`Failed to delete file ${filePath}:`, error);
        }
      };

      result.deletedBooks.forEach(book => {
        if (book) {
          if (book.coverImageUrl) {
            deleteFileIfExists(book.coverImageUrl);
          }
          if (book.pdfUrl) {
            deleteFileIfExists(book.pdfUrl);
          }
        }
      });

      res.json({ 
        message: `Successfully deleted ${result.totalDeleted} book(s)`,
        totalDeleted: result.totalDeleted,
        deletedBooks: result.deletedBooks.filter(book => book !== undefined)
      });
    } catch (error) {
      console.error("Error bulk deleting books:", error);
      res.status(500).json({ message: "Failed to delete books" });
    }
  });

  // Admin anti-abuse monitoring routes
  app.get('/api/admin/abuse-stats', requireAdmin, async (req, res) => {
    try {
      const stats = await antiAbuseService.getAbuseStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching abuse statistics:", error);
      res.status(500).json({ message: "Failed to fetch abuse statistics" });
    }
  });

  app.post('/api/admin/cleanup-abuse-records', requireAdmin, async (req, res) => {
    try {
      await antiAbuseService.cleanupOldRecords();
      res.json({ message: "Old abuse records cleaned up successfully" });
    } catch (error) {
      console.error("Error cleaning up abuse records:", error);
      res.status(500).json({ message: "Failed to cleanup abuse records" });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const { search } = req.query;
      let users;
      
      if (search) {
        users = await storage.searchUsers(search as string);
      } else {
        users = await storage.getAllUsers();
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, subscriptionTier, subscriptionStatus, isActive } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create new user with manual data
      const userData = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email,
        firstName,
        lastName,
        role: role || "user",
        subscriptionTier: subscriptionTier || "free",
        subscriptionStatus: subscriptionStatus || "active",
        isActive: isActive !== undefined ? isActive : true,
        profileImageUrl: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        booksReadThisMonth: 0,
        lastLoginAt: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const user = await storage.createManualUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = (req.user as any)?.claims?.sub;
      
      // Prevent self-deletion
      if (id === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch('/api/admin/users/bulk', requireAdmin, async (req, res) => {
    try {
      const { userIds, updates } = req.body;
      const currentUserId = (req.user as any)?.claims?.sub;
      
      // Prevent updating own account if role change
      if (updates.role && userIds.includes(currentUserId)) {
        return res.status(400).json({ message: "Cannot modify your own role" });
      }
      
      await storage.bulkUpdateUsers(userIds, updates);
      res.json({ message: "Users updated successfully" });
    } catch (error) {
      console.error("Error bulk updating users:", error);
      res.status(500).json({ message: "Failed to update users" });
    }
  });

  app.delete('/api/admin/users/bulk', requireAdmin, async (req, res) => {
    try {
      const { userIds } = req.body;
      const currentUserId = (req.user as any)?.claims?.sub;
      
      // Prevent self-deletion
      if (userIds.includes(currentUserId)) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.bulkDeleteUsers(userIds);
      res.json({ message: "Users deleted successfully" });
    } catch (error) {
      console.error("Error bulk deleting users:", error);
      res.status(500).json({ message: "Failed to delete users" });
    }
  });

  app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword, sendEmail } = req.body;
      
      const result = await storage.resetUserPassword(id, newPassword);
      
      if (sendEmail) {
        // In a real application, you would send an email here
        console.log(`Password reset for user ${id}. Temp password: ${result.tempPassword}`);
      }
      
      res.json({ 
        message: "Password reset successfully",
        tempPassword: result.tempPassword
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.patch('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const currentUserId = (req.user as any)?.claims?.sub;
      
      // Prevent changing own role
      if (id === currentUserId) {
        return res.status(400).json({ message: "Cannot modify your own role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/admin/users/:id/status', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await storage.updateUserStatus(id, isActive);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Super admin subscription management
  app.patch('/api/super-admin/users/:id/subscription', requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { tier, status, stripeCustomerId, stripeSubscriptionId, trialEndsAt, subscriptionEndsAt, nextBillingDate } = req.body;
      
      const subscriptionData: any = { tier, status };
      
      if (stripeCustomerId) subscriptionData.stripeCustomerId = stripeCustomerId;
      if (stripeSubscriptionId) subscriptionData.stripeSubscriptionId = stripeSubscriptionId;
      if (trialEndsAt) subscriptionData.trialEndsAt = new Date(trialEndsAt);
      if (subscriptionEndsAt) subscriptionData.subscriptionEndsAt = new Date(subscriptionEndsAt);
      if (nextBillingDate) subscriptionData.nextBillingDate = new Date(nextBillingDate);
      
      const user = await storage.updateUserSubscription(id, subscriptionData);
      
      // Log the action
      await storage.createAuditLog({
        userId: (req.user as any)?.claims?.sub || 'system',
        action: 'user_subscription_updated',
        resource: 'user',
        resourceId: id,
        details: { 
          oldTier: user.subscriptionTier, 
          newTier: tier,
          oldStatus: user.subscriptionStatus,
          newStatus: status,
          adminId: (req.user as any)?.claims?.sub 
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        status: 'success'
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user subscription:", error);
      res.status(500).json({ message: "Failed to update user subscription" });
    }
  });

  app.get('/api/admin/user-analytics', requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user already has an active subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.status === 'active') {
          const latestInvoice = subscription.latest_invoice as any;
          const paymentIntent = latestInvoice?.payment_intent as any;
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent?.client_secret,
          });
        }
      }

      if (!user.email) {
        throw new Error('No user email on file');
      }

      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        await storage.updateUserStripeInfo(userId, customer.id, '');
      }

      // Dynamic pricing - create products and prices as needed
      const tierConfig = {
        basic: { amount: 599, name: 'Basic Plan' }, // £5.99
        premium: { amount: 999, name: 'Premium Plan' } // £9.99
      };

      if (tier === 'free') {
        // Handle free tier - no Stripe subscription needed
        await storage.updateUserSubscription(userId, 'free', 'active');
        return res.json({ message: "Free trial activated" });
      }

      const config = tierConfig[tier as keyof typeof tierConfig];
      if (!config) {
        return res.status(400).json({ error: { message: 'Invalid tier' } });
      }

      // Create or get product
      const products = await stripe.products.list({
        limit: 100,
      });
      
      let product = products.data.find(p => p.name === config.name);
      if (!product) {
        product = await stripe.products.create({
          name: config.name,
          description: `Wonderful Books ${config.name}`,
        });
      }

      // Create or get price
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });
      
      let price = prices.data.find(p => p.unit_amount === config.amount && p.currency === 'gbp');
      if (!price) {
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: config.amount,
          currency: 'gbp',
          recurring: { interval: 'month' },
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);
      await storage.updateUserSubscription(userId, tier, 'pending');

      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent as any;
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // Stripe webhook for handling subscription events
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).send('Missing signature or webhook secret');
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          const subscription = event.data.object as Stripe.Subscription;
          
          // Find user by Stripe customer ID
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if (customer.deleted) break;
          
          const user = await storage.getUserByEmail((customer as Stripe.Customer).email!);
          if (!user) break;

          // Update subscription status
          const status = subscription.status === 'active' ? 'active' : 'inactive';
          const tier = subscription.items.data[0]?.price?.unit_amount === 599 ? 'basic' : 'premium';
          
          await storage.updateUserSubscription(user.id, tier, status);

          // Send conversion success email for new active subscriptions
          if (subscription.status === 'active' && event.type === 'customer.subscription.created') {
            try {
              const { emailScheduler } = await import('./emailScheduler');
              const planName = tier === 'basic' ? 'Basic Plan' : 'Premium Plan';
              const planPrice = tier === 'basic' ? '£5.99/month' : '£9.99/month';
              
              await emailScheduler.sendConversionEmail(user.id, planName, planPrice);
            } catch (error) {
              console.error('Failed to send conversion email:', error);
            }
          }
          break;
        
        case 'customer.subscription.deleted':
          const cancelledSubscription = event.data.object as Stripe.Subscription;
          
          // Find user by Stripe customer ID
          const cancelledCustomer = await stripe.customers.retrieve(cancelledSubscription.customer as string);
          if (cancelledCustomer.deleted) break;
          
          const cancelledUser = await storage.getUserByEmail((cancelledCustomer as Stripe.Customer).email!);
          if (!cancelledUser) break;

          // Update subscription status to cancelled
          await storage.updateUserSubscription(cancelledUser.id, 'free', 'cancelled');

          // Send cancellation confirmation email
          try {
            const { emailScheduler } = await import('./emailScheduler');
            const previousTier = cancelledUser.subscriptionTier === 'basic' ? 'Basic Plan' : 'Premium Plan';
            const endDate = (cancelledSubscription as any).current_period_end 
              ? new Date((cancelledSubscription as any).current_period_end * 1000).toLocaleDateString()
              : 'your subscription end date';
            
            await emailScheduler.sendCancellationEmail(cancelledUser.id, previousTier, endDate);
          } catch (error) {
            console.error('Failed to send cancellation email:', error);
          }
          break;

        case 'invoice.payment_succeeded':
          // Optional: Send receipt or renewal confirmation emails
          break;

        case 'invoice.payment_failed':
          // Optional: Send payment failure notification emails
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });



  // Secure PDF streaming endpoint
  // Generate temporary access token for PDF streaming
  app.post("/api/pdf-token/:bookId", isAuthenticated, async (req: any, res) => {
    try {
      const { bookId } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id;
      
      console.log('PDF token request - User object:', req.user);
      console.log('PDF token request - Session:', req.session?.user);
      console.log('PDF token request - User ID:', userId, 'Book:', bookId);
      
      if (!userId) {
        console.log('No user ID found in request');
        return res.status(401).json({ message: "User ID not found" });
      }

      // Get book details to verify access
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check subscription tier access
      const userTier = user?.subscriptionTier || 'free';
      const canAccess = checkBookAccess(userTier, book.requiredTier || 'free');
      
      if (!canAccess) {
        return res.status(403).json({ 
          message: `This book requires ${book.requiredTier} subscription. Your current tier: ${userTier}`,
          requiredTier: book.requiredTier,
          currentTier: userTier
        });
      }

      // Create temporary access token (simple approach for demo)
      const token = `${userId}-${bookId}-${Date.now()}`;
      const tokenKey = `pdf_token_${token}`;
      
      // Store token in memory with 5-minute expiry (in production, use Redis or database)
      if (!(global as any).pdfTokens) (global as any).pdfTokens = new Map();
      const expiryTime = Date.now() + 5 * 60 * 1000;
      (global as any).pdfTokens.set(tokenKey, { userId, bookId, expires: expiryTime });
      
      console.log(`Generated PDF token ${tokenKey} for book ${bookId}, expires: ${new Date(expiryTime)}`);
      res.json({ token });
    } catch (error: any) {
      console.error("Error generating PDF token:", error);
      res.status(500).json({ message: "Failed to generate access token" });
    }
  });

  app.get("/api/stream/:bookId", isAuthenticated, async (req: any, res) => {
    try {
      const { bookId } = req.params;
      const userId = req.user.claims.sub;

      // Get book details
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check subscription tier access
      const userTier = user?.subscriptionTier || 'free';
      const canAccess = checkBookAccess(userTier, book.requiredTier || 'free');
      
      if (!canAccess) {
        return res.status(403).json({ 
          message: `This book requires ${book.requiredTier} subscription. Your current tier: ${userTier}`,
          requiredTier: book.requiredTier,
          currentTier: userTier
        });
      }

      // Stream the actual PDF file from the book's pdfUrl
      if (!book.pdfUrl) {
        return res.status(404).json({ message: "PDF file not available for this book" });
      }

      // For files served via /uploads/, serve directly from file system
      if (book.pdfUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), book.pdfUrl.substring(1)); // Remove leading slash
        
        if (!fs.existsSync(filePath)) {
          console.error('PDF file not found:', filePath);
          return res.status(404).json({ message: "PDF file not found" });
        }

        // Set proper PDF headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Stream the actual PDF file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
      }

      // For external URLs, proxy the PDF content
      try {
        const response = await fetch(book.pdfUrl);
        if (!response.ok) {
          console.error('Failed to fetch PDF from URL:', book.pdfUrl, response.status);
          return res.status(404).json({ message: "PDF file not accessible" });
        }

        const pdfBuffer = await response.arrayBuffer();
        
        // Set proper PDF headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Stream the actual PDF content
        res.send(Buffer.from(pdfBuffer));
      } catch (error) {
        console.error('Error fetching PDF from URL:', error);
        return res.status(500).json({ message: "Failed to load PDF file" });
      }
      
    } catch (error: any) {
      console.error("Error streaming PDF:", error);
      res.status(500).json({ message: "Failed to stream PDF" });
    }
  });

  // Token-based PDF streaming (no authentication middleware)
  app.get("/api/stream-token/:token/:bookId", async (req, res) => {
    try {
      const { token, bookId } = req.params;
      const tokenKey = `pdf_token_${token}`;

      // Check if token exists and is valid
      if (!(global as any).pdfTokens) (global as any).pdfTokens = new Map();
      const tokenData = (global as any).pdfTokens.get(tokenKey);
      
      if (!tokenData) {
        console.log(`Token not found: ${tokenKey}`);
        return res.status(401).json({ message: "Token not found" });
      }
      
      if (tokenData.expires < Date.now()) {
        console.log(`Token expired: ${tokenKey}, expired ${new Date(tokenData.expires)}`);
        (global as any).pdfTokens.delete(tokenKey);
        return res.status(401).json({ message: "Token expired" });
      }
      
      if (tokenData.bookId !== bookId) {
        console.log(`Token book mismatch: expected ${bookId}, got ${tokenData.bookId}`);
        return res.status(401).json({ message: "Token book mismatch" });
      }

      // Get book details
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Stream the actual PDF file from the book's pdfUrl
      if (!book.pdfUrl) {
        return res.status(404).json({ message: "PDF file not available for this book" });
      }

      // For files served via /uploads/, serve directly from file system
      if (book.pdfUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), book.pdfUrl.substring(1)); // Remove leading slash
        
        if (!fs.existsSync(filePath)) {
          console.error('PDF file not found:', filePath);
          return res.status(404).json({ message: "PDF file not found" });
        }

        // Set proper PDF headers with CORS
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        console.log(`PDF token ${tokenKey} used successfully for book ${bookId}`);
        
        // Stream the actual PDF file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
      }

      // For external URLs, proxy the PDF content
      try {
        const response = await fetch(book.pdfUrl);
        if (!response.ok) {
          console.error('Failed to fetch PDF from URL:', book.pdfUrl, response.status);
          return res.status(404).json({ message: "PDF file not accessible" });
        }

        const pdfBuffer = await response.arrayBuffer();
        
        // Set proper PDF headers with CORS
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        console.log(`PDF token ${tokenKey} used successfully for book ${bookId}`);
        
        // Stream the actual PDF content
        res.send(Buffer.from(pdfBuffer));
      } catch (error) {
        console.error('Error fetching PDF from URL:', error);
        return res.status(500).json({ message: "Failed to load PDF file" });
      }
      
    } catch (error: any) {
      console.error("Error streaming PDF with token:", error);
      res.status(500).json({ message: "Failed to stream PDF" });
    }
  });

  // Category management routes (admin only)
  app.get('/api/admin/categories', requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/admin/categories', requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
      const updates = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Public category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getActiveCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching active categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Book Selection API endpoints for Netflix-style book locking
  
  // Get user's currently selected books
  app.get('/api/user/selected-books', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bookSelectionService } = await import("./bookSelectionService");
      const selectedBooks = await bookSelectionService.getUserSelectedBooks(userId);
      res.json(selectedBooks);
    } catch (error) {
      console.error("Error fetching selected books:", error);
      res.status(500).json({ message: "Failed to fetch selected books" });
    }
  });

  // Check if user can select more books
  app.get('/api/user/can-select-books', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bookSelectionService } = await import("./bookSelectionService");
      const canSelect = await bookSelectionService.canSelectMoreBooks(userId);
      res.json(canSelect);
    } catch (error) {
      console.error("Error checking book selection availability:", error);
      res.status(500).json({ message: "Failed to check book selection" });
    }
  });

  // Select a book (Free Trial: 7 days, Basic: 30 days cycle)
  app.post('/api/user/select-book', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bookId } = req.body;
      
      if (!bookId) {
        return res.status(400).json({ message: "Book ID is required" });
      }

      const { bookSelectionService } = await import("./bookSelectionService");
      const result = await bookSelectionService.selectBook(userId, bookId);
      
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error selecting book:", error);
      res.status(500).json({ message: "Failed to select book" });
    }
  });

  // Check if user has access to a specific book
  app.get('/api/user/book-access/:bookId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bookId } = req.params;
      
      const { bookSelectionService } = await import("./bookSelectionService");
      const hasAccess = await bookSelectionService.hasBookAccess(userId, bookId);
      res.json({ hasAccess });
    } catch (error) {
      console.error("Error checking book access:", error);
      res.status(500).json({ message: "Failed to check book access" });
    }
  });

  // Get available books for selection (excluding already selected)
  app.get('/api/user/available-books', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { bookSelectionService } = await import("./bookSelectionService");
      const availableBooks = await bookSelectionService.getAvailableBooksForSelection(userId);
      res.json(availableBooks);
    } catch (error) {
      console.error("Error fetching available books:", error);
      res.status(500).json({ message: "Failed to fetch available books" });
    }
  });

  // Admin endpoint to reset basic user's books (for testing billing cycles)
  app.post('/api/admin/reset-user-books/:userId', requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { bookSelectionService } = await import("./bookSelectionService");
      await bookSelectionService.resetBasicUserBooks(userId);
      res.json({ message: "User books reset successfully" });
    } catch (error) {
      console.error("Error resetting user books:", error);
      res.status(500).json({ message: "Failed to reset user books" });
    }
  });

  // Cleanup expired selections (should be run by a cron job in production)
  app.post('/api/admin/cleanup-expired', requireAdmin, async (req: any, res) => {
    try {
      const { bookSelectionService } = await import("./bookSelectionService");
      await bookSelectionService.expireOldSelections();
      res.json({ message: "Expired selections cleaned up successfully" });
    } catch (error) {
      console.error("Error cleaning up expired selections:", error);
      res.status(500).json({ message: "Failed to cleanup expired selections" });
    }
  });

  // Email automation routes
  
  // Unsubscribe route (public access)
  app.get('/unsubscribe', async (req: any, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).send(`
          <html>
            <head><title>Invalid Unsubscribe Link</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Invalid Unsubscribe Link</h1>
              <p>The unsubscribe link is invalid or has expired.</p>
            </body>
          </html>
        `);
      }

      const preferences = await storage.findEmailPreferencesByToken(token);
      
      if (!preferences) {
        return res.status(404).send(`
          <html>
            <head><title>Unsubscribe Link Not Found</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Link Not Found</h1>
              <p>This unsubscribe link was not found or has already been used.</p>
            </body>
          </html>
        `);
      }

      // Update preferences to unsubscribe from all emails
      await storage.updateEmailPreferences(preferences.userId, {
        isUnsubscribedAll: true,
      });

      res.send(`
        <html>
          <head>
            <title>Successfully Unsubscribed - Wonderful Books</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }
              .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { color: #28a745; font-size: 48px; margin-bottom: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; margin-bottom: 15px; }
              .brand { color: #ff6600; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✅</div>
              <h1>Successfully Unsubscribed</h1>
              <p>You have been unsubscribed from all <span class="brand">Wonderful Books</span> emails.</p>
              <p>We're sorry to see you go! If you change your mind, you can update your email preferences in your account settings.</p>
              <p>Thank you for being part of our reading community.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error processing unsubscribe:', error);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Error</h1>
            <p>An error occurred while processing your request. Please try again later.</p>
          </body>
        </html>
      `);
    }
  });

  // Email preferences management (authenticated users)
  app.get('/api/email-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const preferences = await storage.getEmailPreferences(userId, req.user.email);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      res.status(500).json({ message: 'Failed to fetch email preferences' });
    }
  });

  app.put('/api/email-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      // Validate updates
      const validKeys = ['marketingEmails', 'trialReminders', 'subscriptionUpdates', 'isUnsubscribedAll'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => validKeys.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      await storage.updateEmailPreferences(userId, filteredUpdates);
      res.json({ message: 'Email preferences updated successfully' });
    } catch (error) {
      console.error('Error updating email preferences:', error);
      res.status(500).json({ message: 'Failed to update email preferences' });
    }
  });

  // Admin email management routes
  
  // Email scheduler status
  app.get('/api/admin/email-scheduler/status', requireAdmin, async (req: any, res) => {
    try {
      const { emailScheduler } = await import('./emailScheduler');
      const status = emailScheduler.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting email scheduler status:', error);
      res.status(500).json({ message: 'Failed to get scheduler status' });
    }
  });

  // Manually trigger trial reminder
  app.post('/api/admin/email-scheduler/trigger-trial-reminder', requireAdmin, async (req: any, res) => {
    try {
      const { daysFromNow } = req.body;
      
      if (!daysFromNow || ![1, 3].includes(parseInt(daysFromNow))) {
        return res.status(400).json({ message: 'daysFromNow must be 1 or 3' });
      }

      const { emailScheduler } = await import('./emailScheduler');
      const results = await emailScheduler.triggerTrialReminderManually(parseInt(daysFromNow));
      
      res.json({
        message: `Trial reminder campaign completed`,
        results
      });
    } catch (error) {
      console.error('Error triggering trial reminder:', error);
      res.status(500).json({ message: 'Failed to trigger trial reminder' });
    }
  });

  // Email logs for admin
  app.get('/api/admin/email-logs', requireAdmin, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0, status, emailType } = req.query;
      const logs = await storage.getEmailLogs({
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        status: status as string,
        emailType: emailType as string,
      });
      res.json(logs);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({ message: 'Failed to fetch email logs' });
    }
  });

  // Email preview for development/testing
  app.get('/api/admin/email-preview/:templateType', requireAdmin, async (req: any, res) => {
    try {
      const { templateType } = req.params;
      const { firstName = 'John', lastName = 'Doe', email = 'preview@example.com' } = req.query;
      
      const { emailService } = await import('./emailService');
      const preview = await emailService.generateEmailPreview(templateType, {
        firstName: firstName as string,
        lastName: lastName as string,
        email: email as string,
      });
      
      // Return HTML by default, add ?format=text for text version
      const format = req.query.format === 'text' ? 'text' : 'html';
      res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/plain');
      res.send(preview[format]);
    } catch (error) {
      console.error('Error generating email preview:', error);
      res.status(500).json({ message: 'Failed to generate email preview' });
    }
  });

  // Testing & QA API routes
  app.post('/api/testing/integration', requireSuperAdmin, async (req, res) => {
    try {
      const { runIntegrationTests } = await import('./test-automation');
      const results = await runIntegrationTests(req, res);
    } catch (error) {
      console.error('Failed to run integration tests:', error);
      res.status(500).json({ error: 'Failed to run integration tests' });
    }
  });

  app.post('/api/testing/accessibility', requireSuperAdmin, async (req, res) => {
    try {
      const { runAccessibilityTests } = await import('./test-automation');
      const results = await runAccessibilityTests(req, res);
    } catch (error) {
      console.error('Failed to run accessibility tests:', error);
      res.status(500).json({ error: 'Failed to run accessibility tests' });
    }
  });

  app.post('/api/testing/performance', requireSuperAdmin, async (req, res) => {
    try {
      const { runPerformanceTests } = await import('./test-automation');
      const results = await runPerformanceTests(req, res);
    } catch (error) {
      console.error('Failed to run performance tests:', error);
      res.status(500).json({ error: 'Failed to run performance tests' });
    }
  });

  app.get('/api/testing/results/:suiteId?', requireSuperAdmin, async (req, res) => {
    try {
      const { getTestResults } = await import('./test-automation');
      await getTestResults(req, res);
    } catch (error) {
      console.error('Failed to get test results:', error);
      res.status(500).json({ error: 'Failed to get test results' });
    }
  });

  // Testing & QA API routes
  app.post('/api/testing/integration', requireSuperAdmin, async (req, res) => {
    try {
      const { runIntegrationTests } = await import('./test-automation');
      const results = await runIntegrationTests(req, res);
    } catch (error) {
      console.error('Failed to run integration tests:', error);
      res.status(500).json({ error: 'Failed to run integration tests' });
    }
  });

  app.post('/api/testing/accessibility', requireSuperAdmin, async (req, res) => {
    try {
      const { runAccessibilityTests } = await import('./test-automation');
      const results = await runAccessibilityTests(req, res);
    } catch (error) {
      console.error('Failed to run accessibility tests:', error);
      res.status(500).json({ error: 'Failed to run accessibility tests' });
    }
  });

  app.post('/api/testing/performance', requireSuperAdmin, async (req, res) => {
    try {
      const { runPerformanceTests } = await import('./test-automation');
      const results = await runPerformanceTests(req, res);
    } catch (error) {
      console.error('Failed to run performance tests:', error);
      res.status(500).json({ error: 'Failed to run performance tests' });
    }
  });

  app.get('/api/testing/results/:suiteId?', requireSuperAdmin, async (req, res) => {
    try {
      const { getTestResults } = await import('./test-automation');
      await getTestResults(req, res);
    } catch (error) {
      console.error('Failed to get test results:', error);
      res.status(500).json({ error: 'Failed to get test results' });
    }
  });

  // Register SEO routes


  // ===== SOCIAL READING CHALLENGES ROUTES =====

  // Get all public challenges
  app.get('/api/challenges', async (req, res) => {
    try {
      const challenges = await storage.getActivePublicChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  // Get challenge details with participants
  app.get('/api/challenges/:id', async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      const participants = await storage.getChallengeParticipants(req.params.id);
      const activities = await storage.getChallengeActivities(req.params.id, 20);
      const comments = await storage.getChallengeComments(req.params.id);
      
      res.json({
        ...challenge,
        participants,
        activities,
        comments,
        participantCount: participants.length
      });
    } catch (error) {
      console.error("Error fetching challenge details:", error);
      res.status(500).json({ message: "Failed to fetch challenge details" });
    }
  });

  // Create new challenge (authenticated users)
  app.post('/api/challenges', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Creating challenge - Request body:', req.body);
      console.log('Creating challenge - User:', req.user);
      
      const { insertChallengeSchema } = await import("@shared/schema");
      const challengeData = insertChallengeSchema.parse(req.body);
      const userId = req.user.claims.sub || req.user.id;
      
      console.log('Creating challenge - Validated data:', challengeData);
      console.log('Creating challenge - User ID:', userId);
      
      const challenge = await storage.createChallenge(challengeData, userId);
      res.json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Challenge validation error:', error.errors);
        return res.status(400).json({ message: "Invalid challenge data", errors: error.errors });
      }
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge. Please try again." });
    }
  });

  // Join a challenge
  app.post('/api/challenges/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const participation = await storage.joinChallenge(req.params.id, userId);
      res.json(participation);
    } catch (error: any) {
      if (error.message === "Already participating in this challenge") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error joining challenge:", error);
      res.status(500).json({ message: "Failed to join challenge" });
    }
  });

  // Leave a challenge
  app.delete('/api/challenges/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.leaveChallenge(req.params.id, userId);
      res.json({ message: "Left challenge successfully" });
    } catch (error) {
      console.error("Error leaving challenge:", error);
      res.status(500).json({ message: "Failed to leave challenge" });
    }
  });

  // Update challenge progress
  app.put('/api/challenges/:id/progress', isAuthenticated, async (req: any, res) => {
    try {
      const { updateProgressSchema } = await import("@shared/schema");
      const progressData = updateProgressSchema.parse(req.body);
      const userId = req.user.claims.sub;
      
      const participation = await storage.updateChallengeProgress(req.params.id, userId, progressData);
      res.json(participation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      if (error.message === "Not participating in this challenge") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error updating challenge progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Get leaderboard for a challenge
  app.get('/api/challenges/:id/leaderboard', async (req, res) => {
    try {
      const leaderboard = await storage.getChallengeLeaderboard(req.params.id);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get user's participation status for a challenge
  app.get('/api/challenges/:id/participation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const participation = await storage.getUserChallengeParticipation(req.params.id, userId);
      res.json(participation);
    } catch (error) {
      console.error("Error fetching participation status:", error);
      res.status(500).json({ message: "Failed to fetch participation status" });
    }
  });

  // Get user's challenges (created by them)
  app.get('/api/user/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getUserChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ message: "Failed to fetch user challenges" });
    }
  });

  // Post comment on challenge
  app.post('/api/challenges/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const { insertCommentSchema } = await import("@shared/schema");
      const commentData = insertCommentSchema.parse({
        ...req.body,
        challengeId: req.params.id,
        userId: req.user.claims.sub
      });
      
      const comment = await storage.createChallengeComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Delete challenge comment (author only)
  app.delete('/api/challenges/comments/:commentId', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteChallengeComment(req.params.commentId);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Like challenge comment
  app.post('/api/challenges/comments/:commentId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const comment = await storage.likeChallengeComment(req.params.commentId, userId);
      res.json(comment);
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ message: "Failed to like comment" });
    }
  });

  // Public feedback stats endpoint (for admin panel)
  app.get('/api/feedback/stats', async (req, res) => {
    try {
      
      // Get various statistics
      const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback);
      const [openCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback).where(eq(feedback.status, 'open'));
      const [bugCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback).where(eq(feedback.type, 'bug'));
      const [criticalCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback).where(eq(feedback.priority, 'critical'));

      // Get feedback by type
      const typeStats = await db
        .select({
          type: feedback.type,
          count: sql<number>`count(*)`
        })
        .from(feedback)
        .groupBy(feedback.type);

      // Get feedback by status
      const statusStats = await db
        .select({
          status: feedback.status,
          count: sql<number>`count(*)`
        })
        .from(feedback)
        .groupBy(feedback.status);

      res.json({
        success: true,
        stats: {
          total: totalCount.count,
          open: openCount.count,
          bugs: bugCount.count,
          critical: criticalCount.count,
          byType: typeStats,
          byStatus: statusStats
        }
      });
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch feedback statistics"
      });
    }
  });

  // ============================================================================
  // FEEDBACK MANAGEMENT ROUTES
  // ============================================================================
  
  // Submit new feedback (public endpoint - no auth required)
  app.post('/api/feedback', async (req, res) => {
    try {
      // Validate the input
      const validatedData = insertFeedbackSchema.parse({
        ...req.body,
        userId: (req.session as any)?.user?.id || null, // Optional user ID from session
        status: 'open', // Default status for new feedback
      });

      // Insert feedback into database
      const [newFeedback] = await db
        .insert(feedback)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        feedback: newFeedback,
        message: "Feedback submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to submit feedback"
      });
    }
  });

  // Get all feedback (temporarily public for testing)
  app.get('/api/feedback', async (req, res) => {
    try {
      const { status, type, priority, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions
      const whereConditions = [];
      if (status) whereConditions.push(eq(feedback.status, status as string));
      if (type) whereConditions.push(eq(feedback.type, type as string));
      if (priority) whereConditions.push(eq(feedback.priority, priority as string));

      // Get feedback with user information
      const feedbackList = await db
        .select({
          feedback: feedback,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(feedback.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(feedback)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      res.json({
        success: true,
        feedback: feedbackList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch feedback"
      });
    }
  });

  // Get single feedback with comments (admin only)
  app.get('/api/feedback/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Get feedback with user info
      const [feedbackItem] = await db
        .select({
          feedback: feedback,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.id))
        .where(eq(feedback.id, id));

      if (!feedbackItem) {
        return res.status(404).json({
          success: false,
          error: "Feedback not found"
        });
      }

      // Get comments
      const comments = await db
        .select({
          comment: feedbackComments,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(feedbackComments)
        .leftJoin(users, eq(feedbackComments.userId, users.id))
        .where(eq(feedbackComments.feedbackId, id))
        .orderBy(feedbackComments.createdAt);

      res.json({
        success: true,
        feedback: feedbackItem.feedback,
        user: feedbackItem.user,
        comments
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch feedback"
      });
    }
  });

  // Update feedback status (admin only)
  app.patch('/api/feedback/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      const updateData: any = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (adminResponse) {
        updateData.adminResponse = adminResponse;
        updateData.adminResponseBy = (req as any).user.id;
        updateData.adminResponseAt = new Date();
      }

      const [updatedFeedback] = await db
        .update(feedback)
        .set(updateData)
        .where(eq(feedback.id, id))
        .returning();

      if (!updatedFeedback) {
        return res.status(404).json({
          success: false,
          error: "Feedback not found"
        });
      }

      res.json({
        success: true,
        feedback: updatedFeedback,
        message: "Feedback updated successfully"
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({
        success: false,
        error: "Failed to update feedback"
      });
    }
  });

  // Add comment to feedback (admin only)
  app.post('/api/feedback/:id/comments', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertFeedbackCommentSchema.parse({
        ...req.body,
        feedbackId: id,
        userId: (req as any).user.id,
      });

      const [newComment] = await db
        .insert(feedbackComments)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        comment: newComment,
        message: "Comment added successfully"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        error: "Failed to add comment"
      });
    }
  });

  // ============================================================================
  // SEO AND SITEMAP ROUTES
  // ============================================================================
  
  // Serve sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
  });
  
  // Serve robots.txt
  app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
  });
  
  // Dynamic sitemap generation endpoint (optional)
  app.get('/api/sitemap', async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      const baseUrl = 'https://wonderful-books.replit.app';
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/bookstore</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/subscribe</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

      // Add individual book pages
      books.forEach(book => {
        sitemap += `
  <url>
    <loc>${baseUrl}/book/${book.id}</loc>
    <lastmod>${book.updatedAt ? new Date(book.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
  
  // JSON-LD structured data endpoint for books
  app.get('/api/book/:id/structured-data', async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": book.title,
        "author": {
          "@type": "Person",
          "name": book.author
        },
        "description": book.description?.replace(/<[^>]*>/g, '').substring(0, 200) + "...",
        "image": book.coverImageUrl ? `https://wonderful-books.replit.app${book.coverImageUrl}` : undefined,
        "url": `https://wonderful-books.replit.app/book/${book.id}`,
        "aggregateRating": book.rating ? {
          "@type": "AggregateRating",
          "ratingValue": book.rating,
          "ratingCount": book.totalRatings || 1
        } : undefined,
        "offers": {
          "@type": "Offer",
          "price": book.requiredTier === 'premium' ? "19.99" : book.requiredTier === 'basic' ? "9.99" : "0",
          "priceCurrency": "GBP",
          "availability": "https://schema.org/InStock",
          "url": `https://wonderful-books.replit.app/book/${book.id}`
        },
        "inLanguage": "en-US",
        "genre": "Self-help, Business, Personal Development",
        "publishingPrinciples": "https://wonderful-books.replit.app/publishing-principles",
        "educationalAlignment": {
          "@type": "AlignmentObject",
          "alignmentType": "teaches",
          "educationalFramework": "Personal Development"
        }
      };
      
      res.json(structuredData);
    } catch (error) {
      console.error('Error generating structured data:', error);
      res.status(500).json({ error: 'Error generating structured data' });
    }
  });

  // Health monitoring routes
  app.use('/', healthRouter);
  app.use('/', healthzRouter);
  
  // Reports route with basic auth protection
  app.use('/reports', reportsAuth, express.static('reports'));

  // Book chunks route for encrypted content delivery
  app.get('/api/books/:bookId/chunks/:chunkIndex', isAuthenticated, async (req: any, res) => {
    try {
      const { bookId, chunkIndex } = req.params;
      const userId = req.user.id;
      
      // For now, return empty response until we implement full DRM
      // This is a placeholder for the encrypted chunk delivery system
      res.json({
        message: 'Encrypted chunk delivery system under development',
        chunkIndex: parseInt(chunkIndex),
        bookId
      });

    } catch (error) {
      console.error('Error fetching book chunk:', error);
      res.status(500).json({ message: 'Failed to fetch book chunk' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to check book access based on subscription tier
function checkBookAccess(userTier: string, requiredTier: string): boolean {
  const tierHierarchy = {
    'free': 0,
    'basic': 1,
    'premium': 2
  };
  
  const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] ?? 0;
  const requiredLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] ?? 0;
  
  return userLevel >= requiredLevel;
}

