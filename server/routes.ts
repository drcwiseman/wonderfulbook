import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // Reading progress routes
  app.get('/api/reading-progress/:bookId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getReadingProgress(userId, req.params.bookId);
      res.json(progress || { currentPage: 0, totalPages: 0, progressPercentage: "0.00" });
    } catch (error) {
      console.error("Error fetching reading progress:", error);
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  app.post('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressData = {
        ...req.body,
        userId,
        lastReadAt: new Date(),
      };
      const progress = await storage.upsertReadingProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating reading progress:", error);
      res.status(500).json({ message: "Failed to update reading progress" });
    }
  });

  // Bookmarks routes
  app.get('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId } = req.query;
      const bookmarks = await storage.getUserBookmarks(userId, bookId as string);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarkData = {
        ...req.body,
        userId,
      };
      const bookmark = await storage.createBookmark(bookmarkData);
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete('/api/bookmarks/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBookmark(req.params.id);
      res.json({ message: "Bookmark deleted successfully" });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
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

      // Price IDs for different tiers (these would need to be set up in Stripe Dashboard)
      const priceIds = {
        basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
        premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
      };

      if (tier === 'free') {
        // Handle free tier - no Stripe subscription needed
        await storage.updateUserSubscription(userId, 'free', 'active');
        return res.json({ message: "Free trial activated" });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceIds[tier as keyof typeof priceIds],
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
          // Update user subscription status based on Stripe event
          // This would need proper user lookup by customer ID
          break;
        
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Categories endpoint
  app.get('/api/categories', async (req, res) => {
    try {
      // Return predefined categories
      const categories = [
        { id: 'personal-development', name: 'Personal Development', icon: 'rocket' },
        { id: 'spirituality', name: 'Spirituality & Mindfulness', icon: 'om' },
        { id: 'business', name: 'Business & Finance', icon: 'chart-line' },
        { id: 'health', name: 'Health & Wellness', icon: 'heart' },
        { id: 'relationships', name: 'Relationships', icon: 'users' },
        { id: 'psychology', name: 'Psychology', icon: 'brain' },
      ];
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Secure PDF streaming endpoint
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
      const userTier = user.subscriptionTier || 'free';
      const canAccess = checkBookAccess(userTier, book.requiredTier);
      
      if (!canAccess) {
        return res.status(403).json({ 
          message: `This book requires ${book.requiredTier} subscription. Your current tier: ${userTier}`,
          requiredTier: book.requiredTier,
          currentTier: userTier
        });
      }

      // For demo purposes, we'll generate a sample PDF with the book content
      const pdfBuffer = await generateSamplePDF(book);
      
      // Set security headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline'); // Prevent download dialog
      
      // Stream the PDF buffer
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Error streaming PDF:", error);
      res.status(500).json({ message: "Failed to stream PDF" });
    }
  });

  // Serve test file for demonstration
  app.get('/test-reader', (req, res) => {
    res.sendFile(__dirname + '/../test-pdf-reader.html');
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

// Helper function to generate a sample PDF for demo purposes
async function generateSamplePDF(book: any): Promise<Buffer> {
  // In a real application, you would fetch the actual PDF from secure storage
  // For demo purposes, we'll create a simple PDF with book information
  
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    
    // Add book content to PDF
    doc.fontSize(24).text(book.title, 50, 50);
    doc.fontSize(16).text(`by ${book.author}`, 50, 90);
    doc.moveDown(2);
    doc.fontSize(12).text(book.description, 50, 150, { width: 500 });
    
    // Add some sample content
    doc.moveDown(2);
    doc.text('Chapter 1: Introduction', 50, doc.y, { underline: true });
    doc.moveDown();
    doc.text(`This is a sample preview of "${book.title}". In a production environment, this would contain the actual book content securely streamed from your storage system.`, 50, doc.y, { width: 500 });
    
    doc.moveDown(2);
    doc.text('Sample Content:', 50, doc.y, { underline: true });
    doc.moveDown();
    
    // Add multiple pages of sample content
    for (let i = 1; i <= 5; i++) {
      if (i > 1) doc.addPage();
      doc.text(`Page ${i}`, 50, 50);
      doc.moveDown();
      doc.text(`This is page ${i} of the sample content for "${book.title}". `, 50, doc.y);
      doc.text('In a real implementation, this would be the actual book content loaded from secure storage with proper access controls based on the user\'s subscription tier.', 50, doc.y + 20, { width: 500 });
    }
    
    doc.end();
  });
}
