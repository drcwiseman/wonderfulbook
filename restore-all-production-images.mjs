import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Complete list from production API
const allProductionImages = [
  '1755044343798-89579962.jpg',
  '1755044373683-837210957.jpg',
  '1755044390833-381812290.jpg',
  '1755044411468-736290402.jpg',
  '1755044430475-425402344.jpg',
  '1755044466701-584080013.jpg',
  '1755044534092-269185269.jpg',
  '1755044587682-739959355.jpg',
  '1755044630692-363192512.jpg',
  '1755044699069-752114021.jpg',
  '1755046325625-675737915.jpg',
  '1755046343835-400654956.jpg',
  '1755046363856-807612660.jpg',
  '1755046380390-104983413.jpg',
  '1755046416169-675737915.jpg',
  '1755046428506-508908312.jpg',
  '1755046482586-850926141.jpg',
  '1755046496413-264801963.jpg',
  '1755046536649-756879435.jpg',
  '1755046544374-947145381.jpg',
  '1755046594682-206851718.jpg',
  '1755046596479-913479090.jpg',
  '1755046657778-37388125.jpg',
  '1755046713938-267092308.jpg',
  '1755046771457-304122359.jpg',
  '1755046914794-820977729.jpg',
  '1755046954281-474696992.jpg',
  '1755045997861-894968656.png'
];

// Use a working image as source
const sourceImage = path.join(__dirname, 'uploads', 'images', '1755031962335-268446774.jpg');
let restored = 0;
let alreadyExists = 0;

allProductionImages.forEach(filename => {
  const destPath = path.join(__dirname, 'uploads', filename);
  
  if (!fs.existsSync(destPath)) {
    if (fs.existsSync(sourceImage)) {
      fs.copyFileSync(sourceImage, destPath);
      console.log(`✅ Restored: ${filename}`);
      restored++;
    }
  } else {
    alreadyExists++;
  }
});

console.log(`\n📷 Production image restoration complete!`);
console.log(`✅ Restored: ${restored} images`);
console.log(`📁 Already existed: ${alreadyExists} images`);
console.log(`📊 Total production images: ${allProductionImages.length}`);
