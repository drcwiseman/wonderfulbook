/**
 * Test script for the book recommendation system
 * Run with: npx tsx server/testBookRecommendations.ts
 */

import { recommendationEngine } from './bookRecommendationEngine.js';
import { emailScheduler } from './emailScheduler.js';
import { db } from './db.js';
import { eq } from 'drizzle-orm';
import { users, userReadingPreferences } from '../shared/schema.js';

async function testRecommendationSystem() {
  try {
    console.log('🧪 Starting Book Recommendation System Test...\n');

    // Test 1: Get users eligible for recommendations
    console.log('1. Testing getUsersForRecommendationEmails...');
    const eligibleUsers = await recommendationEngine.getUsersForRecommendationEmails();
    console.log(`   Found ${eligibleUsers.length} eligible users:`, eligibleUsers);

    if (eligibleUsers.length === 0) {
      console.log('   No eligible users found. Creating test user preferences...');
      
      // Get first active user
      const testUsers = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.isActive, true))
        .limit(1);

      if (testUsers.length > 0) {
        const testUser = testUsers[0];
        console.log(`   Using test user: ${testUser.email}`);

        // Create preferences for test user
        await db.insert(userReadingPreferences).values({
          userId: testUser.id,
          favoriteGenres: ['business', 'self-help', 'productivity'],
          preferredAuthors: ['James Clear', 'Cal Newport'],
          readingGoalsPerMonth: 3,
          totalBooksCompleted: 5,
          emailPreferences: {
            weeklyRecommendations: true,
            newBookAlerts: true,
            personalizedDeals: true,
            readingReminders: true
          }
        }).onConflictDoUpdate({
          target: userReadingPreferences.userId,
          set: {
            favoriteGenres: ['business', 'self-help', 'productivity'],
            preferredAuthors: ['James Clear', 'Cal Newport'],
            updatedAt: new Date()
          }
        });

        console.log('   ✅ Test user preferences created');
      }
    }

    // Test 2: Generate recommendations for first eligible user
    if (eligibleUsers.length > 0) {
      const testUserId = eligibleUsers[0];
      console.log(`\n2. Testing generateRecommendations for user: ${testUserId}...`);
      
      const recommendations = await recommendationEngine.generateRecommendations(testUserId, 5);
      console.log(`   Generated ${recommendations.length} recommendations:`);
      
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title} by ${rec.author}`);
        console.log(`      Type: ${rec.recommendationType}, Score: ${rec.score}`);
        console.log(`      Reason: ${rec.reason}\n`);
      });

      if (recommendations.length > 0) {
        // Test 3: Save recommendations
        console.log('3. Testing saveRecommendations...');
        await recommendationEngine.saveRecommendations(testUserId, recommendations);
        console.log('   ✅ Recommendations saved to database');

        // Test 4: Mark as emailed
        console.log('\n4. Testing markRecommendationsEmailed...');
        await recommendationEngine.markRecommendationsEmailed(
          testUserId, 
          recommendations.map(r => r.id)
        );
        console.log('   ✅ Recommendations marked as emailed');
      }
    }

    // Test 5: Test email generation (without actually sending)
    console.log('\n5. Testing email template generation...');
    
    const { 
      generateBookRecommendationEmail, 
      generateBookRecommendationTextEmail,
      generateBookRecommendationSubject 
    } = await import('./emailTemplates/bookRecommendations.js');

    const testEmailData = {
      user: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subscriptionTier: 'premium'
      },
      recommendations: [
        {
          id: 'test-book-1',
          title: 'Test Book Title',
          author: 'Test Author',
          description: 'A great test book',
          coverImageUrl: '/placeholder.jpg',
          rating: '4.5',
          totalRatings: 100,
          requiredTier: 'premium',
          recommendationType: 'personalized',
          score: '90',
          reason: 'Based on your reading preferences'
        }
      ],
      totalBooksRead: 5,
      readingGoals: 3,
      unsubscribeUrl: 'http://localhost:5000/unsubscribe?token=test'
    };

    const htmlEmail = generateBookRecommendationEmail(testEmailData);
    const textEmail = generateBookRecommendationTextEmail(testEmailData);
    const subject = generateBookRecommendationSubject(testEmailData);

    console.log(`   Subject: ${subject}`);
    console.log(`   HTML email length: ${htmlEmail.length} characters`);
    console.log(`   Text email length: ${textEmail.length} characters`);
    console.log('   ✅ Email templates generated successfully');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nTo test the full email system:');
    console.log('1. Make sure SMTP is configured');
    console.log('2. Call: await emailScheduler.sendBookRecommendations()');
    console.log('3. Check your email for personalized book recommendations');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testRecommendationSystem();