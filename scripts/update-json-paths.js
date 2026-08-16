import fs from 'node:fs';
import path from 'node:path';

const files = [
  'src/data/cms.json',
  'src/data/roomTypes.json',
  'src/data/roomGalleries.json',
  'src/data/gallery.json'
];

for (const file of files) {
  const filePath = path.resolve(file);
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/\/assets\/images\/([a-zA-Z0-9_-]+)\.png/g, '/assets/images/$1.webp');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${file}`);
}
