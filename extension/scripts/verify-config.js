#!/usr/bin/env node

/**
 * Configuration Verification Script
 * Checks if Mistral API key and other configs are properly set
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Uswift Extension Configuration...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Verify .env file exists
console.log('📄 Checking environment files...');
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  console.log('  ✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check for Mistral API key
  const mistralKeyMatch = envContent.match(/VITE_MISTRAL_API_KEY=(.+)/);
  if (mistralKeyMatch) {
    const key = mistralKeyMatch[1].trim();
    if (key && key !== 'your-mistral-api-key-here' && key.length > 20) {
      console.log('  ✅ Mistral API key is configured in .env');
    } else {
      console.log('  ⚠️  Mistral API key in .env looks invalid');
      hasWarnings = true;
    }
  } else {
    console.log('  ⚠️  VITE_MISTRAL_API_KEY not found in .env');
    hasWarnings = true;
  }
} else {
  console.log('  ℹ️  .env file not found (optional)');
  if (fs.existsSync(envExamplePath)) {
    console.log('  💡 Copy .env.example to .env to get started');
  }
}

// Check 2: Verify public/config.js
console.log('\n📄 Checking public/config.js...');
const publicConfigPath = path.join(__dirname, '..', 'public', 'config.js');

if (fs.existsSync(publicConfigPath)) {
  console.log('  ✅ public/config.js found');
  const configContent = fs.readFileSync(publicConfigPath, 'utf8');

  // Check for EXTENSION_CONFIG
  if (configContent.includes('window.EXTENSION_CONFIG')) {
    console.log('  ✅ window.EXTENSION_CONFIG is defined');

    // Check for Mistral API key
    const mistralKeyMatch = configContent.match(/apiKey:\s*["']([^"']+)["']/);
    if (mistralKeyMatch) {
      const key = mistralKeyMatch[1];
      if (key && key !== 'your-mistral-api-key-here' && key.length > 20) {
        console.log('  ✅ Mistral API key is configured in config.js');
        console.log(`  ℹ️  API key length: ${key.length} characters`);
      } else if (key === 'your-mistral-api-key-here') {
        console.log('  ❌ Mistral API key is not configured (still default value)');
        hasErrors = true;
      } else {
        console.log('  ⚠️  Mistral API key looks too short or invalid');
        hasWarnings = true;
      }
    }

    // Check for Supabase config
    if (configContent.includes('supabase:')) {
      console.log('  ✅ Supabase configuration found');
    }
  } else {
    console.log('  ❌ window.EXTENSION_CONFIG not found in config.js');
    hasErrors = true;
  }
} else {
  console.log('  ❌ public/config.js not found');
  hasErrors = true;
}

// Check 3: Verify src/config.js (legacy)
console.log('\n📄 Checking src/config.js (legacy)...');
const srcConfigPath = path.join(__dirname, '..', 'src', 'config.js');

if (fs.existsSync(srcConfigPath)) {
  console.log('  ℹ️  src/config.js found (legacy, public/config.js takes precedence)');
  const configContent = fs.readFileSync(srcConfigPath, 'utf8');

  const mistralKeyMatch = configContent.match(/apiKey:\s*["']([^"']+)["']/);
  if (mistralKeyMatch) {
    const key = mistralKeyMatch[1];
    if (key && key !== 'your-mistral-api-key-here' && key.length > 20) {
      console.log('  ℹ️  API key configured in src/config.js');
    }
  }
}

// Check 4: Verify dist folder
console.log('\n📦 Checking build output...');
const distPath = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  console.log('  ✅ dist/ folder exists');

  // Check for essential files
  const essentialFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'config.js',
    'background.js',
    'content.js'
  ];

  const missingFiles = essentialFiles.filter(file =>
    !fs.existsSync(path.join(distPath, file))
  );

  if (missingFiles.length === 0) {
    console.log('  ✅ All essential files present in dist/');
  } else {
    console.log(`  ⚠️  Missing files in dist/: ${missingFiles.join(', ')}`);
    hasWarnings = true;
  }

  // Check dist/config.js
  const distConfigPath = path.join(distPath, 'config.js');
  if (fs.existsSync(distConfigPath)) {
    const distConfigContent = fs.readFileSync(distConfigPath, 'utf8');
    const mistralKeyMatch = distConfigContent.match(/apiKey:\s*["']([^"']+)["']/);

    if (mistralKeyMatch) {
      const key = mistralKeyMatch[1];
      if (key && key !== 'your-mistral-api-key-here' && key.length > 20) {
        console.log('  ✅ Mistral API key is in built config');
      } else {
        console.log('  ❌ Built config.js has invalid API key');
        console.log('  💡 Run: npm run build');
        hasErrors = true;
      }
    }
  }
} else {
  console.log('  ⚠️  dist/ folder not found');
  console.log('  💡 Run: npm run build');
  hasWarnings = true;
}

// Check 5: Verify package.json scripts
console.log('\n📋 Checking package.json scripts...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const requiredScripts = ['build', 'clean', 'dev'];
  const hasAllScripts = requiredScripts.every(script => packageJson.scripts[script]);

  if (hasAllScripts) {
    console.log('  ✅ All required npm scripts present');
  } else {
    console.log('  ⚠️  Some npm scripts missing');
    hasWarnings = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ CONFIGURATION INCOMPLETE');
  console.log('\n🔧 To fix:');
  console.log('  1. Get Mistral API key from: https://console.mistral.ai/');
  console.log('  2. Add it to public/config.js (line 17)');
  console.log('  3. Run: npm run build');
  console.log('  4. Reload extension in chrome://extensions/');
  console.log('\n📖 See MISTRAL_API_SETUP.md for detailed instructions');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  CONFIGURATION OK (with warnings)');
  console.log('\n💡 Consider:');
  console.log('  - Running: npm run build');
  console.log('  - Checking .env file configuration');
  console.log('  - Reviewing MISTRAL_API_SETUP.md');
  process.exit(0);
} else {
  console.log('✅ CONFIGURATION COMPLETE');
  console.log('\n🚀 Ready to use! Next steps:');
  console.log('  1. Open Chrome: chrome://extensions/');
  console.log('  2. Enable "Developer mode"');
  console.log('  3. Click "Load unpacked"');
  console.log('  4. Select the dist/ folder');
  process.exit(0);
}
