import {
  users,
  books,
  readingProgress,
  bookmarks,
  categories,
  bookCategories,
  subscriptionPlans,
  emailPreferences,
  emailLogs,
  type User,
  type UpsertUser,
  type Book,
  type InsertBook,
  type ReadingProgress,
  type InsertReadingProgress,
  type Bookmark,
  type InsertBookmark,
  type Category,
  type InsertCategory,
  type BookCategory,
  type InsertBookCategory,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type EmailPreferences,
  type InsertEmailPreferences,
  type UpdateEmailPreferences,
  type EmailLog,
  type InsertEmailLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { RegisterData } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createManualUser(userData: any): Promise<User>;
  
  // Local authentication operations
  registerUser(userData: RegisterData): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  verifyEmail(token: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  generatePasswordResetToken(email: string): Promise<string | null>;
  
  // Admin user management operations
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  bulkUpdateUsers(ids: string[], updates: Partial<User>): Promise<void>;
  bulkDeleteUsers(ids: string[]): Promise<void>;
  resetUserPassword(userId: string, newPassword?: string): Promise<{ success: boolean; tempPassword?: string }>;
  updateUserRole(userId: string, role: string): Promise<User>;
  toggleUserStatus(userId: string, isActive: boolean): Promise<User>;
  getUserAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    subscriptionBreakdown: { [key: string]: number };
    recentSignups: number;
  }>;
  
  // Book operations
  getAllBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  getBooksByCategory(categoryId: string): Promise<Book[]>;
  getFeaturedBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  createBook(book: InsertBook, categoryIds: string[]): Promise<Book>;
  deleteBook(id: string): Promise<{ book: Book | undefined; filesDeleted: boolean }>;
  deleteMultipleBooks(bookIds: string[]): Promise<{ deletedBooks: (Book | undefined)[]; totalDeleted: number }>;
  
  // Book-Category operations
  getBookCategories(bookId: string): Promise<Category[]>;
  setBookCategories(bookId: string, categoryIds: string[]): Promise<void>;
  addBookCategory(bookId: string, categoryId: string): Promise<void>;
  removeBookCategory(bookId: string, categoryId: string): Promise<void>;
  
  // Reading progress operations
  getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | undefined>;
  upsertReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;
  getUserReadingHistory(userId: string): Promise<ReadingProgress[]>;
  
  // Bookmark operations
  getUserBookmarks(userId: string, bookId?: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;
  
  // Stripe and subscription operations
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserSubscription(userId: string, tier: string, status: string): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  
  // Admin operations
  updateBook(id: string, updates: Partial<Book>): Promise<Book>;
  bulkUpdateBooks(ids: string[], updates: Partial<Book>): Promise<void>;
  toggleFeatured(bookId: string, isFeatured: boolean): Promise<Book>;
  getAnalytics(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    conversionRate: number;
  }>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getActiveCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(categoryId: string, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;

  // Email preferences operations
  getEmailPreferences(userId: string, email: string): Promise<EmailPreferences>;
  updateEmailPreferences(userId: string, updates: UpdateEmailPreferences): Promise<EmailPreferences>;
  findEmailPreferencesByToken(token: string): Promise<EmailPreferences | undefined>;

  // Email logging operations
  logEmail(logData: InsertEmailLog): Promise<EmailLog>;
  getEmailLogs(options: {
    limit?: number;
    offset?: number;
    status?: string;
    emailType?: string;
  }): Promise<EmailLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // Local authentication operations
  async registerUser(userData: RegisterData): Promise<User> {
    // Check if email or username already exists
    const existingUser = await db.select().from(users)
      .where(or(eq(users.email, userData.email), eq(users.username, userData.username)));
    
    if (existingUser.length > 0) {
      const existing = existingUser[0];
      if (existing.email === userData.email) {
        throw new Error("Email already registered");
      }
      if (existing.username === userData.username) {
        throw new Error("Username already taken");
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    // Generate email verification token
    const emailVerificationToken = nanoid(32);

    const [user] = await db
      .insert(users)
      .values({
        id: nanoid(12),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        passwordHash,
        authProvider: 'local',
        emailVerified: false,
        emailVerificationToken,
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
        role: 'user',
        isActive: true,
      })
      .returning();

    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.authProvider, 'local')));
    
    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    return user;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db.select().from(users)
      .where(eq(users.emailVerificationToken, token));
    
    if (!user) {
      return false;
    }

    await db.update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return true;
  }

  async generatePasswordResetToken(email: string): Promise<string | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return null;
    }

    const resetToken = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const [user] = await db.select().from(users)
      .where(eq(users.passwordResetToken, token));
    
    if (!user || !user.passwordResetExpires) {
      return false;
    }

    // Check if token has expired
    if (user.passwordResetExpires < new Date()) {
      return false;
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await db.update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return true;
  }

  async createManualUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Stripe and subscription operations
  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const updateData: any = { stripeCustomerId, updatedAt: new Date() };
    if (stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = stripeSubscriptionId;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, tier: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  // Book operations
  async getAllBooks(): Promise<Book[]> {
    const booksList = await db.select().from(books).orderBy(desc(books.createdAt));
    
    // Add categories to each book
    const booksWithCategories = await Promise.all(
      booksList.map(async (book) => {
        const categories = await this.getBookCategories(book.id);
        return { ...book, categories };
      })
    );
    
    return booksWithCategories;
  }

  async getBook(id: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getBooksByCategory(categoryId: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .innerJoin(bookCategories, eq(books.id, bookCategories.bookId))
      .where(eq(bookCategories.categoryId, categoryId))
      .then(results => results.map(result => result.books));
  }

  async getFeaturedBooks(): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.isFeatured, true));
  }

  async searchBooks(query: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(
        or(
          ilike(books.title, `%${query}%`),
          ilike(books.author, `%${query}%`),
          ilike(books.description, `%${query}%`)
        )
      );
  }

  async createBook(bookData: InsertBook, categoryIds: string[] = []): Promise<Book> {
    const [book] = await db
      .insert(books)
      .values(bookData)
      .returning();
      
    // Add book categories
    if (categoryIds.length > 0) {
      await this.setBookCategories(book.id, categoryIds);
    }
    
    return book;
  }

  async deleteBook(id: string): Promise<{ book: Book | undefined; filesDeleted: boolean }> {
    // First, get the book to access file paths before deletion
    const book = await this.getBook(id);
    if (!book) {
      throw new Error('Book not found');
    }

    // Delete associated records in correct order (foreign key constraints)
    await db.delete(readingProgress).where(eq(readingProgress.bookId, id));
    await db.delete(bookmarks).where(eq(bookmarks.bookId, id));
    await db.delete(bookCategories).where(eq(bookCategories.bookId, id));
    
    // Finally delete the book record
    await db.delete(books).where(eq(books.id, id));

    return { book, filesDeleted: true };
  }

  async deleteMultipleBooks(bookIds: string[]): Promise<{ deletedBooks: (Book | undefined)[]; totalDeleted: number }> {
    const deletedBooks: (Book | undefined)[] = [];
    let totalDeleted = 0;

    for (const bookId of bookIds) {
      try {
        const result = await this.deleteBook(bookId);
        deletedBooks.push(result.book);
        totalDeleted++;
      } catch (error) {
        console.error(`Failed to delete book ${bookId}:`, error);
        deletedBooks.push(undefined);
      }
    }

    return { deletedBooks, totalDeleted };
  }

  // Reading progress operations
  async getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.bookId, bookId)));
    return progress;
  }

  async upsertReadingProgress(progressData: InsertReadingProgress): Promise<ReadingProgress> {
    const [result] = await db
      .insert(readingProgress)
      .values(progressData)
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.bookId],
        set: {
          currentPage: progressData.currentPage,
          totalPages: progressData.totalPages,
          progressPercentage: progressData.progressPercentage,
          lastReadAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getUserReadingHistory(userId: string): Promise<ReadingProgress[]> {
    return await db
      .select()
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt));
  }

  async getUserReadingProgress(userId: string): Promise<ReadingProgress[]> {
    return await db
      .select()
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt));
  }

  // Bookmark operations
  async getUserBookmarks(userId: string, bookId?: string): Promise<Bookmark[]> {
    const conditions = [eq(bookmarks.userId, userId)];
    if (bookId) {
      conditions.push(eq(bookmarks.bookId, bookId));
    }
    
    return await db
      .select()
      .from(bookmarks)
      .where(and(...conditions))
      .orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async deleteBookmark(id: string): Promise<void> {
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
  }



  // Admin operations
  async updateBook(id: string, updates: Partial<Book>, categoryIds?: string[]): Promise<Book> {
    const [book] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();
    
    // Update categories if provided
    if (categoryIds !== undefined) {
      await this.setBookCategories(id, categoryIds);
    }
    
    return book;
  }

  async bulkUpdateBooks(ids: string[], updates: Partial<Book>): Promise<void> {
    for (const id of ids) {
      await db
        .update(books)
        .set(updates)
        .where(eq(books.id, id));
    }
  }

  async getAnalytics(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    conversionRate: number;
  }> {
    // Get total users
    const totalUsersResult = await db.select().from(users);
    const totalUsers = totalUsersResult.length;

    // Get active subscriptions (users with premium/basic tier)
    const activeSubscriptionsResult = await db
      .select()
      .from(users)
      .where(or(eq(users.subscriptionTier, 'basic'), eq(users.subscriptionTier, 'premium')));
    const activeSubscriptions = activeSubscriptionsResult.length;

    // Calculate monthly revenue (basic: £9.99, premium: £19.99)
    const basicSubscribers = await db
      .select()
      .from(users)
      .where(eq(users.subscriptionTier, 'basic'));
    const premiumSubscribers = await db
      .select()
      .from(users)
      .where(eq(users.subscriptionTier, 'premium'));
    
    const monthlyRevenue = (basicSubscribers.length * 9.99) + (premiumSubscribers.length * 19.99);

    // Calculate conversion rate (active subscriptions / total users)
    const conversionRate = totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 100) : 0;

    return {
      totalUsers,
      activeSubscriptions,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100, // Round to 2 decimal places
      conversionRate,
    };
  }
  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getActiveCategories(): Promise<Category[]> {
    return await db.select().from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.name);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(categoryId: string, updates: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, categoryId))
      .returning();
    return category;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, categoryId));
  }

  // Book-Category relationship operations
  async getBookCategories(bookId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .innerJoin(bookCategories, eq(categories.id, bookCategories.categoryId))
      .where(eq(bookCategories.bookId, bookId))
      .then(results => results.map(result => result.categories));
  }

  async setBookCategories(bookId: string, categoryIds: string[]): Promise<void> {
    // Remove existing categories for this book
    await db.delete(bookCategories).where(eq(bookCategories.bookId, bookId));
    
    // Add new categories
    if (categoryIds.length > 0) {
      const bookCategoryData = categoryIds.map(categoryId => ({
        bookId,
        categoryId,
      }));
      await db.insert(bookCategories).values(bookCategoryData);
    }
  }

  async addBookCategory(bookId: string, categoryId: string): Promise<void> {
    await db.insert(bookCategories).values({ bookId, categoryId });
  }

  async removeBookCategory(bookId: string, categoryId: string): Promise<void> {
    await db.delete(bookCategories)
      .where(and(eq(bookCategories.bookId, bookId), eq(bookCategories.categoryId, categoryId)));
  }

  async toggleFeatured(bookId: string, isFeatured: boolean): Promise<Book> {
    const [book] = await db
      .update(books)
      .set({ isFeatured, updatedAt: new Date() })
      .where(eq(books.id, bookId))
      .returning();
    return book;
  }

  // Admin user management operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db.select().from(users)
      .where(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      )
      .orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete related data first
    await db.delete(readingProgress).where(eq(readingProgress.userId, id));
    await db.delete(bookmarks).where(eq(bookmarks.userId, id));
    // Delete user
    await db.delete(users).where(eq(users.id, id));
  }

  async bulkUpdateUsers(ids: string[], updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(or(...ids.map(id => eq(users.id, id))));
  }

  async bulkDeleteUsers(ids: string[]): Promise<void> {
    // Delete related data first
    await db.delete(readingProgress).where(or(...ids.map(id => eq(readingProgress.userId, id))));
    await db.delete(bookmarks).where(or(...ids.map(id => eq(bookmarks.userId, id))));
    // Delete users
    await db.delete(users).where(or(...ids.map(id => eq(users.id, id))));
  }

  async resetUserPassword(userId: string, newPassword?: string): Promise<{ success: boolean; tempPassword?: string }> {
    const tempPassword = newPassword || Math.random().toString(36).slice(-8);
    const resetToken = Math.random().toString(36).slice(-16);
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await db
      .update(users)
      .set({ 
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    return { success: true, tempPassword };
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    subscriptionBreakdown: { [key: string]: number };
    recentSignups: number;
  }> {
    const allUsers = await db.select().from(users);
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user => user.isActive).length;
    const adminUsers = allUsers.filter(user => user.role === 'admin').length;
    
    const subscriptionBreakdown = allUsers.reduce((acc, user) => {
      acc[user.subscriptionTier || 'free'] = (acc[user.subscriptionTier || 'free'] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = allUsers.filter(user => 
      user.createdAt && new Date(user.createdAt) > oneWeekAgo
    ).length;
    
    return {
      totalUsers,
      activeUsers,
      adminUsers,
      subscriptionBreakdown,
      recentSignups,
    };
  }

  // Subscription plan management methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.displayOrder);
      return plans as SubscriptionPlan[];
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      return [];
    }
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    try {
      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
      return plan as SubscriptionPlan | undefined;
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      return undefined;
    }
  }

  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    try {
      const [plan] = await db.insert(subscriptionPlans).values(planData).returning();
      return plan as SubscriptionPlan;
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }
  }

  async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const [plan] = await db
        .update(subscriptionPlans)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, id))
        .returning();
      
      if (!plan) {
        throw new Error("Subscription plan not found");
      }
      
      return plan as SubscriptionPlan;
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      throw error;
    }
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    try {
      await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      throw error;
    }
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.displayOrder);
      return plans as SubscriptionPlan[];
    } catch (error) {
      console.error("Error fetching active subscription plans:", error);
      return [];
    }
  }

  // Email preferences operations
  async getEmailPreferences(userId: string, email: string): Promise<EmailPreferences> {
    try {
      let [preferences] = await db
        .select()
        .from(emailPreferences)
        .where(eq(emailPreferences.userId, userId));

      if (!preferences) {
        // Create default preferences with unique unsubscribe token
        const crypto = await import('crypto');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        
        const newPreferences: InsertEmailPreferences = {
          userId,
          email,
          unsubscribeToken,
          marketingEmails: true,
          trialReminders: true,
          subscriptionUpdates: true,
          isUnsubscribedAll: false,
        };

        [preferences] = await db
          .insert(emailPreferences)
          .values(newPreferences)
          .returning();
      }

      return preferences as EmailPreferences;
    } catch (error) {
      console.error("Error getting email preferences:", error);
      throw error;
    }
  }

  async updateEmailPreferences(userId: string, updates: UpdateEmailPreferences): Promise<EmailPreferences> {
    try {
      const [preferences] = await db
        .update(emailPreferences)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(emailPreferences.userId, userId))
        .returning();

      if (!preferences) {
        throw new Error("Email preferences not found");
      }

      return preferences as EmailPreferences;
    } catch (error) {
      console.error("Error updating email preferences:", error);
      throw error;
    }
  }

  async findEmailPreferencesByToken(token: string): Promise<EmailPreferences | undefined> {
    try {
      const [preferences] = await db
        .select()
        .from(emailPreferences)
        .where(eq(emailPreferences.unsubscribeToken, token));
      return preferences as EmailPreferences | undefined;
    } catch (error) {
      console.error("Error finding email preferences by token:", error);
      return undefined;
    }
  }

  // Email logging operations
  async logEmail(logData: InsertEmailLog): Promise<EmailLog> {
    try {
      const [log] = await db.insert(emailLogs).values(logData).returning();
      return log as EmailLog;
    } catch (error) {
      console.error("Error logging email:", error);
      throw error;
    }
  }

  async getEmailLogs(options: {
    limit?: number;
    offset?: number;
    status?: string;
    emailType?: string;
  }): Promise<EmailLog[]> {
    try {
      // Apply filters
      const conditions = [];
      if (options.status) {
        conditions.push(eq(emailLogs.status, options.status));
      }
      if (options.emailType) {
        conditions.push(eq(emailLogs.emailType, options.emailType));
      }

      let baseQuery = db.select().from(emailLogs);
      
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as any;
      }

      // Apply sorting, pagination
      const logs = await baseQuery
        .orderBy(desc(emailLogs.createdAt))
        .limit(options.limit || 50)
        .offset(options.offset || 0);

      return logs as EmailLog[];
    } catch (error) {
      console.error("Error fetching email logs:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();