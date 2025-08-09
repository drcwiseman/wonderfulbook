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
  readingChallenges,
  challengeParticipants,
  challengeActivities,
  challengeComments,
  bookReviews,
  reviewHelpfulVotes,
  auditLogs,
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
  type ReadingChallenge,
  type InsertChallenge,
  type ChallengeParticipant,
  type InsertParticipant,
  type UpdateProgress,
  type ChallengeActivity,
  type InsertActivity,
  type ChallengeComment,
  type InsertComment,
  type BookReview,
  type InsertBookReview,
  type ReviewHelpfulVote,
  type InsertReviewHelpfulVote,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, ilike, sql, count } from "drizzle-orm";
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
  getAllUsers(options?: { page?: number; limit?: number; search?: string; role?: string }): Promise<{ users: User[]; total: number; page: number; totalPages: number }>;
  searchUsers(query: string): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  bulkUpdateUsers(ids: string[], updates: Partial<User>): Promise<void>;
  bulkDeleteUsers(ids: string[]): Promise<void>;
  resetUserPassword(userId: string, newPassword?: string): Promise<{ success: boolean; tempPassword?: string }>;
  updateUserRole(userId: string, role: string): Promise<User>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User>;
  toggleUserStatus(userId: string, isActive: boolean): Promise<User>;
  getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    superAdminUsers: number;
    subscriptionBreakdown: { [key: string]: number };
    recentSignups: number;
    totalBooks: number;
    totalChallenges: number;
  }>;
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(options?: { page?: number; limit?: number; userId?: string; action?: string; severity?: string; startDate?: Date; endDate?: Date }): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }>;
  
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

  // Challenge operations
  getAllChallenges(): Promise<ReadingChallenge[]>;
  getActivePublicChallenges(): Promise<ReadingChallenge[]>;
  getUserChallenges(userId: string): Promise<ReadingChallenge[]>;
  getChallenge(challengeId: string): Promise<ReadingChallenge | undefined>;
  createChallenge(challengeData: InsertChallenge, userId: string): Promise<ReadingChallenge>;
  updateChallenge(challengeId: string, updates: Partial<InsertChallenge>): Promise<ReadingChallenge>;
  deleteChallenge(challengeId: string): Promise<void>;
  
  // Challenge participation operations
  joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant>;
  leaveChallenge(challengeId: string, userId: string): Promise<void>;
  updateChallengeProgress(challengeId: string, userId: string, progressData: UpdateProgress): Promise<ChallengeParticipant>;
  getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]>;
  getUserChallengeParticipation(challengeId: string, userId: string): Promise<ChallengeParticipant | undefined>;
  getChallengeLeaderboard(challengeId: string): Promise<ChallengeParticipant[]>;
  
  // Challenge activity operations
  logChallengeActivity(activityData: InsertActivity): Promise<ChallengeActivity>;
  getChallengeActivities(challengeId: string, limit?: number): Promise<ChallengeActivity[]>;
  
  // Challenge comment operations
  createChallengeComment(commentData: InsertComment): Promise<ChallengeComment>;
  getChallengeComments(challengeId: string): Promise<ChallengeComment[]>;
  deleteChallengeComment(commentId: string): Promise<void>;

  // Book review operations
  getBookReviews(bookId: string, options?: { page?: number; limit?: number; sort?: string }): Promise<BookReview[]>;
  createBookReview(reviewData: InsertBookReview): Promise<BookReview>;
  updateBookReview(reviewId: string, updates: Partial<BookReview>): Promise<BookReview>;
  deleteBookReview(reviewId: string): Promise<void>;
  voteReviewHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<ReviewHelpfulVote>;
  getUserBookReview(userId: string, bookId: string): Promise<BookReview | undefined>;
  likeChallengeComment(commentId: string, userId: string): Promise<ChallengeComment>;
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
  async getAllUsers(options?: { page?: number; limit?: number; search?: string; role?: string }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;
    
    let query = db.select().from(users);
    
    // Apply filters
    const conditions: any[] = [];
    
    if (options?.search) {
      conditions.push(
        or(
          ilike(users.email, `%${options.search}%`),
          ilike(users.firstName, `%${options.search}%`),
          ilike(users.lastName, `%${options.search}%`),
          ilike(users.username, `%${options.search}%`)
        )
      );
    }
    
    if (options?.role && options.role !== 'all') {
      conditions.push(eq(users.role, options.role));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    // Get total count
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(users);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;
    
    // Get paginated results
    const usersList = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      users: usersList,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
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

  async deleteUserBasic(id: string): Promise<void> {
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

  async resetUserPasswordBasic(userId: string, newPassword?: string): Promise<{ success: boolean; tempPassword?: string }> {
    try {
      const tempPassword = newPassword || Math.random().toString(36).slice(-12);
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

      return { success: true, tempPassword: newPassword ? undefined : tempPassword };
    } catch (error) {
      console.error('Error resetting user password:', error);
      return { success: false };
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
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

  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    superAdminUsers: number;
    subscriptionBreakdown: { [key: string]: number };
    recentSignups: number;
    totalBooks: number;
    totalChallenges: number;
  }> {
    // Get user statistics
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));
    const adminUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'admin'));
    const superAdminUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'super_admin'));
    
    // Get subscription breakdown
    const subscriptionBreakdown = await db
      .select({ 
        tier: users.subscriptionTier, 
        count: sql<number>`count(*)` 
      })
      .from(users)
      .groupBy(users.subscriptionTier);
    
    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignupsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`);
    
    // Get book count
    const totalBooksResult = await db.select({ count: sql<number>`count(*)` }).from(books);
    
    // Get challenge count
    const totalChallengesResult = await db.select({ count: sql<number>`count(*)` }).from(readingChallenges);
    
    const subscriptionBreakdownObj: { [key: string]: number } = {};
    subscriptionBreakdown.forEach(item => {
      subscriptionBreakdownObj[item.tier || 'unknown'] = item.count;
    });
    
    return {
      totalUsers: totalUsersResult[0]?.count || 0,
      activeUsers: activeUsersResult[0]?.count || 0,
      adminUsers: adminUsersResult[0]?.count || 0,
      superAdminUsers: superAdminUsersResult[0]?.count || 0,
      subscriptionBreakdown: subscriptionBreakdownObj,
      recentSignups: recentSignupsResult[0]?.count || 0,
      totalBooks: totalBooksResult[0]?.count || 0,
      totalChallenges: totalChallengesResult[0]?.count || 0,
    };
  }

  async getAuditLogs(options?: { page?: number; limit?: number }): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const offset = (page - 1) * limit;
    
    // For now, we'll return reading activity as audit logs
    // In a full implementation, you'd have a dedicated audit_logs table
    const logsQuery = db
      .select({
        id: readingProgress.id,
        userId: readingProgress.userId,
        action: sql<string>`'reading_progress'`,
        resource: readingProgress.bookId,
        timestamp: readingProgress.lastReadAt,
        details: sql<string>`json_build_object('currentPage', ${readingProgress.currentPage}, 'progressPercentage', ${readingProgress.progressPercentage})`
      })
      .from(readingProgress)
      .orderBy(desc(readingProgress.lastReadAt))
      .limit(limit)
      .offset(offset);
    
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(readingProgress);
    
    const [logs, [{ count }]] = await Promise.all([
      logsQuery,
      countQuery
    ]);
    
    return {
      logs,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
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

  // ===== CHALLENGE OPERATIONS =====
  
  async getAllChallenges(): Promise<ReadingChallenge[]> {
    return await db.select().from(readingChallenges)
      .orderBy(desc(readingChallenges.createdAt));
  }

  async getActivePublicChallenges(): Promise<ReadingChallenge[]> {
    return await db.select().from(readingChallenges)
      .where(and(
        eq(readingChallenges.isActive, true),
        eq(readingChallenges.isPublic, true)
      ))
      .orderBy(desc(readingChallenges.createdAt));
  }

  async getUserChallenges(userId: string): Promise<ReadingChallenge[]> {
    return await db.select().from(readingChallenges)
      .where(eq(readingChallenges.createdById, userId))
      .orderBy(desc(readingChallenges.createdAt));
  }

  async getChallenge(challengeId: string): Promise<ReadingChallenge | undefined> {
    const [challenge] = await db.select().from(readingChallenges)
      .where(eq(readingChallenges.id, challengeId));
    return challenge;
  }

  async createChallenge(challengeData: InsertChallenge, userId: string): Promise<ReadingChallenge> {
    const [challenge] = await db.insert(readingChallenges)
      .values({ ...challengeData, createdById: userId })
      .returning();

    // Auto-join the creator
    await this.joinChallenge(challenge.id, userId);

    // Log activity
    await this.logChallengeActivity({
      challengeId: challenge.id,
      userId,
      activityType: 'created',
      message: `Created the challenge "${challenge.title}"`,
    });

    return challenge;
  }

  async updateChallenge(challengeId: string, updates: Partial<InsertChallenge>): Promise<ReadingChallenge> {
    const [challenge] = await db.update(readingChallenges)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(readingChallenges.id, challengeId))
      .returning();
    return challenge;
  }

  async deleteChallenge(challengeId: string): Promise<void> {
    await db.delete(readingChallenges)
      .where(eq(readingChallenges.id, challengeId));
  }

  // Challenge participation operations
  async joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant> {
    // Check if already participating
    const existing = await this.getUserChallengeParticipation(challengeId, userId);
    if (existing) {
      throw new Error("Already participating in this challenge");
    }

    const [participant] = await db.insert(challengeParticipants)
      .values({ challengeId, userId })
      .returning();

    // Log activity
    await this.logChallengeActivity({
      challengeId,
      userId,
      activityType: 'joined',
      message: 'Joined the challenge',
    });

    return participant;
  }

  async leaveChallenge(challengeId: string, userId: string): Promise<void> {
    await db.delete(challengeParticipants)
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ));

    // Log activity
    await this.logChallengeActivity({
      challengeId,
      userId,
      activityType: 'left',
      message: 'Left the challenge',
    });
  }

  async updateChallengeProgress(challengeId: string, userId: string, progressData: UpdateProgress): Promise<ChallengeParticipant> {
    const oldParticipant = await this.getUserChallengeParticipation(challengeId, userId);
    if (!oldParticipant) {
      throw new Error("Not participating in this challenge");
    }

    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    const isCompleted = progressData.progress >= challenge.targetValue;
    const completedAt = isCompleted && !oldParticipant.isCompleted ? new Date() : oldParticipant.completedAt;

    const [participant] = await db.update(challengeParticipants)
      .set({
        progress: progressData.progress,
        notes: progressData.notes || oldParticipant.notes,
        isCompleted,
        completedAt,
      })
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ))
      .returning();

    // Log activity
    const message = isCompleted && !oldParticipant.isCompleted
      ? `Completed the challenge! 🎉`
      : `Updated progress: ${progressData.progress}/${challenge.targetValue}`;

    await this.logChallengeActivity({
      challengeId,
      userId,
      activityType: isCompleted ? 'completed' : 'progress_update',
      message,
      progressValue: progressData.progress,
    });

    return participant;
  }

  async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    return await db.select().from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challengeId))
      .orderBy(desc(challengeParticipants.progress));
  }

  async getUserChallengeParticipation(challengeId: string, userId: string): Promise<ChallengeParticipant | undefined> {
    const [participant] = await db.select().from(challengeParticipants)
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ));
    return participant;
  }

  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeParticipant[]> {
    return await db.select().from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challengeId))
      .orderBy(desc(challengeParticipants.progress), challengeParticipants.joinedAt);
  }

  // Challenge activity operations
  async logChallengeActivity(activityData: InsertActivity): Promise<ChallengeActivity> {
    const [activity] = await db.insert(challengeActivities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getChallengeActivities(challengeId: string, limit = 50): Promise<ChallengeActivity[]> {
    return await db.select().from(challengeActivities)
      .where(eq(challengeActivities.challengeId, challengeId))
      .orderBy(desc(challengeActivities.createdAt))
      .limit(limit);
  }

  // Challenge comment operations
  async createChallengeComment(commentData: InsertComment): Promise<ChallengeComment> {
    const [comment] = await db.insert(challengeComments)
      .values(commentData)
      .returning();

    // Log activity
    await this.logChallengeActivity({
      challengeId: commentData.challengeId,
      userId: commentData.userId,
      activityType: 'comment',
      message: 'Posted a comment',
    });

    return comment;
  }

  async getChallengeComments(challengeId: string): Promise<ChallengeComment[]> {
    return await db.select().from(challengeComments)
      .where(eq(challengeComments.challengeId, challengeId))
      .orderBy(challengeComments.createdAt);
  }

  async deleteChallengeComment(commentId: string): Promise<void> {
    await db.delete(challengeComments)
      .where(eq(challengeComments.id, commentId));
  }

  async likeChallengeComment(commentId: string, userId: string): Promise<ChallengeComment> {
    const [comment] = await db.update(challengeComments)
      .set({ likes: sql`${challengeComments.likes} + 1` })
      .where(eq(challengeComments.id, commentId))
      .returning();
    return comment;
  }

  // Super Admin User Management Operations - Enhanced versions
  async updateUserDetails(userId: string, userData: { firstName: string; lastName: string; email: string }): Promise<User> {
    const [user] = await db.update(users)
      .set({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async resetUserPassword(userId: string, newPassword?: string): Promise<{ success: boolean; tempPassword?: string }> {
    const passwordToUse = newPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(passwordToUse, 12);
    await db.update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return {
      success: true,
      tempPassword: newPassword ? undefined : passwordToUse
    };
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete related records first due to foreign key constraints
    await db.delete(readingProgress).where(eq(readingProgress.userId, userId));
    await db.delete(bookmarks).where(eq(bookmarks.userId, userId));
    await db.delete(challengeParticipants).where(eq(challengeParticipants.userId, userId));
    await db.delete(challengeComments).where(eq(challengeComments.userId, userId));
    await db.delete(challengeActivities).where(eq(challengeActivities.userId, userId));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  // Book review operations
  async getBookReviews(bookId: string, options?: { page?: number; limit?: number; sort?: string }): Promise<BookReview[]> {
    const { page = 1, limit = 10, sort = 'newest' } = options || {};
    const offset = (page - 1) * limit;
    
    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = bookReviews.createdAt;
        break;
      case 'rating_high':
        orderBy = desc(bookReviews.rating);
        break;
      case 'rating_low':
        orderBy = bookReviews.rating;
        break;
      case 'helpful':
        orderBy = desc(bookReviews.helpfulVotes);
        break;
      default:
        orderBy = desc(bookReviews.createdAt);
    }

    return await db.select({
      id: bookReviews.id,
      userId: bookReviews.userId,
      bookId: bookReviews.bookId,
      rating: bookReviews.rating,
      reviewTitle: bookReviews.reviewTitle,
      reviewText: bookReviews.reviewText,
      isVerifiedPurchase: bookReviews.isVerifiedPurchase,
      helpfulVotes: bookReviews.helpfulVotes,
      isApproved: bookReviews.isApproved,
      createdAt: bookReviews.createdAt,
      updatedAt: bookReviews.updatedAt,
      user: {
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
    .from(bookReviews)
    .leftJoin(users, eq(bookReviews.userId, users.id))
    .where(and(
      eq(bookReviews.bookId, bookId),
      eq(bookReviews.isApproved, true)
    ))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset) as any;
  }

  async createBookReview(reviewData: InsertBookReview): Promise<BookReview> {
    // Check if user already reviewed this book
    const existing = await this.getUserBookReview(reviewData.userId, reviewData.bookId);
    if (existing) {
      throw new Error("You have already reviewed this book");
    }

    const [review] = await db.insert(bookReviews)
      .values(reviewData)
      .returning();

    // Update book's review statistics
    await db.update(books)
      .set({
        totalReviews: sql`${books.totalReviews} + 1`,
        rating: sql`(
          SELECT ROUND(AVG(rating)::numeric, 2) 
          FROM ${bookReviews} 
          WHERE ${bookReviews.bookId} = ${reviewData.bookId} 
          AND ${bookReviews.isApproved} = true
        )`,
        totalRatings: sql`${books.totalRatings} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(books.id, reviewData.bookId));

    return review;
  }

  async updateBookReview(reviewId: string, updates: Partial<BookReview>): Promise<BookReview> {
    const [review] = await db.update(bookReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookReviews.id, reviewId))
      .returning();
    return review;
  }

  async deleteBookReview(reviewId: string): Promise<void> {
    const [review] = await db.select().from(bookReviews).where(eq(bookReviews.id, reviewId));
    if (!review) return;

    await db.delete(bookReviews).where(eq(bookReviews.id, reviewId));

    // Update book's review statistics
    await db.update(books)
      .set({
        totalReviews: sql`${books.totalReviews} - 1`,
        rating: sql`(
          SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) 
          FROM ${bookReviews} 
          WHERE ${bookReviews.bookId} = ${review.bookId} 
          AND ${bookReviews.isApproved} = true
        )`,
        totalRatings: sql`${books.totalRatings} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(books.id, review.bookId));
  }

  async voteReviewHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<ReviewHelpfulVote> {
    // Check if user already voted
    const [existingVote] = await db.select()
      .from(reviewHelpfulVotes)
      .where(and(
        eq(reviewHelpfulVotes.reviewId, reviewId),
        eq(reviewHelpfulVotes.userId, userId)
      ));

    if (existingVote) {
      // Update existing vote
      const [vote] = await db.update(reviewHelpfulVotes)
        .set({ isHelpful })
        .where(eq(reviewHelpfulVotes.id, existingVote.id))
        .returning();
      
      // Recalculate helpful votes for the review
      const helpfulCount = await db.select({ count: count() })
        .from(reviewHelpfulVotes)
        .where(and(
          eq(reviewHelpfulVotes.reviewId, reviewId),
          eq(reviewHelpfulVotes.isHelpful, true)
        ));

      await db.update(bookReviews)
        .set({ helpfulVotes: helpfulCount[0].count })
        .where(eq(bookReviews.id, reviewId));

      return vote;
    } else {
      // Create new vote
      const [vote] = await db.insert(reviewHelpfulVotes)
        .values({ reviewId, userId, isHelpful })
        .returning();

      // Update helpful votes count
      if (isHelpful) {
        await db.update(bookReviews)
          .set({ helpfulVotes: sql`${bookReviews.helpfulVotes} + 1` })
          .where(eq(bookReviews.id, reviewId));
      }

      return vote;
    }
  }

  async getUserBookReview(userId: string, bookId: string): Promise<BookReview | undefined> {
    const [review] = await db.select()
      .from(bookReviews)
      .where(and(
        eq(bookReviews.userId, userId),
        eq(bookReviews.bookId, bookId)
      ));
    return review;
  }

  // ===== AUDIT LOG OPERATIONS =====

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getAuditLogs(options?: { 
    page?: number; 
    limit?: number; 
    userId?: string; 
    action?: string; 
    severity?: string; 
    startDate?: Date; 
    endDate?: Date; 
  }): Promise<{ logs: AuditLog[]; total: number; page: number; totalPages: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const offset = (page - 1) * limit;
    
    let query = db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      resource: auditLogs.resource,
      resourceId: auditLogs.resourceId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      severity: auditLogs.severity,
      status: auditLogs.status,
      sessionId: auditLogs.sessionId,
      createdAt: auditLogs.createdAt,
      // Join with user info
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
    }).from(auditLogs).leftJoin(users, eq(auditLogs.userId, users.id));
    
    const conditions: any[] = [];
    
    // Apply filters
    if (options?.userId) {
      conditions.push(eq(auditLogs.userId, options.userId));
    }
    
    if (options?.action) {
      conditions.push(eq(auditLogs.action, options.action));
    }
    
    if (options?.severity) {
      conditions.push(eq(auditLogs.severity, options.severity));
    }
    
    if (options?.startDate) {
      conditions.push(sql`${auditLogs.createdAt} >= ${options.startDate}`);
    }
    
    if (options?.endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${options.endDate}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    // Get total count for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(auditLogs);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;
    
    // Get paginated results ordered by newest first
    const logs = await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      logs: logs as AuditLog[],
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }
}

export const storage = new DatabaseStorage();