import { db } from './db.js';
import { eq, and, desc, asc, sql, inArray, not, isNotNull, gt, gte } from 'drizzle-orm';
import { 
  users, 
  books, 
  loans, 
  readingProgress, 
  bookReviews, 
  userReadingPreferences, 
  bookRecommendations,
  bookCategories,
  categories
} from '../shared/schema.js';

export interface BookRecommendationWithDetails {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  rating: string;
  totalRatings: number;
  requiredTier: string;
  recommendationType: string;
  score: string;
  reason: string;
  pageCount?: number;
  publishedYear?: number;
}

export interface RecommendationResult {
  userId: string;
  recommendations: BookRecommendationWithDetails[];
  totalGenerated: number;
  emailSent: boolean;
}

export class BookRecommendationEngine {
  /**
   * Generate personalized book recommendations for a user
   */
  async generateRecommendations(
    userId: string, 
    limit: number = 5,
    types: string[] = ['collaborative', 'content_based', 'trending', 'personalized']
  ): Promise<BookRecommendationWithDetails[]> {
    
    // Get user's reading history and preferences
    const userHistory = await this.getUserReadingHistory(userId);
    const userPreferences = await this.getUserPreferences(userId);
    
    const recommendations: BookRecommendationWithDetails[] = [];
    
    // 1. Collaborative filtering (users with similar reading patterns)
    if (types.includes('collaborative')) {
      const collaborative = await this.getCollaborativeRecommendations(userId, 2);
      recommendations.push(...collaborative);
    }
    
    // 2. Content-based filtering (books similar to ones they enjoyed)
    if (types.includes('content_based')) {
      const contentBased = await this.getContentBasedRecommendations(userId, userHistory, 2);
      recommendations.push(...contentBased);
    }
    
    // 3. Trending books they haven't read
    if (types.includes('trending')) {
      const trending = await this.getTrendingRecommendations(userId, 1);
      recommendations.push(...trending);
    }
    
    // 4. Personalized based on preferences
    if (types.includes('personalized')) {
      const personalized = await this.getPersonalizedRecommendations(userId, userPreferences, 2);
      recommendations.push(...personalized);
    }
    
    // Remove duplicates and limit results
    const uniqueRecommendations = this.removeDuplicates(recommendations);
    return uniqueRecommendations.slice(0, limit);
  }

  /**
   * Get user's reading history with ratings
   */
  private async getUserReadingHistory(userId: string) {
    return await db
      .select({
        bookId: loans.bookId,
        title: books.title,
        author: books.author,
        rating: bookReviews.rating,
        createdAt: loans.createdAt,
      })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .leftJoin(bookReviews, and(
        eq(bookReviews.bookId, books.id),
        eq(bookReviews.userId, userId)
      ))
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));
  }

  /**
   * Get or create user preferences
   */
  private async getUserPreferences(userId: string) {
    let preferences = await db
      .select()
      .from(userReadingPreferences)
      .where(eq(userReadingPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      // Create default preferences based on reading history
      const history = await this.getUserReadingHistory(userId);
      const favoriteAuthors = [...new Set(history.map(h => h.author))].slice(0, 3);
      
      await db.insert(userReadingPreferences).values({
        userId,
        favoriteGenres: ['business', 'self-help'], // Default genres
        preferredAuthors: favoriteAuthors,
        readingGoalsPerMonth: 2,
        preferredBookLength: 'medium'
      });
      
      preferences = await db
        .select()
        .from(userReadingPreferences)
        .where(eq(userReadingPreferences.userId, userId))
        .limit(1);
    }
    
    return preferences[0];
  }

  /**
   * Collaborative filtering: find users with similar taste and recommend their books
   */
  private async getCollaborativeRecommendations(userId: string, limit: number): Promise<BookRecommendationWithDetails[]> {
    // Find users who read similar books and liked them
    const similarUsers = await db
      .select({
        userId: loans.userId,
        sharedBooks: sql<number>`count(*)`.as('shared_books'),
        avgRating: sql<number>`avg(${bookReviews.rating})`.as('avg_rating')
      })
      .from(loans)
      .innerJoin(bookReviews, and(
        eq(bookReviews.bookId, loans.bookId),
        eq(bookReviews.userId, loans.userId),
        gte(bookReviews.rating, 4) // Only consider highly rated books
      ))
      .where(and(
        not(eq(loans.userId, userId)),
        inArray(loans.bookId, 
          db.select({ bookId: loans.bookId })
            .from(loans)
            .where(eq(loans.userId, userId))
        )
      ))
      .groupBy(loans.userId)
      .having(sql`count(*) >= 2`) // Users who share at least 2 books
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    if (similarUsers.length === 0) {
      return [];
    }

    // Get book recommendations from similar users
    const recommendations = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        coverImageUrl: books.coverImageUrl,
        rating: books.rating,
        totalRatings: books.totalRatings,
        requiredTier: books.requiredTier,
        pageCount: books.pageCount,
        publishedYear: books.publishedYear,
        userRating: bookReviews.rating,
      })
      .from(books)
      .innerJoin(loans, eq(loans.bookId, books.id))
      .innerJoin(bookReviews, and(
        eq(bookReviews.bookId, books.id),
        eq(bookReviews.userId, loans.userId),
        gte(bookReviews.rating, 4)
      ))
      .where(and(
        inArray(loans.userId, similarUsers.map(u => u.userId)),
        not(inArray(books.id, 
          db.select({ bookId: loans.bookId })
            .from(loans)
            .where(eq(loans.userId, userId))
        ))
      ))
      .groupBy(books.id, books.title, books.author, books.description, books.coverImageUrl, 
               books.rating, books.totalRatings, books.requiredTier, books.pageCount, 
               books.publishedYear, bookReviews.rating)
      .orderBy(desc(bookReviews.rating), desc(books.rating))
      .limit(limit);

    return recommendations.map(rec => ({
      ...rec,
      recommendationType: 'collaborative',
      score: (rec.userRating * 20).toString(), // Convert rating to percentage score
      reason: `Recommended because users with similar reading taste rated this ${rec.userRating}/5 stars`
    }));
  }

  /**
   * Content-based filtering: recommend books similar to ones user enjoyed
   */
  private async getContentBasedRecommendations(userId: string, userHistory: any[], limit: number): Promise<BookRecommendationWithDetails[]> {
    // Get highly rated books from user's history
    const likedBooks = userHistory.filter(h => h.rating && h.rating >= 4);
    if (likedBooks.length === 0) {
      return [];
    }

    // Get favorite authors
    const favoriteAuthors = [...new Set(likedBooks.map(b => b.author))];
    
    // Recommend books by favorite authors that user hasn't read
    const recommendations = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        coverImageUrl: books.coverImageUrl,
        rating: books.rating,
        totalRatings: books.totalRatings,
        requiredTier: books.requiredTier,
        pageCount: books.pageCount,
        publishedYear: books.publishedYear,
      })
      .from(books)
      .where(and(
        inArray(books.author, favoriteAuthors),
        not(inArray(books.id, 
          db.select({ bookId: loans.bookId })
            .from(loans)
            .where(eq(loans.userId, userId))
        )),
        gte(books.rating, sql`'4.0'`) // Only recommend well-rated books
      ))
      .orderBy(desc(books.rating), desc(books.totalRatings))
      .limit(limit);

    return recommendations.map(rec => ({
      ...rec,
      recommendationType: 'content_based',
      score: (parseFloat(rec.rating) * 20).toString(),
      reason: `You enjoyed other books by ${rec.author}. This book has ${rec.rating}/5 stars from ${rec.totalRatings} readers`
    }));
  }

  /**
   * Get trending/popular books user hasn't read
   */
  private async getTrendingRecommendations(userId: string, limit: number): Promise<BookRecommendationWithDetails[]> {
    const recommendations = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        coverImageUrl: books.coverImageUrl,
        rating: books.rating,
        totalRatings: books.totalRatings,
        requiredTier: books.requiredTier,
        pageCount: books.pageCount,
        publishedYear: books.publishedYear,
        recentLoans: sql<number>`count(${loans.id})`.as('recent_loans')
      })
      .from(books)
      .leftJoin(loans, and(
        eq(loans.bookId, books.id),
        gte(loans.createdAt, sql`now() - interval '30 days'`)
      ))
      .where(and(
        not(inArray(books.id, 
          db.select({ bookId: loans.bookId })
            .from(loans)
            .where(eq(loans.userId, userId))
        )),
        gte(books.rating, sql`'3.5'`),
        gt(books.totalRatings, 5)
      ))
      .groupBy(books.id, books.title, books.author, books.description, books.coverImageUrl, 
               books.rating, books.totalRatings, books.requiredTier, books.pageCount, books.publishedYear)
      .orderBy(desc(sql`count(${loans.id})`), desc(books.rating))
      .limit(limit);

    return recommendations.map(rec => ({
      ...rec,
      recommendationType: 'trending',
      score: ((rec.recentLoans * 10) + (parseFloat(rec.rating) * 10)).toString(),
      reason: `Trending now! ${rec.recentLoans} readers chose this book in the last 30 days. Average rating: ${rec.rating}/5`
    }));
  }

  /**
   * Personalized recommendations based on user preferences
   */
  private async getPersonalizedRecommendations(userId: string, preferences: any, limit: number): Promise<BookRecommendationWithDetails[]> {
    if (!preferences || !preferences.preferredAuthors?.length) {
      return [];
    }

    const recommendations = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        description: books.description,
        coverImageUrl: books.coverImageUrl,
        rating: books.rating,
        totalRatings: books.totalRatings,
        requiredTier: books.requiredTier,
        pageCount: books.pageCount,
        publishedYear: books.publishedYear,
      })
      .from(books)
      .where(and(
        inArray(books.author, preferences.preferredAuthors),
        not(inArray(books.id, 
          db.select({ bookId: loans.bookId })
            .from(loans)
            .where(eq(loans.userId, userId))
        )),
        gte(books.rating, sql`'3.0'`)
      ))
      .orderBy(desc(books.rating))
      .limit(limit);

    return recommendations.map(rec => ({
      ...rec,
      recommendationType: 'personalized',
      score: (parseFloat(rec.rating) * 20).toString(),
      reason: `Based on your reading preferences. You seem to enjoy books by ${rec.author}`
    }));
  }

  /**
   * Remove duplicate recommendations
   */
  private removeDuplicates(recommendations: BookRecommendationWithDetails[]): BookRecommendationWithDetails[] {
    const seen = new Set();
    return recommendations.filter(rec => {
      if (seen.has(rec.id)) {
        return false;
      }
      seen.add(rec.id);
      return true;
    });
  }

  /**
   * Save recommendations to database for tracking
   */
  async saveRecommendations(userId: string, recommendations: BookRecommendationWithDetails[]): Promise<void> {
    const insertData = recommendations.map(rec => ({
      userId,
      bookId: rec.id,
      recommendationType: rec.recommendationType,
      score: rec.score,
      reason: rec.reason,
      emailSent: false
    }));

    if (insertData.length > 0) {
      await db.insert(bookRecommendations).values(insertData);
    }
  }

  /**
   * Get users ready for recommendation emails
   */
  async getUsersForRecommendationEmails(): Promise<string[]> {
    // Get active users who haven't received recommendations in the last 7 days
    const users = await db
      .select({ userId: users.id })
      .from(users)
      .leftJoin(userReadingPreferences, eq(userReadingPreferences.userId, users.id))
      .where(and(
        eq(users.isActive, true),
        isNotNull(users.email),
        sql`(${userReadingPreferences.emailPreferences}->>'weeklyRecommendations')::boolean = true OR ${userReadingPreferences.emailPreferences} IS NULL`
      ));

    return users.map(u => u.userId);
  }

  /**
   * Mark recommendations as emailed
   */
  async markRecommendationsEmailed(userId: string, bookIds: string[]): Promise<void> {
    if (bookIds.length > 0) {
      await db
        .update(bookRecommendations)
        .set({ 
          emailSent: true, 
          emailSentAt: new Date() 
        })
        .where(and(
          eq(bookRecommendations.userId, userId),
          inArray(bookRecommendations.bookId, bookIds)
        ));
    }
  }
}

export const recommendationEngine = new BookRecommendationEngine();