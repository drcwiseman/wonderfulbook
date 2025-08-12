import express from 'express';
import { isAuthenticated, requireAdmin } from '../middleware/auth.js';
import { recommendationEngine } from '../bookRecommendationEngine.js';
import { emailScheduler } from '../emailScheduler.js';
import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import { userReadingPreferences } from '../../shared/schema.js';

export const recommendationsRouter = express.Router();

/**
 * Get personalized book recommendations for the current user
 */
recommendationsRouter.get('/api/recommendations', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    const limit = parseInt(req.query.limit as string) || 5;
    const types = req.query.types ? (req.query.types as string).split(',') : undefined;

    const recommendations = await recommendationEngine.generateRecommendations(userId, limit, types);
    
    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
});

/**
 * Update user reading preferences
 */
recommendationsRouter.put('/api/recommendations/preferences', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    const {
      favoriteGenres,
      preferredAuthors,
      readingGoalsPerMonth,
      preferredBookLength,
      emailPreferences
    } = req.body;

    // Check if preferences exist
    const existing = await db
      .select()
      .from(userReadingPreferences)
      .where(eq(userReadingPreferences.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing preferences
      await db
        .update(userReadingPreferences)
        .set({
          favoriteGenres: favoriteGenres || existing[0].favoriteGenres,
          preferredAuthors: preferredAuthors || existing[0].preferredAuthors,
          readingGoalsPerMonth: readingGoalsPerMonth || existing[0].readingGoalsPerMonth,
          preferredBookLength: preferredBookLength || existing[0].preferredBookLength,
          emailPreferences: emailPreferences || existing[0].emailPreferences,
          updatedAt: new Date()
        })
        .where(eq(userReadingPreferences.userId, userId));
    } else {
      // Create new preferences
      await db.insert(userReadingPreferences).values({
        userId,
        favoriteGenres: favoriteGenres || ['business', 'self-help'],
        preferredAuthors: preferredAuthors || [],
        readingGoalsPerMonth: readingGoalsPerMonth || 2,
        preferredBookLength: preferredBookLength || 'medium',
        emailPreferences: emailPreferences || {
          weeklyRecommendations: true,
          newBookAlerts: true,
          personalizedDeals: true,
          readingReminders: true
        }
      });
    }

    res.json({
      success: true,
      message: 'Reading preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating reading preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reading preferences'
    });
  }
});

/**
 * Get user reading preferences
 */
recommendationsRouter.get('/api/recommendations/preferences', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;

    const preferences = await db
      .select()
      .from(userReadingPreferences)
      .where(eq(userReadingPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      // Return default preferences
      res.json({
        success: true,
        preferences: {
          userId,
          favoriteGenres: ['business', 'self-help'],
          preferredAuthors: [],
          readingGoalsPerMonth: 2,
          preferredBookLength: 'medium',
          emailPreferences: {
            weeklyRecommendations: true,
            newBookAlerts: true,
            personalizedDeals: true,
            readingReminders: true
          }
        }
      });
    } else {
      res.json({
        success: true,
        preferences: preferences[0]
      });
    }
  } catch (error) {
    console.error('Error fetching reading preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reading preferences'
    });
  }
});

/**
 * Manually trigger book recommendation emails (admin only)
 */
recommendationsRouter.post('/api/admin/recommendations/send', requireAdmin, async (req: any, res) => {
  try {
    // Admin access is already checked by requireAdmin middleware

    console.log('📚 Admin triggered manual book recommendation campaign');
    
    // Trigger the recommendation email campaign
    await emailScheduler.sendBookRecommendations();

    res.json({
      success: true,
      message: 'Book recommendation campaign triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering book recommendation campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger book recommendation campaign'
    });
  }
});