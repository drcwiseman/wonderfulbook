import { db } from "./db";
import { userSelectedBooks, userSubscriptionCycles, users, books, subscriptionPlans, type UserSelectedBook, type UserSubscriptionCycle } from "@shared/schema";
import { eq, and, gt, lt, desc } from "drizzle-orm";

export class BookSelectionService {
  // Get user's currently selected and locked books
  async getUserSelectedBooks(userId: string): Promise<UserSelectedBook[]> {
    const now = new Date();
    return await db
      .select()
      .from(userSelectedBooks)
      .where(
        and(
          eq(userSelectedBooks.userId, userId),
          eq(userSelectedBooks.isActive, true),
          gt(userSelectedBooks.lockedUntil, now) // Only active locks
        )
      );
  }

  // Check if user can select more books based on their current tier
  async canSelectMoreBooks(userId: string): Promise<{ canSelect: boolean; reason?: string; availableSlots?: number }> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) {
      return { canSelect: false, reason: "User not found" };
    }

    const userTier = user[0].subscriptionTier;
    
    // Premium users have unlimited access - no selection needed
    if (userTier === "premium") {
      return { canSelect: true, availableSlots: -1 }; // -1 means unlimited
    }

    const currentlySelected = await this.getUserSelectedBooks(userId);
    
    if (userTier === "free") {
      const freeLimit = 3;
      const available = freeLimit - currentlySelected.length;
      return {
        canSelect: available > 0,
        reason: available <= 0 ? "Free trial limit of 3 books reached" : undefined,
        availableSlots: Math.max(0, available)
      };
    }

    if (userTier === "basic") {
      // Check current billing cycle
      const currentCycle = await this.getCurrentBillingCycle(userId);
      if (!currentCycle) {
        // Create new cycle if none exists
        await this.createNewBillingCycle(userId, "basic");
        return { canSelect: true, availableSlots: 10 };
      }

      const basicLimit = 10;
      const available = basicLimit - (currentCycle.booksSelectedCount || 0);
      return {
        canSelect: available > 0,
        reason: available <= 0 ? "Monthly limit of 10 books reached" : undefined,
        availableSlots: Math.max(0, available)
      };
    }

    return { canSelect: false, reason: "Invalid subscription tier" };
  }

  // Select a book for the user with appropriate lock period
  async selectBook(userId: string, bookId: string): Promise<{ success: boolean; message: string }> {
    const canSelect = await this.canSelectMoreBooks(userId);
    if (!canSelect.canSelect) {
      return { success: false, message: canSelect.reason || "Cannot select more books" };
    }

    // Check if book is already selected by user
    const existingSelection = await db
      .select()
      .from(userSelectedBooks)
      .where(
        and(
          eq(userSelectedBooks.userId, userId),
          eq(userSelectedBooks.bookId, bookId),
          eq(userSelectedBooks.isActive, true),
          gt(userSelectedBooks.lockedUntil, new Date())
        )
      )
      .limit(1);

    if (existingSelection[0]) {
      return { success: false, message: "Book already selected" };
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) {
      return { success: false, message: "User not found" };
    }

    const userTier = user[0].subscriptionTier;
    const now = new Date();
    let lockedUntil: Date;
    let billingCycleStart: Date | null = null;

    if (userTier === "free") {
      // Free trial: 7 days from selection
      lockedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (userTier === "basic") {
      // Basic plan: locked for current billing cycle (30 days)
      const currentCycle = await this.getCurrentBillingCycle(userId);
      if (!currentCycle) {
        // Create new cycle
        const newCycle = await this.createNewBillingCycle(userId, "basic");
        lockedUntil = newCycle.cycleEnd;
        billingCycleStart = newCycle.cycleStart;
      } else {
        lockedUntil = currentCycle.cycleEnd;
        billingCycleStart = currentCycle.cycleStart;
      }
    } else {
      return { success: false, message: "Premium users don't need to select books" };
    }

    // Insert the selection
    await db.insert(userSelectedBooks).values({
      userId,
      bookId,
      subscriptionTier: userTier,
      lockedUntil,
      billingCycleStart
    });

    // Update billing cycle book count for basic users
    if (userTier === "basic") {
      const currentCycle = await this.getCurrentBillingCycle(userId);
      if (currentCycle) {
        await db
          .update(userSubscriptionCycles)
          .set({ 
            booksSelectedCount: (currentCycle.booksSelectedCount || 0) + 1,
            updatedAt: now
          })
          .where(eq(userSubscriptionCycles.id, currentCycle.id));
      }
    }

    return { success: true, message: "Book selected successfully" };
  }

  // Get current billing cycle for a user
  async getCurrentBillingCycle(userId: string): Promise<UserSubscriptionCycle | null> {
    const now = new Date();
    const cycles = await db
      .select()
      .from(userSubscriptionCycles)
      .where(
        and(
          eq(userSubscriptionCycles.userId, userId),
          eq(userSubscriptionCycles.isActive, true),
          lt(userSubscriptionCycles.cycleStart, now),
          gt(userSubscriptionCycles.cycleEnd, now)
        )
      )
      .orderBy(desc(userSubscriptionCycles.createdAt))
      .limit(1);

    return cycles[0] || null;
  }

  // Create a new billing cycle (used for basic plan)
  async createNewBillingCycle(userId: string, tier: string): Promise<UserSubscriptionCycle> {
    const now = new Date();
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const maxBooks = tier === "basic" ? 10 : tier === "free" ? 3 : -1;

    const [newCycle] = await db
      .insert(userSubscriptionCycles)
      .values({
        userId,
        subscriptionTier: tier,
        cycleStart: now,
        cycleEnd,
        maxBooks,
        booksSelectedCount: 0
      })
      .returning();

    return newCycle;
  }

  // Check if user has access to a specific book
  async hasBookAccess(userId: string, bookId: string): Promise<boolean> {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return false;

    const userTier = user[0].subscriptionTier;

    // Premium users have access to all books
    if (userTier === "premium") {
      return true;
    }

    // Free and basic users need to have selected the book
    const now = new Date();
    const selectedBooks = await db
      .select()
      .from(userSelectedBooks)
      .where(
        and(
          eq(userSelectedBooks.userId, userId),
          eq(userSelectedBooks.bookId, bookId),
          eq(userSelectedBooks.isActive, true),
          gt(userSelectedBooks.lockedUntil, now)
        )
      )
      .limit(1);

    return selectedBooks.length > 0;
  }

  // Expire old selections and billing cycles (cleanup job)
  async expireOldSelections(): Promise<void> {
    const now = new Date();
    
    // Deactivate expired book selections
    await db
      .update(userSelectedBooks)
      .set({ isActive: false, updatedAt: now })
      .where(
        and(
          eq(userSelectedBooks.isActive, true),
          lt(userSelectedBooks.lockedUntil, now)
        )
      );

    // Deactivate expired billing cycles
    await db
      .update(userSubscriptionCycles)
      .set({ isActive: false, updatedAt: now })
      .where(
        and(
          eq(userSubscriptionCycles.isActive, true),
          lt(userSubscriptionCycles.cycleEnd, now)
        )
      );
  }

  // Reset basic user's book selection for new billing cycle
  async resetBasicUserBooks(userId: string): Promise<void> {
    // This is called when a basic user's billing cycle renews
    const now = new Date();
    
    // Deactivate all current selections
    await db
      .update(userSelectedBooks)
      .set({ isActive: false, updatedAt: now })
      .where(
        and(
          eq(userSelectedBooks.userId, userId),
          eq(userSelectedBooks.subscriptionTier, "basic"),
          eq(userSelectedBooks.isActive, true)
        )
      );

    // Create new billing cycle
    await this.createNewBillingCycle(userId, "basic");
  }

  // Get available books for selection (excludes already selected)
  async getAvailableBooksForSelection(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0]) return [];

    const userTier = user[0].subscriptionTier;

    // Premium users don't select books, they have access to all
    if (userTier === "premium") {
      return await db.select().from(books).where(eq(books.isFeatured, true));
    }

    // Get already selected books
    const selectedBooks = await this.getUserSelectedBooks(userId);
    const selectedBookIds = selectedBooks.map(sb => sb.bookId);

    // Return books not already selected
    const query = db.select().from(books);
    if (selectedBookIds.length > 0) {
      return await query.where(
        and(
          eq(books.isFeatured, true)
          // Add NOT IN clause for selectedBookIds - simplified for now
        )
      );
    } else {
      return await query.where(eq(books.isFeatured, true));
    }
  }
}

export const bookSelectionService = new BookSelectionService();