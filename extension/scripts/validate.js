#!/usr/bin/env node

/**
 * Validation script
 * Validates extension structure and manifest before build
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Uswift Extension...\n');

let hasErrors = false;
let hasWarnings = false;

// Validation helper
function error(message) {
  console.error(`❌ ERROR: ${message}`);
  hasErrors = true;
}

function warn(message) {
  console.warn(`⚠️  WARNING: ${message}`);
  hasWarnings = true;
}

function success(message) {
  console.log(`✅ ${message}`);
}

// 1. Validate package.json
console.log('📦 Validating package.json...');
try {
  const packageJson = require('../package.json');

  if (!packageJson.name) error('package.json missing "name" field');
  else success(`Package name: ${packageJson.name}`);

  if (!packageJson.version) error('package.json missing "version" field');
  else success(`Version: ${packageJson.version}`);

  if (!packageJson.description) warn('package.json missing "description" field');
  else success(`Description: ${packageJson.description}`);

  // Validate version format (should be semver: x.y.z)
  if (packageJson.version && !/^\d+\.\d+\.\d+$/.test(packageJson.version)) {
    warn('Version should follow semver format (x.y.z)');
  }

} catch (err) {
  error(`Failed to read package.json: ${err.message}`);
}

// 2. Validate manifest.json
console.log('\n📄 Validating manifest.json...');
try {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Required fields
  if (!manifest.manifest_version) error('manifest.json missing "manifest_version"');
  else if (manifest.manifest_version !== 3) {
    warn('Using Manifest V2. Consider upgrading to Manifest V3');
  } else {
    success('Using Manifest V3');
  }

  if (!manifest.name) error('manifest.json missing "name"');
  else success(`Extension name: ${manifest.name}`);

  if (!manifest.version) error('manifest.json missing "version"');
  else success(`Extension version: ${manifest.version}`);

  if (!manifest.description) warn('manifest.json missing "description"');
  else success(`Description: ${manifest.description}`);

  // Check version sync with package.json
  const packageJson = require('../package.json');
  if (manifest.version !== packageJson.version) {
    warn(`Version mismatch: manifest.json (${manifest.version}) != package.json (${packageJson.version})`);
  }

  // Validate permissions
  if (manifest.permissions && Array.isArray(manifest.permissions)) {
    success(`Permissions: ${manifest.permissions.join(', ')}`);

    // Check for dangerous permissions
    const dangerousPerms = ['<all_urls>', 'webRequest', 'webRequestBlocking', 'debugger'];
    const hasDangerous = manifest.permissions.some(p => dangerousPerms.includes(p));
    if (hasDangerous) {
      warn('Extension uses potentially sensitive permissions. Ensure they are justified.');
    }
  }

  // Validate host_permissions
  if (manifest.host_permissions && Array.isArray(manifest.host_permissions)) {
    success(`Host permissions: ${manifest.host_permissions.join(', ')}`);
  }

  // Check for background script
  if (manifest.background) {
    if (manifest.background.service_worker) {
      success(`Background service worker: ${manifest.background.service_worker}`);
    } else if (manifest.background.scripts) {
      warn('Using background.scripts instead of service_worker (MV2 style)');
    }
  } else {
    warn('No background script defined');
  }

  // Check for content scripts
  if (manifest.content_scripts && manifest.content_scripts.length > 0) {
    success(`Content scripts: ${manifest.content_scripts.length} defined`);
    manifest.content_scripts.forEach((cs, i) => {
      if (!cs.matches || cs.matches.length === 0) {
        error(`Content script ${i} has no matches defined`);
      }
      if (!cs.js || cs.js.length === 0) {
        error(`Content script ${i} has no js files defined`);
      }
    });
  } else {
    warn('No content scripts defined');
  }

  // Check for action (popup)
  if (manifest.action) {
    if (manifest.action.default_popup) {
      success(`Popup: ${manifest.action.default_popup}`);
    }
  } else {
    warn('No action/popup defined');
  }

  // Check for icons
  if (manifest.icons) {
    success('Icons defined:');
    Object.entries(manifest.icons).forEach(([size, iconFile]) => {
      const iconPath = path.join(__dirname, '..', 'public', iconFile);
      if (fs.existsSync(iconPath)) {
        console.log(`  ✅ ${size}x${size}: ${iconFile}`);
      } else {
        error(`Icon missing: ${iconFile}`);
      }
    });
  } else {
    warn('No icons defined in manifest');
  }

} catch (err) {
  error(`Failed to validate manifest.json: ${err.message}`);
}

// 3. Check for required source files
console.log('\n📁 Checking required source files...');
const requiredFiles = [
  'src/Popup.tsx',
  'src/content.ts',
  'src/background.ts',
  'src/popup.html',
  'public/manifest.json'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    success(file);
  } else {
    error(`Missing required file: ${file}`);
  }
});

// 4. Check for environment variables
console.log('\n🔐 Checking environment configuration...');
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  success('.env file exists');

  // Read and check for placeholder values
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your-') || envContent.includes('-here')) {
    warn('.env file contains placeholder values. Update with real credentials before deployment.');
  }

  // Check for required variables
  const requiredVars = [
    'VITE_MISTRAL_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1] && match[1].trim() && !match[1].includes('your-')) {
        success(`${varName} is set`);
      } else {
        warn(`${varName} is empty or placeholder`);
      }
    } else {
      warn(`${varName} not found in .env`);
    }
  });

} else {
  warn('.env file not found. Copy from .env.example and configure.');
}

if (!fs.existsSync(envExamplePath)) {
  warn('.env.example file not found. Create one for documentation.');
}

// 5. Check TypeScript configuration
console.log('\n⚙️  Checking TypeScript configuration...');
const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  success('tsconfig.json exists');
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (tsconfig.compilerOptions) {
      if (tsconfig.compilerOptions.strict) {
        success('Strict mode enabled');
      } else {
        warn('Consider enabling strict mode in TypeScript');
      }
    }
  } catch (err) {
    error(`Failed to parse tsconfig.json: ${err.message}`);
  }
} else {
  error('tsconfig.json not found');
}

// 6. Check dependencies
console.log('\n📚 Checking dependencies...');
try {
  const packageJson = require('../package.json');

  if (packageJson.dependencies) {
    success(`${Object.keys(packageJson.dependencies).length} dependencies`);
  }

  if (packageJson.devDependencies) {
    success(`${Object.keys(packageJson.devDependencies).length} devDependencies`);
  }

  // Check for important dependencies
  const importantDeps = ['react', 'react-dom'];
  importantDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      success(`${dep} installed`);
    } else {
      error(`Missing dependency: ${dep}`);
    }
  });

  // Check for @types packages
  if (!packageJson.devDependencies?.['@types/chrome']) {
    warn('Missing @types/chrome - Chrome API types not available');
  }

} catch (err) {
  error(`Failed to check dependencies: ${err.message}`);
}

// 7. Check for README
console.log('\n📖 Checking documentation...');
const readmePath = path.join(__dirname, '..', 'SETUP.md');
if (fs.existsSync(readmePath)) {
  success('SETUP.md exists');
} else {
  warn('SETUP.md not found. Consider adding documentation.');
}

// Final summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ VALIDATION FAILED');
  console.error('   Please fix the errors above before building.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  VALIDATION PASSED WITH WARNINGS');
  console.warn('   Consider addressing the warnings above.');
  console.log('\n✅ Extension structure is valid. You can proceed with build.');
  process.exit(0);
} else {
  console.log('✅ VALIDATION PASSED');
  console.log('🚀 Extension is ready to build!');
  process.exit(0);
}
