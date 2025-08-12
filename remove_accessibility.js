const fs = require('fs');

// Files to clean
const files = [
  'client/src/pages/challenge-detail.tsx',
  'client/src/pages/challenges.tsx',
  'client/src/components/PremiumPDFReader.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove all SpeakableText wrappers but keep content
    content = content.replace(/<SpeakableText>(.*?)<\/SpeakableText>/gs, '$1');
    
    // Remove AccessibleContent wrappers but keep content  
    content = content.replace(/<AccessibleContent>(.*?)<\/AccessibleContent>/gs, '$1');
    
    // Remove any remaining accessibility imports/references
    content = content.replace(/import.*?AccessibleContent.*?from.*?;?\n/g, '');
    content = content.replace(/import.*?SpeakableText.*?from.*?;?\n/g, '');
    content = content.replace(/import.*?useAccessibility.*?from.*?;?\n/g, '');
    
    // Clean up any hanging commas or imports
    content = content.replace(/,\s*\}\s*from/g, ' } from');
    content = content.replace(/\{\s*,/g, '{');
    content = content.replace(/,\s*,/g, ',');
    
    fs.writeFileSync(filePath, content);
    console.log(`Cleaned: ${filePath}`);
  }
});
