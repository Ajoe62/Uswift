# 🏗️ Uswift Extension - Build Guide

Complete guide here for building, packaging, and deploying the Uswift Chrome Extension.

---

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Configured `.env` file (see [SETUP.md](SETUP.md))

---

## 🛠️ Available Build Commands

### Development

```bash
# Start development server with hot reload
npm run dev

# Watch mode - rebuild on file changes
npm run watch

# Type checking only (no build)
npm run type-check
```

### Production Build

```bash
# Clean build (recommended)
npm run build

# Production optimized build
npm run build:prod

# Clean dist directory only
npm run clean
```

### Validation & Testing

```bash
# Validate extension structure before build
npm run validate

# Run TypeScript linting
npm run lint
```

### Packaging

```bash
# Build + Create ZIP for Chrome Web Store (production)
npm run package

# Build dev version + Create ZIP
npm run package:dev
```

### Version Management

```bash
# Interactive version bump tool
npm run version:bump
```

---

## 🔨 Build Process Details

### 1. Development Build

```bash
npm run dev
```

**What it does:**
- Starts Vite dev server
- Enables hot module replacement (HMR)
- Source maps for debugging
- Fast rebuild on file changes

**Output**: `dist/` directory with development build

**Use case**: Local development and testing

---

### 2. Production Build

```bash
npm run build:prod
```

**What it does:**
1. Cleans `dist/` directory
2. Runs TypeScript compiler (`tsc`)
3. Runs Vite build with production optimizations
4. Copies manifest.json to dist/
5. Runs post-build validation

**Output**: Optimized `dist/` directory

**Build steps:**
```
Clean → TypeScript Check → Vite Build → Copy Assets → Validate
```

---

### 3. Packaging for Release

```bash
npm run package
```

**What it does:**
1. Runs production build
2. Creates ZIP file in `releases/` directory
3. Names file: `uswift-extension-v{version}-{date}.zip`
4. Creates `latest.zip` copy
5. Generates release notes template

**Output:**
```
releases/
├── uswift-extension-v1.0.0-2025-01-15.zip
├── latest.zip
└── release-notes-v1.0.0.md
```

**File size limits:**
- Chrome Web Store: 50MB maximum
- Recommended: < 20MB for optimal user experience

---

### 4. Validation

```bash
npm run validate
```

**Checks performed:**
- ✅ package.json structure
- ✅ manifest.json validity
- ✅ Required source files exist
- ✅ Environment variables configured
- ✅ TypeScript configuration
- ✅ Dependencies installed
- ✅ Icon files present
- ⚠️  Placeholder values in .env
- ⚠️  Version consistency

**Exit codes:**
- `0`: Validation passed (with or without warnings)
- `1`: Validation failed (errors found)

---

### 5. Post-Build Checks

Automatically runs after every build.

**Checks:**
- All required files present in dist/
- manifest.json is valid JSON
- Icons copied correctly
- Bundle size analysis
- Creates build-info.json

**Output example:**
```
📋 Checking required files:
  ✅ popup.html (15.32 KB)
  ✅ popup.js (234.56 KB)
  ✅ content.js (189.23 KB)
  ✅ background.js (45.67 KB)
  ✅ manifest.json (1.23 KB)

📊 Bundle size analysis:
  📦 Total size: 2.34 MB
```

---

## 📦 dist/ Directory Structure

After build, your `dist/` folder should look like:

```
dist/
├── popup.html          # Popup UI
├── popup.js           # Compiled popup script
├── content.js         # Content script (injected into pages)
├── background.js      # Background service worker
├── manifest.json      # Extension manifest
├── icon16.png         # 16x16 icon
├── icon48.png         # 48x48 icon
├── icon128.png        # 128x128 icon
├── assets/            # CSS, images, fonts
│   ├── popup.css
│   └── ...
└── build-info.json    # Build metadata
```

---

## 🔢 Version Management

### Bump Version

```bash
npm run version:bump
```

**Interactive menu:**
```
1. Patch: 1.0.1 (bug fixes)
2. Minor: 1.1.0 (new features)
3. Major: 2.0.0 (breaking changes)
4. Custom version
5. Cancel
```

**Updates:**
- `package.json` version
- `public/manifest.json` version

**After bump:**
1. Review: `git diff`
2. Test: `npm run build`
3. Commit: `git commit -am "Bump version to x.y.z"`
4. Tag: `git tag vx.y.z`
5. Push: `git push && git push --tags`

---

## 🚀 Deployment Workflow

### Local Testing

```bash
# 1. Build extension
npm run build

# 2. Load in Chrome
# Open: chrome://extensions/
# Enable: Developer mode
# Click: Load unpacked
# Select: dist/ folder

# 3. Test all features
# - Auto-apply on job boards
# - AI tools (chat, resume, etc.)
# - Profile management
# - Job tracker
```

### Chrome Web Store Deployment

```bash
# 1. Validate everything
npm run validate

# 2. Bump version
npm run version:bump

# 3. Create release package
npm run package

# 4. Upload to Chrome Web Store
# Go to: https://chrome.google.com/webstore/devconsole
# Upload: releases/uswift-extension-v{version}-{date}.zip
# Fill in store listing
# Submit for review
```

---

## 🐛 Troubleshooting

### Build Fails

**Error**: "Module not found"
```bash
# Solution: Install dependencies
npm install
```

**Error**: "TypeScript errors"
```bash
# Solution: Check types
npm run type-check

# Fix errors or skip type check (not recommended)
vite build
```

### Post-Build Validation Fails

**Error**: "Missing required file: manifest.json"
```bash
# Solution: Check vite.config.ts copy-manifest plugin
# Ensure public/manifest.json exists
```

**Error**: "Bundle size exceeds 10MB"
```bash
# Solution: Optimize assets
# - Compress images
# - Remove unused dependencies
# - Enable Vite minification
```

### Package Creation Fails

**Windows**: "Compress-Archive command failed"
```bash
# Solution: Run PowerShell as Administrator
# Or install 7-Zip and modify package.js to use it
```

**Linux/Mac**: "zip: command not found"
```bash
# Solution: Install zip
sudo apt-get install zip  # Ubuntu/Debian
brew install zip          # macOS
```

### Extension Won't Load in Chrome

**Error**: "Manifest file is missing or unreadable"
```bash
# Solution:
# 1. Check dist/manifest.json exists
# 2. Validate JSON syntax
npm run validate
```

**Error**: "Could not load background script"
```bash
# Solution:
# 1. Check dist/background.js exists
# 2. Open service worker console for errors
# chrome://extensions/ → Service Worker → Inspect
```

---

## ⚙️ Build Configuration

### vite.config.ts

Key configurations:

```typescript
{
  build: {
    outDir: "dist",           // Output directory
    minify: false,            // Disable minification for debugging
    target: "esnext",         // Modern JS
    rollupOptions: {
      input: {
        popup: "src/popup.html",
        content: "src/content.ts",
        background: "src/background.ts"
      }
    }
  }
}
```

### tsconfig.json

TypeScript settings:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

---

## 📊 Build Performance

### Typical Build Times

- **Development build**: 2-5 seconds
- **Production build**: 10-20 seconds
- **Full package**: 15-30 seconds

### Optimization Tips

1. **Use watch mode** for development
   ```bash
   npm run watch
   ```

2. **Skip type checking** for faster builds (dev only)
   ```bash
   vite build
   ```

3. **Clean builds** when facing cache issues
   ```bash
   npm run clean && npm run build
   ```

4. **Parallel builds** (if you have multiple projects)
   ```bash
   npm run build & cd ../dashboard && npm run build
   ```

---

## 🔒 Security Considerations

### Before Building for Production

- [ ] Remove console.log statements
- [ ] Remove debug flags
- [ ] Validate .env doesn't contain test/dev credentials
- [ ] Review permissions in manifest.json
- [ ] Test with production API endpoints
- [ ] Enable Content Security Policy

### .env File

**Development:**
```env
VITE_DEBUG_MODE=true
NODE_ENV=development
```

**Production:**
```env
VITE_DEBUG_MODE=false
NODE_ENV=production
```

---

## 📝 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Extension

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run validate
      - run: npm run build
      - run: npm run package
      - uses: actions/upload-artifact@v2
        with:
          name: extension-package
          path: releases/*.zip
```

---

## 🆘 Getting Help

If you encounter build issues:

1. Check this BUILD.md guide
2. Review error messages carefully
3. Run `npm run validate` for diagnostics
4. Check browser console (F12) for runtime errors
5. Review [SETUP.md](SETUP.md) for configuration help

---

## ✅ Build Checklist

Before releasing:

- [ ] `npm run validate` passes
- [ ] `npm run lint` passes
- [ ] All tests pass (when implemented)
- [ ] Version bumped appropriately
- [ ] Release notes created
- [ ] Tested in Chrome (load unpacked)
- [ ] All features work correctly
- [ ] No console errors
- [ ] .env configured for production
- [ ] Package created: `npm run package`
- [ ] ZIP file size < 50MB

---

Happy building! 🚀
