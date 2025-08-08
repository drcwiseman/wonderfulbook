import type { Express } from "express";
import { db } from "./db";
import { feedback, feedbackComments, insertFeedbackSchema, insertFeedbackCommentSchema, users } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";

import { isAuthenticated, requireAdmin } from './middleware/auth';

export function registerFeedbackRoutes(app: Express) {
  // Submit new feedback (public endpoint - no auth required)
  app.post('/api/feedback', async (req, res) => {
    try {
      // Validate the input
      const validatedData = insertFeedbackSchema.parse({
        ...req.body,
        userId: (req.session as any)?.user?.id || null, // Optional user ID from session
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

  // Get all feedback (temporarily public for testing)
  app.get('/api/feedback', async (req, res) => {
    try {
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
  app.get('/api/feedback/:id', requireAdmin, async (req, res) => {
    try {


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
  app.patch('/api/feedback/:id', requireAdmin, async (req, res) => {
    try {

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
  app.post('/api/feedback/:id/comments', requireAdmin, async (req, res) => {
    try {

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

  // Note: Stats endpoint moved to main routes.ts as public endpoint
}