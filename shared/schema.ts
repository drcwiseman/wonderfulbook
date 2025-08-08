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
  role: varchar("role").default("user"), // user, admin, super_admin
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
  longDescription: text("long_description"), // Extended book description
  authorBio: text("author_bio"), // Author biography
  publishedYear: integer("published_year"),
  pageCount: integer("page_count"),
  tableOfContents: text("table_of_contents").array(), // Chapter/section titles
  keyTakeaways: text("key_takeaways").array(), // Main learning points
  targetAudience: text("target_audience"), // Who this book is for
  coverImageUrl: text("cover_image_url"),
  pdfUrl: text("pdf_url"),
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
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
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
