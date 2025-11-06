# Extension Troubleshooting Guide

Quick reference for common extension issues and their solutions.

## Common Errors

### 1. "Error getting user: Failed to fetch"

**Cause**: Supabase configuration missing or incorrect in the extension build.

**Solution**:

1. **Verify `.env` file exists** in `extension/` directory:
```bash
ls extension/.env
```

2. **Check `.env` has correct values**:
```bash
# extension/.env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_BACKEND_API_URL="http://localhost:3000"
```

3. **Rebuild the extension**:
```bash
cd extension
npm run build
```

4. **Reload extension in Chrome**:
   - Go to `chrome://extensions/`
   - Click the reload icon on Uswift extension

5. **Verify environment variables are embedded**:
```bash
grep "VITE_SUPABASE_URL" extension/dist/supabaseClient.js
# Should show your actual Supabase URL, not empty string
```

---

### 2. "The message port closed before a response was received"

**Cause**: Content script or background script communication error.

**✅ FIXED**: The extension now automatically injects the content script if it's not loaded!

**If you still see this error**:

1. **Update to latest version**:
   ```bash
   cd extension
   npm run build
   ```

2. **Reload the extension**:
   - `chrome://extensions/` → Click reload button

3. **The extension now handles this automatically**:
   - Checks if content script is loaded
   - Injects it automatically if missing
   - Shows clear error if injection fails

4. **Check console for injection errors**:
   - Open DevTools (F12)
   - Look for `[Injector]` logs
   - Should see: "Content script injected successfully"

---

### 3. Backend API Connection Failed

**Cause**: Payment backend not running or incorrect URL.

**Solutions**:

1. **Start the payment backend**:
```bash
cd payment-backend
npm run dev
```

2. **Verify backend is running**:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

3. **Check extension `.env` has correct backend URL**:
```bash
VITE_BACKEND_API_URL="http://localhost:3000"
```

4. **Check CORS settings** in `payment-backend/src/index.ts`:
```typescript
CORS_ORIGINS=http://localhost:5173,chrome-extension://*
```

---

### 4. Environment Variables Not Loading

**Cause**: Vite not loading `.env` file during build.

**Solution**:

1. **Update `vite.config.ts`** to use `loadEnv`:
```typescript
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL || ""
      ),
      // ... other vars
    },
  };
});
```

2. **Rebuild**:
```bash
cd extension
npm run build
```

---

### 5. Auto-Apply Not Working

**Causes & Solutions**:

**A. Platform not detected**:
```javascript
// In browser console on job page:
testJobBoard()
// Should show detected platform with high confidence
```

**B. Content script not injected**:
```javascript
// Check if content script loaded:
console.log("Content script:", typeof window.USwiftAutoApply)
// Should NOT be "undefined"
```

**C. Form fields not found**:
- Check selectors in `src/content.ts` match the job board's HTML
- Use DevTools Elements tab to find correct selectors
- Update selectors if job board changed their HTML

**D. CAPTCHA blocking**:
- Solve CAPTCHA manually first
- Try again after CAPTCHA is cleared

---

### 6. Files Not Uploading (Resume/Cover Letter)

**Cause**: Files not stored in Chrome storage or incorrect format.

**Solutions**:

1. **Re-upload files** in extension popup:
   - Go to Profile Vault tab
   - Upload resume and cover letter again

2. **Check storage**:
```javascript
chrome.storage.local.get(['files'], (result) => {
  console.log('Stored files:', result.files);
});
```

3. **Verify file format**:
   - Resumes should be PDF (preferred) or DOCX
   - Max file size: 5MB

---

### 7. Rate Limit Exceeded

**Cause**: Too many applications in short time.

**Default Limits**:
- 10 applications per hour (per company)
- 50 applications per day (global)

**Solutions**:

1. **Wait for rate limit to reset**:
   - Hourly limit resets after 1 hour
   - Daily limit resets after 24 hours

2. **Check rate limits via API**:
```bash
curl http://localhost:3000/api/jobs/queue/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Adjust limits** (backend):
   - Edit `payment-backend/src/routes/jobs.ts`
   - Change `maxCount` parameters in `checkRateLimit()` calls

---

### 8. Job Stuck in "queued" Status

**Cause**: Worker not processing jobs or Redis not running.

**Solutions**:

1. **Check Redis is running**:
```bash
redis-cli ping
# Should return: PONG
```

2. **Check worker logs**:
```bash
# In payment-backend terminal
# Should see: "JobWorker initialized"
```

3. **Check queue metrics**:
```bash
curl http://localhost:3000/api/jobs/queue/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Restart backend** to reinitialize worker:
```bash
cd payment-backend
npm run dev
```

---

### 9. Authentication/Sign-in Issues

**Solutions**:

1. **Clear extension storage**:
```javascript
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

2. **Sign out and sign in again**:
   - Click "Sign Out" in extension
   - Click "Sign In"
   - Enter credentials

3. **Check Supabase project**:
   - Verify project is active at supabase.com
   - Check auth settings allow email/password
   - Verify user exists in Authentication tab

---

### 10. Extension Not Loading

**Solutions**:

1. **Check manifest.json is valid**:
```bash
cat extension/dist/manifest.json
# Verify JSON is valid (use jsonlint.com)
```

2. **Check all required files exist**:
```bash
ls extension/dist/
# Should see: popup.html, popup.js, content.js, background.js, manifest.json
```

3. **Check Chrome version**:
   - Manifest V3 requires Chrome 88+
   - Update Chrome if needed

4. **Check permissions**:
   - Some permissions require justification
   - Remove unused permissions from manifest.json

---

## Debugging Tips

### Enable Debug Mode

In `extension/.env`:
```bash
VITE_DEBUG_MODE=true
```

Rebuild and reload extension. This enables verbose logging.

### Check Service Worker Logs

1. Go to `chrome://extensions/`
2. Find Uswift extension
3. Click "Inspect views: service worker"
4. Check Console tab for errors

### Check Content Script Logs

1. Open job page
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for USwift logs (prefixed with 🚀)

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Try auto-apply action
4. Check for failed requests (red)
5. Click failed request to see error details

### Check Chrome Storage

```javascript
// Check all stored data
chrome.storage.local.get(null, (data) => {
  console.log('All storage:', data);
});

// Check specific keys
chrome.storage.local.get(['profile', 'files', 'supabase_session'], (data) => {
  console.log('Profile:', data.profile);
  console.log('Files:', data.files);
  console.log('Session:', data.supabase_session);
});
```

### Clear Cache and Reload

1. Right-click reload button in Chrome
2. Select "Empty Cache and Hard Reload"
3. Or use Ctrl+Shift+R

---

## Quick Fixes Checklist

When something breaks, run through this checklist:

- [ ] Rebuild extension: `cd extension && npm run build`
- [ ] Reload extension: chrome://extensions/ → Reload
- [ ] Refresh current tab: F5
- [ ] Check backend is running: `curl http://localhost:3000/health`
- [ ] Check Redis is running: `redis-cli ping`
- [ ] Check Supabase project is active
- [ ] Check browser console for errors
- [ ] Check service worker console for errors
- [ ] Clear extension storage and re-authenticate
- [ ] Try in incognito mode (to rule out extension conflicts)

---

## Getting Help

If issues persist:

1. **Check logs**:
   - Extension console (F12)
   - Service worker console
   - Backend logs (terminal)

2. **Create minimal reproduction**:
   - What exact steps cause the error?
   - What job board/URL?
   - Screenshots of error messages

3. **Check GitHub Issues**:
   - Search existing issues
   - Create new issue with details

---

## Known Issues

### Workday Applications

Workday uses complex multi-step forms. Auto-apply may fail on:
- Multi-page applications
- Dynamic field validation
- Custom dropdown components

**Workaround**: Use manual application for Workday jobs.

### LinkedIn Easy Apply

LinkedIn frequently changes their HTML. If auto-apply fails:
- Check for selector updates
- Update `src/content.ts` selectors
- Report issue on GitHub

### Browser Permissions

Some job boards block extensions via CSP (Content Security Policy):
- Indeed (sometimes)
- Glassdoor (sometimes)

**Workaround**: Disable CSP via Chrome flags (dev only) or use manual application.

---

## Preventing Issues

1. **Always rebuild after changing `.env`**:
```bash
cd extension && npm run build
```

2. **Keep dependencies updated**:
```bash
npm update
```

3. **Test in dev mode first**:
```bash
npm run dev
# Test before building production
```

4. **Version control your `.env`** (use `.env.local` for secrets):
```bash
# Don't commit .env with real keys
# Keep .env.example up to date
```

5. **Monitor backend logs** when testing:
```bash
cd payment-backend
npm run dev
# Watch for errors
```

---

## Support Resources

- **Documentation**: See `AUTO_APPLY_QUEUE_IMPLEMENTATION.md`
- **Setup Guide**: See `QUEUE_SETUP_GUIDE.md`
- **Extension Docs**: `extension/AUTO_APPLY_GUIDE.md`
- **Job Management**: `dashboard/JOB_MANAGEMENT_README.md`
