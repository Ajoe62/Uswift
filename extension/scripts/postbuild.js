#!/usr/bin/env node

/**
 * Post-build script
 * Runs after Vite build to ensure all required files are in dist/
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running post-build checks...\n');

const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Error: dist/ directory not found!');
  process.exit(1);
}

// Required files that must exist in dist/
const requiredFiles = [
  'popup.html',
  'popup.js',
  'content.js',
  'background.js',
  'manifest.json'
];

// Icon files
const iconFiles = [
  'icon16.png',
  'icon48.png',
  'icon128.png'
];

let allFilesPresent = true;

// Check required files
console.log('📋 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesPresent = false;
  }
});

// Check icon files
console.log('\n🎨 Checking icon files:');
iconFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    // Try to copy from public directory
    const publicFilePath = path.join(publicDir, file);
    if (fs.existsSync(publicFilePath)) {
      fs.copyFileSync(publicFilePath, filePath);
      console.log(`  ✅ ${file} (copied from public/)`);
    } else {
      console.log(`  ⚠️  ${file} - Not found (optional)`);
    }
  }
});

// Validate manifest.json
console.log('\n📄 Validating manifest.json:');
try {
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log(`  ✅ Name: ${manifest.name}`);
  console.log(`  ✅ Version: ${manifest.version}`);
  console.log(`  ✅ Manifest Version: ${manifest.manifest_version}`);

  // Check required manifest fields
  const requiredFields = ['name', 'version', 'manifest_version'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      console.log(`  ❌ Missing required field: ${field}`);
      allFilesPresent = false;
    }
  });

  // Check permissions
  if (manifest.permissions && manifest.permissions.length > 0) {
    console.log(`  ✅ Permissions: ${manifest.permissions.join(', ')}`);
  }

} catch (error) {
  console.error(`  ❌ Error reading manifest.json: ${error.message}`);
  allFilesPresent = false;
}

// Calculate total bundle size
console.log('\n📊 Bundle size analysis:');
let totalSize = 0;
const distFiles = fs.readdirSync(distDir);

distFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.statSync(filePath).isFile()) {
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  }
});

const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`  📦 Total size: ${totalSizeMB} MB`);

if (totalSize > 10 * 1024 * 1024) {
  console.log('  ⚠️  Warning: Bundle size exceeds 10MB. Consider optimization.');
}

// Create build info file
const buildInfo = {
  buildDate: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  totalSize: totalSize,
  files: distFiles.length
};

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('\n📝 Build info saved to dist/build-info.json');

// Final summary
console.log('\n' + '='.repeat(50));
if (allFilesPresent) {
  console.log('✅ POST-BUILD CHECK PASSED');
  console.log('🚀 Extension is ready to load in Chrome!');
  console.log('\nNext steps:');
  console.log('  1. Open Chrome and go to chrome://extensions/');
  console.log('  2. Enable "Developer mode"');
  console.log('  3. Click "Load unpacked"');
  console.log('  4. Select the dist/ folder');
  process.exit(0);
} else {
  console.log('❌ POST-BUILD CHECK FAILED');
  console.log('⚠️  Some required files are missing!');
  process.exit(1);
}
