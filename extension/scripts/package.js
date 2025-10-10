#!/usr/bin/env node

/**
 * Package script
 * Creates a ZIP file of the extension for Chrome Web Store upload
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Packaging Uswift Chrome Extension...\n');

const distDir = path.join(__dirname, '..', 'dist');
const rootDir = path.join(__dirname, '..');
const packageJson = require('../package.json');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Error: dist/ directory not found!');
  console.error('   Run "npm run build" first.');
  process.exit(1);
}

// Create releases directory if it doesn't exist
const releasesDir = path.join(rootDir, 'releases');
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir);
  console.log('✅ Created releases/ directory');
}

// Generate filename with version and timestamp
const version = packageJson.version;
const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const filename = `uswift-extension-v${version}-${timestamp}.zip`;
const outputPath = path.join(releasesDir, filename);

// Remove existing file if it exists
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
  console.log(`🗑️  Removed existing ${filename}`);
}

console.log(`📦 Creating ${filename}...`);

try {
  // Check if zip command is available
  let zipCommand;

  if (process.platform === 'win32') {
    // Windows: Use PowerShell Compress-Archive
    const psCommand = `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${outputPath}" -Force`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
  } else {
    // Linux/Mac: Use zip command
    execSync(`cd "${distDir}" && zip -r "${outputPath}" .`, { stdio: 'inherit' });
  }

  // Verify ZIP was created
  if (!fs.existsSync(outputPath)) {
    throw new Error('ZIP file was not created');
  }

  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('✅ PACKAGE CREATED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`📦 File: ${filename}`);
  console.log(`📍 Location: ${outputPath}`);
  console.log(`📊 Size: ${sizeMB} MB`);
  console.log('='.repeat(60));

  // Check size limits
  if (stats.size > 50 * 1024 * 1024) {
    console.log('⚠️  WARNING: Package size exceeds 50MB!');
    console.log('   Chrome Web Store has a 50MB limit for extensions.');
    console.log('   Consider optimizing assets and removing unnecessary files.');
  } else if (stats.size > 20 * 1024 * 1024) {
    console.log('⚠️  Warning: Package size is large (>20MB).');
    console.log('   Consider optimizing for better user experience.');
  } else {
    console.log('✅ Package size is within recommended limits');
  }

  console.log('\n📤 Next steps for Chrome Web Store:');
  console.log('   1. Go to https://chrome.google.com/webstore/devconsole');
  console.log('   2. Click "New Item" or update existing extension');
  console.log(`   3. Upload: ${filename}`);
  console.log('   4. Fill in store listing details');
  console.log('   5. Submit for review');

  console.log('\n🧪 To test locally:');
  console.log('   1. Open chrome://extensions/');
  console.log('   2. Enable "Developer mode"');
  console.log('   3. Click "Load unpacked"');
  console.log('   4. Select the dist/ folder');

  // Create latest symlink (for convenience)
  const latestPath = path.join(releasesDir, 'latest.zip');
  if (fs.existsSync(latestPath)) {
    fs.unlinkSync(latestPath);
  }
  fs.copyFileSync(outputPath, latestPath);
  console.log(`\n✅ Also saved as: releases/latest.zip`);

  // Create release notes template
  const releaseNotesPath = path.join(releasesDir, `release-notes-v${version}.md`);
  if (!fs.existsSync(releaseNotesPath)) {
    const releaseNotes = `# Uswift Extension v${version} - Release Notes

## 🚀 What's New

- [Add new features here]

## 🐛 Bug Fixes

- [Add bug fixes here]

## 🔧 Improvements

- [Add improvements here]

## 📦 Package Info

- **Version:** ${version}
- **Release Date:** ${timestamp}
- **Package Size:** ${sizeMB} MB
- **File:** ${filename}

## 🧪 Testing

- [ ] Auto-apply tested on multiple job boards
- [ ] AI features working correctly
- [ ] Profile management functional
- [ ] Authentication flow tested
- [ ] Job tracker operational
- [ ] All permissions working

## 📝 Notes

[Add any additional notes or known issues]
`;

    fs.writeFileSync(releaseNotesPath, releaseNotes);
    console.log(`\n📝 Release notes template created: ${releaseNotesPath}`);
  }

  console.log('\n✅ Packaging complete!');
  process.exit(0);

} catch (error) {
  console.error('\n❌ Error creating package:', error.message);
  console.error('\nTroubleshooting:');

  if (process.platform === 'win32') {
    console.error('  - Ensure PowerShell is available');
    console.error('  - Try running as Administrator');
  } else {
    console.error('  - Ensure zip command is installed: sudo apt-get install zip');
    console.error('  - Check file permissions in dist/ directory');
  }

  process.exit(1);
}
