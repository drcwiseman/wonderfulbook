import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

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

  // Categories endpoint
  app.get('/api/categories', async (req, res) => {
    try {
      // Get unique book tiers and categories from the database
      const books = await storage.getAllBooks();
      const tiers = [...new Set(books.map(book => book.requiredTier))];
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

  // Admin middleware
  const isAdmin = (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    const userEmail = req.user?.claims?.email;
    
    if (userId === "45814604" || userEmail === "drcwiseman@gmail.com") {
      return next();
    }
    
    return res.status(403).json({ message: "Admin access required" });
  };

  // Admin image upload route
  app.post('/api/admin/upload-image', isAuthenticated, isAdmin, upload.single('image'), async (req, res) => {
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
  app.get('/api/admin/books', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching books for admin:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Delete a book (admin)
  app.delete("/api/admin/books/:id", isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.post("/api/admin/books/bulk-delete", isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Create new book with enhanced features
  app.post('/api/admin/books', isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.post('/api/admin/upload-image', isAuthenticated, isAdmin, upload.single('image'), async (req: any, res) => {
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

  app.post('/api/admin/upload-pdf', isAuthenticated, isAdmin, upload.single('pdf'), async (req: any, res) => {
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

  app.patch('/api/admin/books/:id', isAuthenticated, isAdmin, async (req: any, res) => {
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

  app.patch('/api/admin/books/bulk', isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.patch('/api/admin/books/:id/featured', isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.delete('/api/admin/books/:id', isAuthenticated, isAdmin, async (req: any, res) => {
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
  app.delete('/api/admin/books/bulk', isAuthenticated, isAdmin, async (req: any, res) => {
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

  // Admin user management routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
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

  app.post('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch('/api/admin/users/bulk', isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete('/api/admin/users/bulk', isAuthenticated, isAdmin, async (req, res) => {
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

  app.post('/api/admin/users/:id/reset-password', isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch('/api/admin/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
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

  app.patch('/api/admin/users/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await storage.toggleUserStatus(id, isActive);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get('/api/admin/user-analytics', isAuthenticated, isAdmin, async (req, res) => {
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

  // Category management routes (admin only)
  app.get('/api/admin/categories', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/admin/categories', isAuthenticated, isAdmin, async (req, res) => {
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

  app.put('/api/admin/categories/:id', isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete('/api/admin/categories/:id', isAuthenticated, isAdmin, async (req, res) => {
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
  
  // Create PDF with basic options only
  const doc = new PDFDocument();
  
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
    
    // Clean the description by removing HTML tags and entities
    const cleanDescription = book.description
      ? book.description
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
          .replace(/&amp;/g, '&') // Replace HTML entities
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()
      : 'No description available';
    
    doc.font('Helvetica')
       .fontSize(12)
       .text(cleanDescription, 50, 330, { 
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
         .text('Welcome to this transformational journey! This book contains powerful insights and practical strategies designed to help you overcome challenges and achieve lasting positive change in your life.', 50, doc.y, {
           width: 500,
           align: 'justify',
           lineGap: 6
         });
      
      doc.moveDown(2)
         .text('Through proven methodologies and real-world applications, you will discover how to break through limiting beliefs, develop resilient mindsets, and create the life you truly desire. Each chapter builds upon the previous one, providing you with a comprehensive roadmap for personal transformation.', 50, doc.y, {
           width: 500,
           align: 'justify',
           lineGap: 6
         });
      
      doc.moveDown(2)
         .text('Key topics covered in this chapter include developing self-awareness, setting meaningful goals, overcoming obstacles, building positive relationships, and maintaining long-term motivation. The strategies presented here have been tested and refined through years of research and practical application.', 50, doc.y, {
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
