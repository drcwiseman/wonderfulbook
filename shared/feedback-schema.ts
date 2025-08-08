import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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

export const feedbackUpvotes = pgTable("feedback_upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feedbackId: varchar("feedback_id").references(() => feedback.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
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
});

export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments, {
  comment: z.string().min(1, "Comment cannot be empty"),
});

export const selectFeedbackSchema = createSelectSchema(feedback);
export const selectFeedbackCommentSchema = createSelectSchema(feedbackComments);

export type Feedback = z.infer<typeof selectFeedbackSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type FeedbackComment = z.infer<typeof selectFeedbackCommentSchema>;
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;

import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/pg-core";
import { users } from "./schema";