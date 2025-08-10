import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';

test.describe('Accessibility Tests', () => {
  test('should run axe accessibility tests on authenticated pages', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${PREVIEW_URL}/auth/login`);
    
    // Perform login
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL(/\/(dashboard|library|$)/, { timeout: 10000 });
    
    // Navigate to dashboard for accessibility testing
    await page.goto(`${PREVIEW_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('.skip-axe') // Exclude any elements marked to skip
      .analyze();
    
    // Prepare results for JSON export
    const results = {
      url: `${PREVIEW_URL}/dashboard`,
      timestamp: new Date().toISOString(),
      violations: accessibilityScanResults.violations,
      passes: accessibilityScanResults.passes,
      incomplete: accessibilityScanResults.incomplete,
      inapplicable: accessibilityScanResults.inapplicable,
      summary: {
        violationCount: accessibilityScanResults.violations.length,
        passCount: accessibilityScanResults.passes.length,
        incompleteCount: accessibilityScanResults.incomplete.length,
        inapplicableCount: accessibilityScanResults.inapplicable.length
      }
    };
    
    // Write results to file
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(
      'reports/axe.auth.json', 
      JSON.stringify({ tests: [{ results: [results] }] }, null, 2)
    );
    
    // Log summary
    console.log(`Accessibility scan complete for ${PREVIEW_URL}/dashboard:`);
    console.log(`- Violations: ${results.summary.violationCount}`);
    console.log(`- Passes: ${results.summary.passCount}`);
    console.log(`- Incomplete: ${results.summary.incompleteCount}`);
    
    // List violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Elements: ${violation.nodes.length}`);
      });
    }
    
    // Note: We don't fail the test for violations as they're reported for review
    // In a stricter environment, you might want to fail for critical violations
  });
});