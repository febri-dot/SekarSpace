import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const imagesDir = path.resolve('public/assets/images');
const files = fs.readdirSync(imagesDir);

for (const file of files) {
  if (!file.endsWith('.webp')) continue;
  
  const filePath = path.join(imagesDir, file);
  const inputBuffer = fs.readFileSync(filePath);
  
  const metadata = await sharp(inputBuffer).metadata();
  
  let transformer = sharp(inputBuffer);
  if (metadata.width && metadata.width > 1080) {
    transformer = transformer.resize(1080, null, { withoutEnlargement: true });
  }
  
  const outputBuffer = await transformer
    .webp({ quality: 75, effort: 6 })
    .toBuffer();
    
  fs.writeFileSync(filePath, outputBuffer);
  
  console.log(`Re-compressed ${file} -> ${(outputBuffer.length / 1024).toFixed(1)} KB`);
}
