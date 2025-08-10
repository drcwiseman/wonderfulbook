import { test, expect } from '@playwright/test';

const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';

test.describe('Authenticated Link Validation', () => {
  test('should validate all internal links after login', async ({ page, request }) => {
    // Navigate to login page
    await page.goto(`${PREVIEW_URL}/auth/login`);
    
    // Perform login
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL(/\/(dashboard|library|$)/, { timeout: 10000 });
    
    const pagesToCheck = [
      '/',
      '/dashboard', 
      '/library',
      '/bookstore'
    ];
    
    const allLinks = new Set<string>();
    
    // Collect all links from each page
    for (const pageUrl of pagesToCheck) {
      try {
        await page.goto(`${PREVIEW_URL}${pageUrl}`);
        await page.waitForLoadState('networkidle');
        
        // Get all anchor tags with href attributes
        const links = await page.locator('a[href]').evaluateAll((anchors) => {
          return anchors
            .map((a: HTMLAnchorElement) => a.href)
            .filter((href: string) => {
              // Filter out external links, mailto, tel, javascript, and hash-only links
              return href && 
                     !href.startsWith('mailto:') && 
                     !href.startsWith('tel:') && 
                     !href.startsWith('javascript:') &&
                     !href.endsWith('#') &&
                     (href.startsWith(PREVIEW_URL) || href.startsWith('/'));
            });
        });
        
        links.forEach(link => {
          // Normalize relative URLs
          if (link.startsWith('/')) {
            allLinks.add(`${PREVIEW_URL}${link}`);
          } else {
            allLinks.add(link);
          }
        });
      } catch (error) {
        console.error(`Error checking page ${pageUrl}:`, error);
      }
    }
    
    console.log(`Found ${allLinks.size} unique internal links to validate`);
    
    // Check each unique link
    const results = [];
    for (const link of Array.from(allLinks)) {
      try {
        const response = await request.get(link);
        const status = response.status();
        
        results.push({
          url: link,
          status,
          success: status < 400
        });
        
        expect(status, `Link ${link} returned status ${status}`).toBeLessThan(400);
      } catch (error) {
        results.push({
          url: link,
          status: 0,
          error: error.message,
          success: false
        });
        
        expect.fail(`Failed to check link ${link}: ${error.message}`);
      }
    }
    
    // Log summary
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.error('Failed links:', failed);
    }
    
    console.log(`Link validation complete: ${results.length - failed.length}/${results.length} passed`);
  });
});