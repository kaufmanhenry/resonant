#!/usr/bin/env node
/**
 * Bump service worker cache version before deployment
 * This ensures users get the latest updates
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');

// Read current service worker
let swContent = fs.readFileSync(swPath, 'utf8');

// Extract current version
const versionMatch = swContent.match(/const CACHE_NAME = '([^']+)'/);
if (!versionMatch) {
  console.error('❌ Could not find CACHE_NAME in sw.js');
  process.exit(1);
}

const currentVersion = versionMatch[1];
console.log(`📦 Current version: ${currentVersion}`);

// Parse version (e.g., "stretch-buddy-v1.2" -> ["stretch-buddy", "1", "2"])
const parts = currentVersion.split('-v');
if (parts.length !== 2) {
  console.error('❌ Invalid version format in CACHE_NAME');
  process.exit(1);
}

const [baseName, versionStr] = parts;
const versionParts = versionStr.split('.');
const major = parseInt(versionParts[0]) || 1;
const minor = parseInt(versionParts[1]) || 0;

// Increment minor version
const newMinor = minor + 1;
const newVersion = `${baseName}-v${major}.${newMinor}`;

// Update service worker
swContent = swContent.replace(
  /const CACHE_NAME = '[^']+'/,
  `const CACHE_NAME = '${newVersion}'`
);

// Also update the comment at the top
swContent = swContent.replace(
  /\/\/ .+ Service Worker v[\d.]+/,
  `// ${baseName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Service Worker v${major}.${newMinor}`
);

fs.writeFileSync(swPath, swContent);

console.log(`✅ Bumped version: ${currentVersion} → ${newVersion}`);
console.log(`📝 Updated ${swPath}`);
