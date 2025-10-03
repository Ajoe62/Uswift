#!/usr/bin/env node

/**
 * Version bump script
 * Increments version in both package.json and manifest.json
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔢 Uswift Extension - Version Bump Tool\n');

// Read current versions
const packagePath = path.join(__dirname, '..', 'package.json');
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');

let packageJson, manifest;

try {
  packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (err) {
  console.error('❌ Error reading files:', err.message);
  process.exit(1);
}

const currentVersion = packageJson.version;
console.log(`📌 Current version: ${currentVersion}`);

// Parse version
const [major, minor, patch] = currentVersion.split('.').map(Number);

if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
  console.error('❌ Invalid version format. Expected: x.y.z');
  process.exit(1);
}

// Calculate new versions
const versions = {
  patch: `${major}.${minor}.${patch + 1}`,
  minor: `${major}.${minor + 1}.0`,
  major: `${major + 1}.0.0`
};

console.log('\n📊 Available bumps:');
console.log(`  1. Patch: ${versions.patch} (bug fixes)`);
console.log(`  2. Minor: ${versions.minor} (new features, backwards compatible)`);
console.log(`  3. Major: ${versions.major} (breaking changes)`);
console.log(`  4. Custom version`);
console.log(`  5. Cancel\n`);

rl.question('Select bump type (1-5): ', (answer) => {
  let newVersion;

  switch (answer.trim()) {
    case '1':
      newVersion = versions.patch;
      break;
    case '2':
      newVersion = versions.minor;
      break;
    case '3':
      newVersion = versions.major;
      break;
    case '4':
      rl.question('Enter custom version (x.y.z): ', (custom) => {
        if (!/^\d+\.\d+\.\d+$/.test(custom)) {
          console.error('❌ Invalid version format. Expected: x.y.z');
          process.exit(1);
        }
        updateVersion(custom);
        rl.close();
      });
      return;
    case '5':
      console.log('❌ Cancelled');
      process.exit(0);
      return;
    default:
      console.error('❌ Invalid selection');
      process.exit(1);
      return;
  }

  updateVersion(newVersion);
  rl.close();
});

function updateVersion(newVersion) {
  console.log(`\n🔄 Updating version to ${newVersion}...`);

  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('  ✅ Updated package.json');

  // Update manifest.json
  manifest.version = newVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('  ✅ Updated public/manifest.json');

  console.log('\n' + '='.repeat(50));
  console.log('✅ VERSION UPDATED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log(`📌 Old version: ${currentVersion}`);
  console.log(`📌 New version: ${newVersion}`);
  console.log('\n📝 Next steps:');
  console.log('  1. Review changes: git diff');
  console.log('  2. Test the extension: npm run build && load in Chrome');
  console.log('  3. Commit changes: git commit -am "Bump version to ' + newVersion + '"');
  console.log('  4. Create git tag: git tag v' + newVersion);
  console.log('  5. Build release: npm run package');
  console.log('  6. Push changes: git push && git push --tags');

  console.log('\n✅ Done!');
}
