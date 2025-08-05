import {
  users,
  books,
  readingProgress,
  bookmarks,
  type User,
  type UpsertUser,
  type Book,
  type InsertBook,
  type ReadingProgress,
  type InsertReadingProgress,
  type Bookmark,
  type InsertBookmark,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User>;
  updateUserSubscription(userId: string, tier: string, status: string): Promise<User>;
  
  // Book operations
  getAllBooks(): Promise<Book[]>;
  getBooksByCategory(category: string): Promise<Book[]>;
  getFeaturedBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  
  // Reading progress operations
  getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | undefined>;
  upsertReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;
  getUserReadingHistory(userId: string): Promise<ReadingProgress[]>;
  
  // Bookmark operations
  getUserBookmarks(userId: string, bookId?: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // For Replit auth, we need to handle the user ID from claims
    const userDataWithId = {
      ...userData,
      id: (userData as any).id || userData.email, // Fallback to email as ID
    };
    
    const [user] = await db
      .insert(users)
      .values(userDataWithId)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userDataWithId,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
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

  // Book operations
  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books).orderBy(desc(books.createdAt));
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
          like(books.title, `%${query}%`),
          like(books.author, `%${query}%`),
          like(books.description, `%${query}%`)
        )
      );
  }

  async getBook(id: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  // Reading progress operations
  async getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.bookId, bookId)));
    return progress;
  }

  async upsertReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress> {
    const [result] = await db
      .insert(readingProgress)
      .values(progress)
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.bookId],
        set: {
          ...progress,
          updatedAt: new Date(),
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
}

export const storage = new DatabaseStorage();
