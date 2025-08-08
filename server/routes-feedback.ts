import type { Express } from "express";
import { db } from "./db";
import { feedback, feedbackComments, insertFeedbackSchema, insertFeedbackCommentSchema, users } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

// Local authentication middleware (copied from main routes)
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = { ...req.session.user };
  next();
};

export function registerFeedbackRoutes(app: Express) {
  // Submit new feedback
  app.post('/api/feedback', async (req, res) => {
    try {
      // Validate the input
      const validatedData = insertFeedbackSchema.parse({
        ...req.body,
        userId: (req as any).session?.userId || null, // Optional user ID
        status: 'open', // Default status for new feedback
      });

      // Insert feedback into database
      const [newFeedback] = await db
        .insert(feedback)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        feedback: newFeedback,
        message: "Feedback submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        error: "Failed to submit feedback"
      });
    }
  });

  // Get all feedback (admin only)
  app.get('/api/feedback', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, (req as any).user.id),
      });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required."
        });
      }

      const { status, type, priority, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions
      const whereConditions = [];
      if (status) whereConditions.push(eq(feedback.status, status as string));
      if (type) whereConditions.push(eq(feedback.type, type as string));
      if (priority) whereConditions.push(eq(feedback.priority, priority as string));

      // Get feedback with user information
      const feedbackList = await db
        .select({
          feedback: feedback,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(feedback.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(feedback)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      res.json({
        success: true,
        feedback: feedbackList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch feedback"
      });
    }
  });

  // Get single feedback with comments (admin only)
  app.get('/api/feedback/:id', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, (req as any).user.id),
      });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required."
        });
      }

      const { id } = req.params;

      // Get feedback with user info
      const [feedbackItem] = await db
        .select({
          feedback: feedback,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(feedback)
        .leftJoin(users, eq(feedback.userId, users.id))
        .where(eq(feedback.id, id));

      if (!feedbackItem) {
        return res.status(404).json({
          success: false,
          error: "Feedback not found"
        });
      }

      // Get comments
      const comments = await db
        .select({
          comment: feedbackComments,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(feedbackComments)
        .leftJoin(users, eq(feedbackComments.userId, users.id))
        .where(eq(feedbackComments.feedbackId, id))
        .orderBy(feedbackComments.createdAt);

      res.json({
        success: true,
        feedback: feedbackItem.feedback,
        user: feedbackItem.user,
        comments
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch feedback"
      });
    }
  });

  // Update feedback status (admin only)
  app.patch('/api/feedback/:id', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, (req as any).user.id),
      });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required."
        });
      }

      const { id } = req.params;
      const { status, adminResponse } = req.body;

      const updateData: any = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (adminResponse) {
        updateData.adminResponse = adminResponse;
        updateData.adminResponseBy = (req as any).user.id;
        updateData.adminResponseAt = new Date();
      }

      const [updatedFeedback] = await db
        .update(feedback)
        .set(updateData)
        .where(eq(feedback.id, id))
        .returning();

      if (!updatedFeedback) {
        return res.status(404).json({
          success: false,
          error: "Feedback not found"
        });
      }

      res.json({
        success: true,
        feedback: updatedFeedback,
        message: "Feedback updated successfully"
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({
        success: false,
        error: "Failed to update feedback"
      });
    }
  });

  // Add comment to feedback (admin only)
  app.post('/api/feedback/:id/comments', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, (req as any).user.id),
      });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required."
        });
      }

      const { id } = req.params;
      const validatedData = insertFeedbackCommentSchema.parse({
        ...req.body,
        feedbackId: id,
        userId: (req as any).user.id,
      });

      const [newComment] = await db
        .insert(feedbackComments)
        .values(validatedData)
        .returning();

      res.status(201).json({
        success: true,
        comment: newComment,
        message: "Comment added successfully"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        error: "Failed to add comment"
      });
    }
  });

  // Get feedback statistics (admin only)
  app.get('/api/feedback/stats', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, (req as any).user.id),
      });

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required."
        });
      }

      // Get various statistics
      const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback);
      const [openCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback).where(eq(feedback.status, 'open'));
      const [bugCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback).where(eq(feedback.type, 'bug'));
      const [criticalCount] = await db.select({ count: sql<number>`count(*)` }).from(feedback).where(eq(feedback.priority, 'critical'));

      // Get feedback by type
      const typeStats = await db
        .select({
          type: feedback.type,
          count: sql<number>`count(*)`
        })
        .from(feedback)
        .groupBy(feedback.type);

      // Get feedback by status
      const statusStats = await db
        .select({
          status: feedback.status,
          count: sql<number>`count(*)`
        })
        .from(feedback)
        .groupBy(feedback.status);

      res.json({
        success: true,
        stats: {
          total: totalCount.count,
          open: openCount.count,
          bugs: bugCount.count,
          critical: criticalCount.count,
          byType: typeStats,
          byStatus: statusStats
        }
      });
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch feedback statistics"
      });
    }
  });
}