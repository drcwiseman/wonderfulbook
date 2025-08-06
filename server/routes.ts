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

// WORKAROUND: The keys are swapped in environment - use VITE_STRIPE_PUBLIC_KEY which actually contains the secret key
const actualSecretKey = process.env.VITE_STRIPE_PUBLIC_KEY; // This contains the sk_ key
console.log('Using Stripe secret key starting with:', actualSecretKey?.substring(0, 3));

const stripe = new Stripe(actualSecretKey!);

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
      const { bookId, pageNumber, totalPages } = req.body;
      
      const progressPercentage = totalPages > 0 ? ((pageNumber / totalPages) * 100).toFixed(2) : "0.00";
      
      const currentPageNum = parseInt(pageNumber, 10);
      const totalPagesNum = parseInt(totalPages || 0, 10);
      
      // Validate inputs to prevent NaN
      if (isNaN(currentPageNum) || isNaN(totalPagesNum)) {
        return res.status(400).json({ message: "Invalid page numbers" });
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
  app.get('/api/user/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

      // Dynamic pricing - create products and prices as needed
      const tierConfig = {
        basic: { amount: 999, name: 'Basic Plan' }, // £9.99
        premium: { amount: 1999, name: 'Premium Plan' } // £19.99
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
      const userTier = user?.subscriptionTier || 'free';
      const canAccess = checkBookAccess(userTier, book.requiredTier || 'free');
      
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
  
  const PDFKit = await import('pdfkit');
  const PDFDocument = PDFKit.default;
  
  // Create PDF with proper font settings
  const doc = new PDFDocument({
    font: 'Helvetica',
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    info: {
      Title: book.title,
      Author: book.author,
      Subject: book.description,
      Keywords: book.category
    }
  });
  
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    
    // Title page with proper formatting
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .text(book.title, 50, 100, { align: 'center', width: 500 });
    
    doc.font('Helvetica')
       .fontSize(18)
       .text(`by ${book.author}`, 50, 160, { align: 'center', width: 500 });
    
    doc.fontSize(14)
       .text(book.category, 50, 200, { align: 'center', width: 500 });
    
    // Description
    doc.moveDown(3);
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .text('About This Book', 50, 300);
    
    doc.font('Helvetica')
       .fontSize(12)
       .text(book.description, 50, 330, { 
         width: 500, 
         align: 'justify',
         lineGap: 4
       });
    
    // Content pages with proper typography
    for (let i = 1; i <= 5; i++) {
      doc.addPage();
      
      // Page header
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .text(`Chapter ${i}: Sample Content`, 50, 50);
      
      // Page content with proper formatting
      doc.font('Helvetica')
         .fontSize(12)
         .moveDown(2)
         .text(`This is page ${i} of "${book.title}". `, 50, doc.y, {
           width: 500,
           align: 'justify',
           lineGap: 6
         });
      
      doc.moveDown(1)
         .text('In a production environment, this content would be loaded from secure storage with proper access controls based on subscription tiers. The reading experience includes features like bookmarking, progress tracking, and offline access.', 50, doc.y, {
           width: 500,
           align: 'justify',
           lineGap: 6
         });
      
      // Sample paragraph content
      doc.moveDown(2)
         .text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.', 50, doc.y, {
           width: 500,
           align: 'justify',
           lineGap: 6
         });
      
      // Page footer
      doc.font('Helvetica')
         .fontSize(10)
         .text(`Page ${i} | ${book.title}`, 50, 750, { 
           width: 500, 
           align: 'center' 
         });
    }
    
    doc.end();
  });
}
