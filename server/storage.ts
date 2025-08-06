import {
  users,
  books,
  readingProgress,
  bookmarks,
  categories,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Book operations
  getAllBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  getBooksByCategory(category: string): Promise<Book[]>;
  getFeaturedBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    return await db.select().from(books).orderBy(desc(books.createdAt));
  }

  async getBook(id: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async getBooksByCategory(category: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.category, category));
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

  async createBook(bookData: InsertBook): Promise<Book> {
    const [book] = await db
      .insert(books)
      .values(bookData)
      .returning();
    return book;
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
  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    const [book] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();
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
}

export const storage = new DatabaseStorage();