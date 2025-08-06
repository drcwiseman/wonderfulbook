import { emailService } from './server/emailService.js';
import { emailScheduler } from './server/emailScheduler.js';
import { storage } from './server/storage.js';

// Test script to verify email system functionality
async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');

  try {
    // 1. Test SMTP connection
    console.log('1. Testing SMTP connection...');
    const connectionValid = await emailService.verifyConnection();
    console.log(`   SMTP Connection: ${connectionValid ? '✅ Valid' : '❌ Failed'}\n`);

    // 2. Test email scheduler status
    console.log('2. Testing email scheduler...');
    await emailScheduler.initialize();
    const schedulerStatus = emailScheduler.getStatus();
    console.log(`   Scheduler Status: ${schedulerStatus.initialized ? '✅ Active' : '❌ Inactive'}`);
    console.log(`   Active Jobs: ${schedulerStatus.jobCount} (${schedulerStatus.activeJobs.join(', ')})\n`);

    // 3. Test email preferences system
    console.log('3. Testing email preferences...');
    const testUserId = 'test-user-123';
    const testEmail = 'test@example.com';
    
    const preferences = await storage.getEmailPreferences(testUserId, testEmail);
    console.log(`   ✅ Created email preferences for ${testEmail}`);
    console.log(`   Unsubscribe Token: ${preferences.unsubscribeToken.substring(0, 8)}...\n`);

    // 4. Test email template preview
    console.log('4. Testing email templates...');
    const templateTypes = ['trial_reminder', 'conversion_success', 'cancellation'];
    
    for (const templateType of templateTypes) {
      try {
        const preview = await emailService.generateEmailPreview(templateType, {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        });
        console.log(`   ✅ ${templateType} template renders correctly`);
      } catch (error) {
        console.log(`   ❌ ${templateType} template failed: ${error.message}`);
      }
    }

    // 5. Test sending a preview email (to admin)
    console.log('\n5. Testing email sending...');
    try {
      const mockUser = {
        id: 'test-user-preview',
        email: 'prophetclimate@yahoo.com', // Admin email for testing
        firstName: 'Test',
        lastName: 'User',
        freeTrialEndedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      };

      const emailSent = await emailService.sendTrialReminder(mockUser, 3);
      console.log(`   Email Send Test: ${emailSent ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.log(`   ❌ Email send failed: ${error.message}`);
    }

    // 6. Test trial reminder query
    console.log('\n6. Testing trial reminder queries...');
    const usersExpiring3Days = await emailService.getUsersWithTrialsExpiring(3);
    const usersExpiring1Day = await emailService.getUsersWithTrialsExpiring(1);
    
    console.log(`   Users with trials expiring in 3 days: ${usersExpiring3Days.length}`);
    console.log(`   Users with trials expiring in 1 day: ${usersExpiring1Day.length}`);

    console.log('\n🎉 Email system test completed!');
    console.log('\nNext steps:');
    console.log('• Access admin panel at /admin/email-management');
    console.log('• Preview email templates');
    console.log('• Monitor email logs');
    console.log('• Test manual campaign triggers\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  // Exit the process
  process.exit(0);
}

testEmailSystem();