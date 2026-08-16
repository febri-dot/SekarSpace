import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const imagesDir = path.resolve('public/assets/images');
const files = fs.readdirSync(imagesDir);

console.log(`Found ${files.length} files in ${imagesDir}`);

let totalOriginalSize = 0;
let totalWebpSize = 0;

for (const file of files) {
  if (!file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.jpeg')) continue;
  
  const filePath = path.join(imagesDir, file);
  const ext = path.extname(file);
  const baseName = path.basename(file, ext);
  const webpPath = path.join(imagesDir, `${baseName}.webp`);
  
  const stats = fs.statSync(filePath);
  totalOriginalSize += stats.size;
  
  // Convert to webp
  const image = sharp(filePath);
  const metadata = await image.metadata();
  
  // Resize if wider than 1400px (hero doesn't need 4K/3K resolution on mobile/desktop web)
  let transformer = sharp(filePath);
  if (metadata.width && metadata.width > 1280) {
    transformer = transformer.resize(1280, null, { withoutEnlargement: true });
  }
  
  await transformer
    .webp({ quality: 80, effort: 6 })
    .toFile(webpPath);
    
  const webpStats = fs.statSync(webpPath);
  totalWebpSize += webpStats.size;
  
  console.log(`Optimized ${file} (${(stats.size / 1024).toFixed(1)} KB) -> ${baseName}.webp (${(webpStats.size / 1024).toFixed(1)} KB) [${((1 - webpStats.size / stats.size) * 100).toFixed(1)}% smaller]`);
}

console.log(`\n========================================`);
console.log(`Original Total: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
console.log(`WebP Total: ${(totalWebpSize / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Saved: ${(100 - (totalWebpSize / totalOriginalSize) * 100).toFixed(1)}% bandwidth!`);
console.log(`========================================\n`);
