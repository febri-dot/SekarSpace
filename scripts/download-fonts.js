import fs from 'node:fs';
import path from 'node:path';

const fontsDir = path.resolve('public/assets/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  console.log(`Saved: ${path.basename(destPath)} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
}

async function fetchCssWithUrls(cssUrl) {
  const res = await fetch(cssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  return await res.text();
}

async function run() {
  console.log('Downloading Google Fonts (Outfit & Inter)...');
  const googleFontsCssUrl = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap';
  let googleCss = await fetchCssWithUrls(googleFontsCssUrl);

  // Extract all font URLs and replace with local paths
  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
  let match;
  const urls = [];
  while ((match = urlRegex.exec(googleCss)) !== null) {
    urls.push(match[1]);
  }

  let index = 1;
  for (const url of urls) {
    const filename = `font-${index++}.woff2`;
    const destPath = path.join(fontsDir, filename);
    await downloadFile(url, destPath);
    googleCss = googleCss.replace(url, `/assets/fonts/${filename}`);
  }

  fs.writeFileSync(path.join(fontsDir, 'google-fonts.css'), googleCss);
  console.log('Saved google-fonts.css');

  console.log('\nDownloading Boxicons...');
  const boxiconsCssUrl = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
  let boxiconsCss = await fetchCssWithUrls(boxiconsCssUrl);

  const boxiconsFiles = [
    'boxicons.woff2',
    'boxicons.woff',
    'boxicons.ttf'
  ];

  for (const f of boxiconsFiles) {
    const url = `https://unpkg.com/boxicons@2.1.4/fonts/${f}`;
    const destPath = path.join(fontsDir, f);
    await downloadFile(url, destPath);
  }

  // Adjust font paths in boxicons.min.css
  boxiconsCss = boxiconsCss.replace(/\.\.\/fonts\//g, '/assets/fonts/');
  fs.writeFileSync(path.join(fontsDir, 'boxicons.min.css'), boxiconsCss);
  console.log('Saved boxicons.min.css');

  console.log('\nAll fonts downloaded successfully!');
}

run().catch(console.error);
