import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure all images in /uploads/images/ are also accessible from /uploads/
const imagesDir = path.join(__dirname, 'uploads', 'images');
const uploadsDir = path.join(__dirname, 'uploads');

if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir);
  let synced = 0;
  
  files.forEach(file => {
    if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const source = path.join(imagesDir, file);
      const dest = path.join(uploadsDir, file);
      
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(source, dest);
        synced++;
        console.log(`✅ Synced: ${file}`);
      }
    }
  });
  
  console.log(`\n📷 Image sync complete: ${synced} new images synced`);
  console.log(`📊 Total images in /uploads/: ${fs.readdirSync(uploadsDir).filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length}`);
} else {
  console.log('⚠️ No /uploads/images/ directory found');
}
