import { db } from '../db.js';
import { loans, books, users, systemConfig } from '../../shared/schema.js';
import { and, eq, count, desc, inArray } from 'drizzle-orm';
import { LicenseService } from './licenseService.js';
import type { InsertLoan, Loan } from '../../shared/schema.js';

export class LoanService {
  // Create a new loan (borrow a book)
  static async createLoan(userId: string, bookId: string, loanType: 'subscription' | 'trial' = 'subscription'): Promise<Loan> {
    // Check loan cap
    const loanCap = await this.getSystemConfig('LOAN_CAP', '20');
    const activeLoans = await this.getActiveLoansCount(userId);

    if (activeLoans >= parseInt(loanCap)) {
      throw new Error(`Loan limit reached. You can have up to ${loanCap} active loans.`);
    }

    // Check if book exists and is available
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      throw new Error('Book not found');
    }

    // Check if user already has an active loan for this book
    const existingLoan = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.userId, userId),
        eq(loans.bookId, bookId),
        eq(loans.status, 'active')
      ))
      .limit(1);

    if (existingLoan.length > 0) {
      throw new Error('You already have an active loan for this book');
    }

    // Create the loan
    const loanData: InsertLoan = {
      userId,
      bookId,
      loanType,
      status: 'active',
    };

    const [newLoan] = await db
      .insert(loans)
      .values(loanData)
      .returning();

    return newLoan;
  }

  // Return a loan
  static async returnLoan(loanId: string, userId: string): Promise<void> {
    const [loan] = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.id, loanId),
        eq(loans.userId, userId),
        eq(loans.status, 'active')
      ))
      .limit(1);

    if (!loan) {
      throw new Error('Loan not found or already returned');
    }

    // Update loan status
    await db
      .update(loans)
      .set({
        status: 'returned',
        returnedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId));

    // Revoke all licenses for this loan
    await LicenseService.revokeLicensesForLoan(loanId);
  }

  // Revoke a loan (admin action)
  static async revokeLoan(loanId: string, revokedBy: string, reason?: string): Promise<void> {
    const [loan] = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.id, loanId),
        eq(loans.status, 'active')
      ))
      .limit(1);

    if (!loan) {
      throw new Error('Loan not found or already inactive');
    }

    // Update loan status
    await db
      .update(loans)
      .set({
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy,
        revokeReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId));

    // Revoke all licenses for this loan
    await LicenseService.revokeLicensesForLoan(loanId, revokedBy);
  }

  // Get user's active loans
  static async getUserLoans(userId: string, status?: 'active' | 'returned' | 'revoked'): Promise<Array<Loan & { book: any }>> {
    const query = db
      .select({
        ...loans,
        book: books,
      })
      .from(loans)
      .innerJoin(books, eq(books.id, loans.bookId))
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));

    if (status) {
      query.where(and(
        eq(loans.userId, userId),
        eq(loans.status, status)
      ));
    }

    return await query;
  }

  // Get active loans count for a user
  static async getActiveLoansCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(loans)
      .where(and(
        eq(loans.userId, userId),
        eq(loans.status, 'active')
      ));

    return result.count;
  }

  // Get loans by book (for analytics)
  static async getLoansByBook(bookId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.bookId, bookId))
      .orderBy(desc(loans.createdAt));
  }

  // Get all active loans (admin view)
  static async getAllActiveLoans(): Promise<Array<Loan & { user: any; book: any }>> {
    return await db
      .select({
        ...loans,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        book: books,
      })
      .from(loans)
      .innerJoin(users, eq(users.id, loans.userId))
      .innerJoin(books, eq(books.id, loans.bookId))
      .where(eq(loans.status, 'active'))
      .orderBy(desc(loans.createdAt));
  }

  // Bulk return loans for a user (when subscription ends)
  static async returnAllUserLoans(userId: string, reason: string = 'Subscription ended'): Promise<void> {
    const activeLoans = await db
      .select()
      .from(loans)
      .where(and(
        eq(loans.userId, userId),
        eq(loans.status, 'active')
      ));

    if (activeLoans.length === 0) {
      return;
    }

    const loanIds = activeLoans.map(loan => loan.id);

    // Update loan statuses
    await db
      .update(loans)
      .set({
        status: 'returned',
        returnedAt: new Date(),
        revokeReason: reason,
        updatedAt: new Date(),
      })
      .where(inArray(loans.id, loanIds));

    // Revoke all licenses for these loans
    for (const loanId of loanIds) {
      await LicenseService.revokeLicensesForLoan(loanId);
    }
  }

  // Check if user can borrow more books
  static async canUserBorrow(userId: string): Promise<{ canBorrow: boolean; reason?: string; activeLoans: number; maxLoans: number }> {
    const loanCap = parseInt(await this.getSystemConfig('LOAN_CAP', '20'));
    const activeLoans = await this.getActiveLoansCount(userId);

    if (activeLoans >= loanCap) {
      return {
        canBorrow: false,
        reason: `You have reached the maximum of ${loanCap} active loans. Please return a book before borrowing another.`,
        activeLoans,
        maxLoans: loanCap,
      };
    }

    return {
      canBorrow: true,
      activeLoans,
      maxLoans: loanCap,
    };
  }

  // Helper to get system configuration
  private static async getSystemConfig(key: string, defaultValue: string): Promise<string> {
    const [config] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key))
      .limit(1);

    return config?.value || defaultValue;
  }

  // Get loan statistics
  static async getLoanStatistics(): Promise<{
    totalActiveLoans: number;
    totalReturned: number;
    totalRevoked: number;
    averageLoansPerUser: number;
    topBooks: Array<{ bookId: string; title: string; loanCount: number }>;
  }> {
    const [activeCount] = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, 'active'));

    const [returnedCount] = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, 'returned'));

    const [revokedCount] = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, 'revoked'));

    // Would need more complex queries for average and top books
    // This is a simplified version
    
    return {
      totalActiveLoans: activeCount.count,
      totalReturned: returnedCount.count,
      totalRevoked: revokedCount.count,
      averageLoansPerUser: 0, // TODO: Calculate actual average
      topBooks: [], // TODO: Get actual top books
    };
  }
}