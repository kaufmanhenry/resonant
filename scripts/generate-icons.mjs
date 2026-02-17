import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Read the SVG
const svgPath = join(publicDir, 'icon.svg');
const svg = readFileSync(svgPath);

// Generate icons at different sizes
const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);
    
    await sharp(svg, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }
  
  console.log('\nAll icons generated!');
}

generateIcons().catch(console.error);
