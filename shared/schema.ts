import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth and Local Registration
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Local authentication fields
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"), // For local auth
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  // OAuth provider info
  authProvider: varchar("auth_provider").default("replit"), // replit, local, google
  // Subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier").default("free"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  booksReadThisMonth: integer("books_read_this_month").default(0),
  role: varchar("role").default("user"), // user, admin, moderator
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Anti-abuse fields for free trial
  freeTrialUsed: boolean("free_trial_used").default(false),
  freeTrialStartedAt: timestamp("free_trial_started_at"),
  freeTrialEndedAt: timestamp("free_trial_ended_at"),
  registrationIp: varchar("registration_ip"), // Track IP for duplicate prevention
  deviceFingerprint: varchar("device_fingerprint"), // Browser/device fingerprint
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription plans table (admin configurable)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  price: varchar("price").notNull(), // Display price (e.g., "£9.99")
  priceAmount: integer("price_amount").notNull(), // Price in pence/cents
  currency: varchar("currency").default("GBP"),
  period: varchar("period").default("per month"),
  description: text("description"),
  bookLimit: integer("book_limit").default(3), // -1 for unlimited
  features: text("features").array(), // Array of feature strings
  isActive: boolean("is_active").default(true),
  stripePriceId: varchar("stripe_price_id"),
  displayOrder: integer("display_order").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Books table
export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  pdfUrl: text("pdf_url"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalRatings: integer("total_ratings").default(0),
  isFeatured: boolean("is_featured").default(false),
  requiredTier: varchar("required_tier").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User's selected books with lock periods
export const userSelectedBooks = pgTable("user_selected_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  subscriptionTier: varchar("subscription_tier").notNull(), // free, basic, premium
  selectedAt: timestamp("selected_at").defaultNow(),
  lockedUntil: timestamp("locked_until").notNull(), // When access expires
  billingCycleStart: timestamp("billing_cycle_start"), // For basic plan monthly reset
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueActiveUserBook: unique("unique_active_user_book").on(table.userId, table.bookId, table.isActive),
}));

// User subscription cycles for tracking monthly resets
export const userSubscriptionCycles = pgTable("user_subscription_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionTier: varchar("subscription_tier").notNull(),
  cycleStart: timestamp("cycle_start").notNull(),
  cycleEnd: timestamp("cycle_end").notNull(),
  booksSelectedCount: integer("books_selected_count").default(0),
  maxBooks: integer("max_books").notNull(), // Book limit for this cycle
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Anti-abuse tracking table for free trial prevention
export const freeTrialAbusePrevention = pgTable("free_trial_abuse_prevention", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  emailDomain: varchar("email_domain").notNull(), // Extract domain for tracking
  registrationIp: varchar("registration_ip").notNull(),
  deviceFingerprint: varchar("device_fingerprint"), // Browser fingerprint
  userId: varchar("user_id").references(() => users.id),
  freeTrialStartedAt: timestamp("free_trial_started_at").notNull(),
  freeTrialEndedAt: timestamp("free_trial_ended_at"),
  isBlocked: boolean("is_blocked").default(false),
  blockReason: varchar("block_reason"), // reason for blocking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIndex: index("idx_email_domain").on(table.email),
  ipIndex: index("idx_registration_ip").on(table.registrationIp),
  fingerprintIndex: index("idx_device_fingerprint").on(table.deviceFingerprint),
}));

// Rate limiting table for signup attempts
export const signupAttempts = pgTable("signup_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  registrationIp: varchar("registration_ip").notNull(),
  deviceFingerprint: varchar("device_fingerprint"),
  attemptedAt: timestamp("attempted_at").defaultNow(),
  successful: boolean("successful").default(false),
  blockUntil: timestamp("block_until"), // Temporary block timestamp
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ipAttemptIndex: index("idx_ip_attempt").on(table.registrationIp, table.attemptedAt),
  emailAttemptIndex: index("idx_email_attempt").on(table.email, table.attemptedAt),
}));

// User reading progress
export const readingProgress = pgTable("reading_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  currentPage: integer("current_page").default(0),
  totalPages: integer("total_pages").default(0),
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0.00"),
  lastReadAt: timestamp("last_read_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserBook: unique("unique_user_book").on(table.userId, table.bookId),
}));

// User bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  page: integer("page").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table for book organization
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports for the new tables
export type UserSelectedBook = typeof userSelectedBooks.$inferSelect;
export type InsertUserSelectedBook = typeof userSelectedBooks.$inferInsert;
export type UserSubscriptionCycle = typeof userSubscriptionCycles.$inferSelect;
export type InsertUserSubscriptionCycle = typeof userSubscriptionCycles.$inferInsert;

// Junction table for many-to-many relationship between books and categories
export const bookCategories = pgTable("book_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for validation
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReadingProgressSchema = createInsertSchema(readingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookCategorySchema = createInsertSchema(bookCategories).omit({
  id: true,
  createdAt: true,
});

// Admin user management schemas
export const adminUpdateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["user", "admin", "moderator"]).optional(),
  subscriptionTier: z.enum(["free", "basic", "premium"]).optional(),
  subscriptionStatus: z.enum(["active", "inactive", "cancelled"]).optional(),
  isActive: z.boolean().optional(),
});

export const passwordResetSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
  sendResetEmail: z.boolean().default(false),
});

export const bulkUserUpdateSchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user must be selected"),
  updates: adminUpdateUserSchema,
});

// Local authentication schemas
export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// Subscription Plans types  
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").optional(),
  price: z.string().min(1, "Price display is required").optional(),
  priceAmount: z.number().min(0, "Price amount must be positive").optional(),
  currency: z.string().min(1, "Currency is required").optional(),
  period: z.string().min(1, "Period is required").optional(),
  description: z.string().optional(),
  bookLimit: z.number().min(-1, "Book limit must be -1 (unlimited) or positive").optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  stripePriceId: z.string().optional(),
  displayOrder: z.number().min(1, "Display order must be positive").optional(),
});

// Email preferences table for unsubscribe handling
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  email: varchar("email").notNull(),
  unsubscribeToken: varchar("unsubscribe_token").notNull().unique(),
  marketingEmails: boolean("marketing_emails").default(true),
  trialReminders: boolean("trial_reminders").default(true),
  subscriptionUpdates: boolean("subscription_updates").default(true),
  isUnsubscribedAll: boolean("is_unsubscribed_all").default(false),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userEmailIndex: index("idx_user_email_prefs").on(table.userId, table.email),
  tokenIndex: index("idx_unsubscribe_token").on(table.unsubscribeToken),
}));

// Email logs table for tracking sent emails
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  email: varchar("email").notNull(),
  emailType: varchar("email_type").notNull(), // trial_reminder, conversion_success, cancellation, etc.
  subject: text("subject").notNull(),
  status: varchar("status").notNull(), // sent, failed, queued
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userEmailTypeIndex: index("idx_user_email_type").on(table.userId, table.emailType),
  statusIndex: index("idx_email_status").on(table.status),
  sentAtIndex: index("idx_sent_at").on(table.sentAt),
}));

// Email preferences schemas
export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEmailPreferencesSchema = z.object({
  marketingEmails: z.boolean().optional(),
  trialReminders: z.boolean().optional(),
  subscriptionUpdates: z.boolean().optional(),
  isUnsubscribedAll: z.boolean().optional(),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type AdminUpdateUser = z.infer<typeof adminUpdateUserSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type BulkUserUpdate = z.infer<typeof bulkUserUpdateSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
export type InsertReadingProgress = z.infer<typeof insertReadingProgressSchema>;
export type ReadingProgress = typeof readingProgress.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertBookCategory = z.infer<typeof insertBookCategorySchema>;
export type BookCategory = typeof bookCategories.$inferSelect;
export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type UpdateEmailPreferences = z.infer<typeof updateEmailPreferencesSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
