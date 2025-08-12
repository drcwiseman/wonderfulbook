#!/usr/bin/env node

/**
 * Domain URL Update Script for Wonderful Books
 * 
 * This script updates all domain references in SEO files when switching
 * from development to production or when setting up a custom domain.
 * 
 * Usage:
 *   node scripts/update-domain-urls.js <new-domain>
 * 
 * Examples:
 *   node scripts/update-domain-urls.js wonderfulbooks.com
 *   node scripts/update-domain-urls.js wonderful-books.replit.app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the new domain from command line arguments
const newDomain = process.argv[2];

if (!newDomain) {
  console.error('❌ Error: Please provide a domain name');
  console.log('Usage: node scripts/update-domain-urls.js <domain>');
  console.log('Example: node scripts/update-domain-urls.js wonderfulbooks.com');
  process.exit(1);
}

// Ensure the domain has https protocol
const fullDomain = newDomain.startsWith('http') ? newDomain : `https://${newDomain}`;

console.log(`🔄 Updating domain URLs to: ${fullDomain}`);

// Files to update
const filesToUpdate = [
  {
    path: 'public/robots.txt',
    updates: [
      {
        search: /Sitemap: https:\/\/[^\/]+\/sitemap\.xml/g,
        replace: `Sitemap: ${fullDomain}/sitemap.xml`
      }
    ]
  },
  {
    path: 'public/sitemap.xml',
    updates: [
      {
        search: /<loc>https:\/\/[^\/]+\//g,
        replace: `<loc>${fullDomain}/`
      }
    ]
  },
  {
    path: 'server/public/index.html',
    updates: [
      {
        search: /content="https:\/\/[^"]+"/g,
        replace: (match) => {
          if (match.includes('og:url') || match.includes('canonical')) {
            return `content="${fullDomain}/"`;
          }
          return match;
        }
      },
      {
        search: /href="https:\/\/[^"]+"/g,
        replace: (match) => {
          if (match.includes('canonical')) {
            return `href="${fullDomain}/"`;
          }
          return match;
        }
      }
    ]
  }
];

// Update each file
let updatedFiles = 0;

filesToUpdate.forEach(({ path: filePath, updates }) => {
  const fullPath = path.join(path.dirname(__dirname), filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    updates.forEach(({ search, replace }) => {
      const originalContent = content;
      
      if (typeof replace === 'function') {
        content = content.replace(search, replace);
      } else {
        content = content.replace(search, replace);
      }
      
      if (content !== originalContent) {
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      updatedFiles++;
    } else {
      console.log(`➡️  No changes needed: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Domain update complete!`);
console.log(`📊 Updated ${updatedFiles} files`);
console.log(`🌐 New domain: ${fullDomain}`);

// Verify the updates
console.log('\n🔍 Verification:');
console.log('After deployment, verify these URLs work:');
console.log(`- ${fullDomain}/sitemap.xml`);
console.log(`- ${fullDomain}/robots.txt`);
console.log(`- Check page source for updated canonical URLs`);