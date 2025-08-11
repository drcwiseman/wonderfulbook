import { sql, relations } from 'drizzle-orm';
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
import crypto from "crypto";

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

// User storage table for production auth system
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  role: varchar("role").default("user"), // user, admin, super_admin
  // Legacy fields for backward compatibility
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  authProvider: varchar("auth_provider").default("local"), // replit, local, google
  // Subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier").default("free"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  booksReadThisMonth: integer("books_read_this_month").default(0),
  lastLoginAt: timestamp("last_login_at"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  // Anti-abuse fields for free trial
  freeTrialUsed: boolean("free_trial_used").default(false),
  freeTrialStartedAt: timestamp("free_trial_started_at"),
  freeTrialEndedAt: timestamp("free_trial_ended_at"),
  registrationIp: varchar("registration_ip"), // Track IP for duplicate prevention
  deviceFingerprint: varchar("device_fingerprint"), // Browser/device fingerprint
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_phone_idx").on(table.phone),
]);

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

// Books table (enhanced with encryption and chunking)
export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  longDescription: text("long_description"), // Extended book description
  authorBio: text("author_bio"), // Author biography
  publishedYear: integer("published_year"),
  pageCount: integer("page_count"),
  tableOfContents: text("table_of_contents").array(), // Chapter/section titles
  keyTakeaways: text("key_takeaways").array(), // Main learning points
  targetAudience: text("target_audience"), // Who this book is for
  coverImageUrl: text("cover_image_url"),
  pdfUrl: text("pdf_url"),
  // Enhanced security fields
  storagePath: text("storage_path"), // Path to encrypted chunks
  sha256: varchar("sha256"), // File hash for integrity
  fileSize: integer("file_size"), // Original file size in bytes
  chunkSize: integer("chunk_size").default(1048576), // 1MB chunks
  chunkCount: integer("chunk_count").default(0),
  encryptionKeyId: varchar("encryption_key_id"), // Reference to encryption key
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalRatings: integer("total_ratings").default(0),
  totalReviews: integer("total_reviews").default(0),
  isFeatured: boolean("is_featured").default(false),
  requiredTier: varchar("required_tier").default("free"),
  previewPageCount: integer("preview_page_count").default(5), // Pages available for preview
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

// Copy tracking table for 40% copy limit enforcement
export const userCopyTracking = pgTable("user_copy_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  totalCharactersCopied: integer("total_characters_copied").default(0),
  totalBookCharacters: integer("total_book_characters").notNull(), // Total characters in the book
  copyPercentage: decimal("copy_percentage", { precision: 5, scale: 2 }).default("0.00"),
  maxCopyPercentage: decimal("max_copy_percentage", { precision: 5, scale: 2 }).default("40.00"),
  lastCopyAt: timestamp("last_copy_at"),
  isLimitReached: boolean("is_limit_reached").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserBook: unique("unique_user_book_copy").on(table.userId, table.bookId),
}));

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

// Book reviews table
export const bookReviews = pgTable("book_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewTitle: varchar("review_title", { length: 200 }),
  reviewText: text("review_text"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulVotes: integer("helpful_votes").default(0),
  isApproved: boolean("is_approved").default(true), // For moderation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserBookReview: unique("unique_user_book_review").on(table.userId, table.bookId),
}));

// Review helpfulness votes
export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reviewId: varchar("review_id").references(() => bookReviews.id, { onDelete: "cascade" }).notNull(),
  isHelpful: boolean("is_helpful").notNull(), // true for helpful, false for not helpful
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserReviewVote: unique("unique_user_review_vote").on(table.userId, table.reviewId),
}));

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

export const insertBookReviewSchema = createInsertSchema(bookReviews).omit({
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

// New production auth schemas
export const newRegisterSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(7, "Phone must be at least 7 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  captchaToken: z.string().min(1, "Captcha verification required")
});

export const newLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  captchaToken: z.string().min(1, "Captcha verification required")
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters")
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
export type UserCopyTracking = typeof userCopyTracking.$inferSelect;
export type InsertUserCopyTracking = typeof userCopyTracking.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type BookReview = typeof bookReviews.$inferSelect;
export type InsertBookReview = z.infer<typeof insertBookReviewSchema>;
export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type InsertReviewHelpfulVote = typeof reviewHelpfulVotes.$inferInsert;

// ===== FEEDBACK SYSTEM =====

// Feedback submission table
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'bug', 'feedback', 'suggestion', 'compliment'
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 20 }).notNull().default('medium'), // 'low', 'medium', 'high', 'critical'
  status: varchar("status", { length: 50 }).notNull().default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  url: text("url").notNull(),
  userAgent: text("user_agent").notNull(),
  screenshot: text("screenshot"), // base64 encoded image
  deviceInfo: jsonb("device_info").notNull(),
  adminResponse: text("admin_response"),
  adminResponseBy: varchar("admin_response_by").references(() => users.id),
  adminResponseAt: timestamp("admin_response_at"),
  isPublic: boolean("is_public").default(false), // Whether feedback can be shown publicly
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedbackComments = pgTable("feedback_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feedbackId: varchar("feedback_id").references(() => feedback.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false), // Internal admin comments
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for feedback
export const insertFeedbackSchema = createInsertSchema(feedback, {
  type: z.enum(['bug', 'feedback', 'suggestion', 'compliment']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  deviceInfo: z.object({
    platform: z.string(),
    browser: z.string(),
    screenResolution: z.string(),
    viewport: z.string(),
  }),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments, {
  comment: z.string().min(1, "Comment cannot be empty"),
}).omit({ id: true, createdAt: true });

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type FeedbackComment = typeof feedbackComments.$inferSelect;
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;

// ===== DEVICE MANAGEMENT & DRM SYSTEM =====

// User devices table for device-bound licensing
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(), // User-friendly device name
  publicKey: text("public_key").notNull(), // Device public key for encryption
  deviceFingerprint: varchar("device_fingerprint"), // Browser/device fingerprint
  userAgent: text("user_agent"), // Browser user agent
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Book loans table (replaces userSelectedBooks for new loan system)
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  status: varchar("status").notNull().default("active"), // active, returned, revoked
  loanType: varchar("loan_type").notNull().default("subscription"), // subscription, trial
  startedAt: timestamp("started_at").defaultNow(),
  returnedAt: timestamp("returned_at"),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id), // Admin who revoked
  revokeReason: text("revoke_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userActiveLoansIndex: index("idx_user_active_loans").on(table.userId, table.status),
  bookLoansIndex: index("idx_book_loans").on(table.bookId),
}));

// Device-bound licenses table
export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").references(() => loans.id).notNull(),
  deviceId: varchar("device_id").references(() => devices.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Denormalized for performance
  bookId: varchar("book_id").references(() => books.id).notNull(), // Denormalized for performance
  keyWrapped: text("key_wrapped").notNull(), // AES key wrapped with device public key
  offlineExpiresAt: timestamp("offline_expires_at").notNull(),
  policy: jsonb("policy").notNull(), // License policy (watermark info, restrictions)
  signature: text("signature").notNull(), // Ed25519 signature of license
  serverTime: timestamp("server_time").defaultNow(), // Server time when issued
  revoked: boolean("revoked").default(false),
  revokedAt: timestamp("revoked_at"),
  lastRenewedAt: timestamp("last_renewed_at"),
  renewalCount: integer("renewal_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  deviceLicensesIndex: index("idx_device_licenses").on(table.deviceId),
  userLicensesIndex: index("idx_user_licenses").on(table.userId),
  loanLicenseIndex: unique("unique_loan_device").on(table.loanId, table.deviceId),
  expiryIndex: index("idx_license_expiry").on(table.offlineExpiresAt),
}));

// Book chunks table for encrypted content delivery
export const bookChunks = pgTable("book_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  encryptedData: text("encrypted_data").notNull(), // Base64 encoded encrypted chunk
  iv: varchar("iv").notNull(), // Initialization vector for this chunk
  size: integer("size").notNull(), // Size of encrypted chunk
  sha256: varchar("sha256").notNull(), // Hash of encrypted chunk for integrity
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  bookChunkIndex: unique("unique_book_chunk").on(table.bookId, table.chunkIndex),
}));

// System configuration for DRM settings
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  dataType: varchar("data_type").notNull().default("string"), // string, number, boolean, json
  isEditable: boolean("is_editable").default(true),
  category: varchar("category").default("general"),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// DRM-related schemas
export const insertDeviceSchema = createInsertSchema(devices, {
  name: z.string().min(1, "Device name is required"),
  publicKey: z.string().min(1, "Public key is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoanSchema = createInsertSchema(loans, {
  status: z.enum(["active", "returned", "revoked"]).optional(),
  loanType: z.enum(["subscription", "trial"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseSchema = createInsertSchema(licenses, {
  policy: z.object({
    watermark: z.object({
      name: z.string(),
      email: z.string(),
      loanId: z.string(),
    }),
    copyProtection: z.object({
      enabled: z.boolean().default(true),
      maxCopyPercentage: z.number().default(40),
    }),
    offlineAccess: z.object({
      enabled: z.boolean().default(true),
      maxDays: z.number().default(30),
    }),
  }),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig, {
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  dataType: z.enum(["string", "number", "boolean", "json"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced types
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type BookChunk = typeof bookChunks.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

// ===== SOCIAL READING CHALLENGES =====

// Reading challenges table
export const readingChallenges = pgTable("reading_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // books_count, pages_count, time_duration
  targetValue: integer("target_value").notNull(), // e.g., 5 books, 1000 pages, 30 days
  duration: varchar("duration").notNull(), // weekly, monthly, custom
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isPublic: boolean("is_public").default(true),
  isActive: boolean("is_active").default(true),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  maxParticipants: integer("max_participants"), // null for unlimited
  rules: text("rules").array(), // Array of challenge rules
  tags: varchar("tags").array(), // Array of tags for categorization
  difficulty: varchar("difficulty").default("medium"), // easy, medium, hard
  prize: text("prize"), // Optional prize description
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIndex: index("idx_challenge_type").on(table.type),
  statusIndex: index("idx_challenge_status").on(table.isActive, table.isPublic),
  dateIndex: index("idx_challenge_dates").on(table.startDate, table.endDate),
  creatorIndex: index("idx_challenge_creator").on(table.createdById),
}));

// Challenge participants table
export const challengeParticipants = pgTable("challenge_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => readingChallenges.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  progress: integer("progress").default(0), // Current progress value
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  rank: integer("rank"), // Leaderboard position
  notes: text("notes"), // Personal notes or motivational message
}, (table) => ({
  challengeUserIndex: index("idx_challenge_user").on(table.challengeId, table.userId),
  challengeProgressIndex: index("idx_challenge_progress").on(table.challengeId, table.progress),
  userChallengesIndex: index("idx_user_challenges").on(table.userId),
}));

// Challenge updates/activities table
export const challengeActivities = pgTable("challenge_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => readingChallenges.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type").notNull(), // joined, progress_update, completed, comment
  message: text("message"),
  progressValue: integer("progress_value"), // Progress at time of activity
  metadata: jsonb("metadata"), // Additional activity data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  challengeActivityIndex: index("idx_challenge_activity").on(table.challengeId, table.createdAt),
  userActivityIndex: index("idx_user_activity").on(table.userId, table.createdAt),
}));

// Challenge comments table
export const challengeComments = pgTable("challenge_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => readingChallenges.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentId: varchar("parent_id"), // For reply threading
  likes: integer("likes").default(0),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  challengeCommentsIndex: index("idx_challenge_comments").on(table.challengeId, table.createdAt),
  parentCommentIndex: index("idx_parent_comment").on(table.parentId),
}));

// Relations for social challenges
export const challengesRelations = relations(readingChallenges, ({ one, many }) => ({
  creator: one(users, {
    fields: [readingChallenges.createdById],
    references: [users.id],
  }),
  participants: many(challengeParticipants),
  activities: many(challengeActivities),
  comments: many(challengeComments),
}));

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one }) => ({
  challenge: one(readingChallenges, {
    fields: [challengeParticipants.challengeId],
    references: [readingChallenges.id],
  }),
  user: one(users, {
    fields: [challengeParticipants.userId],
    references: [users.id],
  }),
}));

export const challengeActivitiesRelations = relations(challengeActivities, ({ one }) => ({
  challenge: one(readingChallenges, {
    fields: [challengeActivities.challengeId],
    references: [readingChallenges.id],
  }),
  user: one(users, {
    fields: [challengeActivities.userId],
    references: [users.id],
  }),
}));

export const challengeCommentsRelations = relations(challengeComments, ({ one }) => ({
  challenge: one(readingChallenges, {
    fields: [challengeComments.challengeId],
    references: [readingChallenges.id],
  }),
  user: one(users, {
    fields: [challengeComments.userId],
    references: [users.id],
  }),
}));

// Challenge schemas
export const insertChallengeSchema = createInsertSchema(readingChallenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
}).extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["books_count", "pages_count", "time_duration"]),
  targetValue: z.number().min(1, "Target value must be positive"),
  duration: z.enum(["weekly", "monthly", "custom"]),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  maxParticipants: z.number().positive().optional(),
  rules: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const insertParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
  joinedAt: true,
});

export const updateProgressSchema = z.object({
  progress: z.number().min(0),
  notes: z.string().optional(),
});

export const insertActivitySchema = createInsertSchema(challengeActivities).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(challengeComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  isEdited: true,
}).extend({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

// Challenge types
export type ReadingChallenge = typeof readingChallenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type UpdateProgress = z.infer<typeof updateProgressSchema>;
export type ChallengeActivity = typeof challengeActivities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ChallengeComment = typeof challengeComments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// ===== AUDIT LOGS =====

// Audit logs table for tracking system activities
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action").notNull(), // e.g., 'login', 'book_access', 'admin_action', 'subscription_change'
  resource: varchar("resource"), // e.g., 'user', 'book', 'subscription', 'system'
  resourceId: varchar("resource_id"), // ID of the affected resource
  details: jsonb("details"), // Additional details about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  severity: varchar("severity").notNull().default('info'), // 'info', 'warning', 'error', 'critical'
  status: varchar("status").notNull().default('success'), // 'success', 'failure', 'warning'
  sessionId: varchar("session_id"), // Session identifier
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIndex: index("idx_audit_user").on(table.userId),
  actionIndex: index("idx_audit_action").on(table.action),
  resourceIndex: index("idx_audit_resource").on(table.resource, table.resourceId),
  severityIndex: index("idx_audit_severity").on(table.severity),
  dateIndex: index("idx_audit_date").on(table.createdAt),
  ipIndex: index("idx_audit_ip").on(table.ipAddress),
}));

// Audit log relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Audit log schemas
export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  action: z.string().min(1, "Action is required"),
  severity: z.enum(['info', 'warning', 'error', 'critical']).default('info'),
  status: z.enum(['success', 'failure', 'warning']).default('success'),
  details: z.object({}).passthrough().optional(),
}).omit({ id: true, createdAt: true });

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// ===== SYSTEM HEALTH MONITORING =====

// Health check runs table
export const healthCheckRuns = pgTable("health_check_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  overallStatus: varchar("overall_status").notNull(), // 'OK' | 'WARN' | 'FAIL'
  summaryJson: jsonb("summary_json").notNull().default({}),
}, (table) => [
  index("idx_health_runs_started").on(table.startedAt.desc())
]);

// Health check items table
export const healthCheckItems = pgTable("health_check_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").references(() => healthCheckRuns.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(), // 'server'|'database'|'stripe'|'smtp'|'storage'|'external_api'
  status: varchar("status").notNull(), // 'OK'|'WARN'|'FAIL'
  durationMs: integer("duration_ms").notNull().default(0),
  message: text("message"),
  metaJson: jsonb("meta_json").notNull().default({}),
}, (table) => [
  index("idx_health_items_run").on(table.runId)
]);

// Health alert state table for cooldown tracking
export const healthAlertState = pgTable("health_alert_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: varchar("alert_type").notNull(), // 'system_failure', 'recovery'
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull(),
  status: varchar("status").notNull(), // 'FAIL' | 'OK'
  cooldownMinutes: integer("cooldown_minutes").notNull().default(30),
  createdAt: timestamp("created_at").defaultNow(),
});

// Health check relationships
export const healthCheckRunsRelations = relations(healthCheckRuns, ({ many }) => ({
  items: many(healthCheckItems),
}));

export const healthCheckItemsRelations = relations(healthCheckItems, ({ one }) => ({
  run: one(healthCheckRuns, {
    fields: [healthCheckItems.runId],
    references: [healthCheckRuns.id],
  }),
}));

// Zod schemas for health checks
export const insertHealthCheckRunSchema = createInsertSchema(healthCheckRuns).omit({
  id: true,
  startedAt: true,
});

export const insertHealthCheckItemSchema = createInsertSchema(healthCheckItems).omit({
  id: true,
});

export type HealthCheckRun = typeof healthCheckRuns.$inferSelect;
export type InsertHealthCheckRun = z.infer<typeof insertHealthCheckRunSchema>;
export type HealthCheckItem = typeof healthCheckItems.$inferSelect;
export type InsertHealthCheckItem = z.infer<typeof insertHealthCheckItemSchema>;
export type HealthAlertState = typeof healthAlertState.$inferSelect;
