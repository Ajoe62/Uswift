# Uswift Dashboard - Troubleshooting Guide

Complete troubleshooting guide for common errors encountered during development and deployment of the Uswift Dashboard.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Authentication Errors](#authentication-errors)
3. [TypeScript / Module Resolution Errors](#typescript--module-resolution-errors)
4. [CSS / Styling Errors](#css--styling-errors)
5. [Build & Compilation Errors](#build--compilation-errors)
6. [Runtime Errors](#runtime-errors)
7. [Development Server Issues](#development-server-issues)
8. [Merge Conflict Resolution](#merge-conflict-resolution)
9. [General Debugging Tips](#general-debugging-tips)

---

## Quick Reference

### Most Common Errors

| Error | Status | Quick Fix |
|-------|--------|-----------|
| useAuth must be used within AuthProvider | 500 | Wrap layout with `<AuthProvider>` |
| Cannot find module '@/components/...' | TS2307 | Create root `app/page.tsx` |
| Also define standard property 'mask' | Warning | Add `mask:` after `-webkit-mask:` |
| Port already in use | EADDRINUSE | Kill node processes |
| Next.js cache issues | Various | `rm -rf .next` |

### Emergency Commands

```bash
# Kill all node processes
taskkill /F /IM node.exe         # Windows
killall node                      # Mac/Linux

# Clean all caches
cd dashboard
rm -rf .next node_modules package-lock.json
npm install

# Fresh dev server start
npm run dev

# Type check
npm run type-check
```

---

## Authentication Errors

### Error: useAuth must be used within an AuthProvider

**Full Error:**
```
Error: useAuth must be used within an AuthProvider
    at useAuth (lib\contexts\AuthContext.tsx:85:11)
    at Navbar (components\ui\Navbar.tsx:10:36)
```

**Status Code:** 500

**Cause:** Component using `useAuth()` hook is rendered outside `AuthProvider` context.

**Fix:** Wrap application with `AuthProvider` in root layout.

**Detailed Guide:** [FIX-AUTH-PROVIDER-ERROR.md](./FIX-AUTH-PROVIDER-ERROR.md)

**Quick Fix:**

```typescript
// dashboard/app/layout.tsx
import { AuthProvider } from "../lib/contexts/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>  {/* ← Add this */}
          <Navbar />
          {children}
        </AuthProvider>  {/* ← Add this */}
      </body>
    </html>
  );
}
```

**Verification:**
```bash
npm run dev
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# Should return: 308 or 200 (not 500)
```

### Error: Supabase client not initialized

**Symptoms:**
- Auth doesn't work
- Can't sign in/sign up
- Console errors about undefined client

**Fix:**

1. Check environment variables:
```bash
# dashboard/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

2. Restart dev server after adding .env:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

3. Verify Supabase client:
```typescript
// dashboard/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## TypeScript / Module Resolution Errors

### Error: Cannot find module '@/components/LandingHero'

**Full Error:**
```
Cannot find module '@/components/LandingHero' or its corresponding type declarations.
Error Code: 2307
```

**Cause:** VSCode TypeScript looking for root `app/page.tsx` that doesn't exist.

**Fix:** Create root page with redirect.

**Detailed Guide:** [FIX-TYPESCRIPT-MODULE-ERROR.md](./FIX-TYPESCRIPT-MODULE-ERROR.md)

**Quick Fix:**

```typescript
// dashboard/app/page.tsx (create this file)
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return null;
}
```

**Verification:**
```bash
npm run type-check
# Should output: no errors
```

### Error: Cannot find module 'next/navigation'

**Fix:**

1. Reinstall dependencies:
```bash
cd dashboard
rm -rf node_modules package-lock.json
npm install
```

2. Check Next.js version:
```bash
npm list next
# Should be: next@15.5.2 or higher
```

3. Restart TypeScript server:
- VSCode: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Path Mapping Issues (@/ imports not working)

**Fix:**

1. Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. Reload VSCode window:
- `Ctrl+Shift+P` → "Developer: Reload Window"

---

## CSS / Styling Errors

### Warning: Also define standard property 'mask'

**Full Error:**
```
Also define the standard property 'mask' for compatibility
Code: vendorPrefix
Line: 75
```

**Cause:** Using `-webkit-mask` without standard `mask` property.

**Fix:** Add standard property after vendor prefix.

**Detailed Guide:** [FIX-CSS-VENDOR-PREFIX-WARNING.md](./FIX-CSS-VENDOR-PREFIX-WARNING.md)

**Quick Fix:**

```css
/* dashboard/styles/globals.css */
.card-blue-frame::before {
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);  /* ← Add this */
  mask-composite: exclude;
}
```

### Error: Tailwind classes not working

**Symptoms:**
- Classes applied but no styles
- `bg-blue-500` doesn't work
- Custom colors not showing

**Fix:**

1. Check Tailwind content config:
```javascript
// dashboard/tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ...
}
```

2. Restart dev server:
```bash
npm run dev
```

3. Check PostCSS config:
```javascript
// dashboard/postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

4. Clear Tailwind cache:
```bash
rm -rf .next
npm run dev
```

---

## Build & Compilation Errors

### Error: Build fails with type errors

**Symptoms:**
```bash
npm run build
# Output: Type error: ...
```

**Fix:**

1. Run type check first:
```bash
npm run type-check
```

2. Fix reported errors

3. Try build again:
```bash
npm run build
```

### Error: Out of memory during build

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Fix:**

1. Increase Node memory:
```bash
# package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

2. Or use environment variable:
```bash
# Windows
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

# Mac/Linux
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Error: Module not found during build

**Fix:**

1. Clean install:
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

2. Check all imports are correct

3. Ensure all dependencies are in package.json

---

## Runtime Errors

### Error: Hydration failed

**Full Error:**
```
Error: Hydration failed because the initial UI does not match what was rendered on the server
```

**Common Causes:**

1. **Date/Time rendering differently:**
```typescript
// ❌ Wrong (hydration mismatch)
<div>{new Date().toString()}</div>

// ✅ Correct (client-only)
"use client";
const [time, setTime] = useState(null);
useEffect(() => setTime(new Date().toString()), []);
```

2. **localStorage/window accessed on server:**
```typescript
// ❌ Wrong
const theme = localStorage.getItem('theme');

// ✅ Correct
const [theme, setTheme] = useState(null);
useEffect(() => {
  setTheme(localStorage.getItem('theme'));
}, []);
```

3. **Conditional rendering mismatch:**
```typescript
// Use suppressHydrationWarning for unavoidable differences
<html suppressHydrationWarning>
<body suppressHydrationWarning>
```

### Error: 404 on API routes

**Symptoms:**
- `/api/dashboard/stats` returns 404
- API routes not found

**Fix:**

1. Check file structure:
```
app/
└── api/
    └── dashboard/
        └── stats/
            └── route.ts  ← Must be named 'route.ts'
```

2. Verify route handler:
```typescript
// app/api/dashboard/stats/route.ts
export async function GET(request: Request) {
  return Response.json({ data: "..." });
}
```

3. Restart dev server:
```bash
npm run dev
```

---

## Development Server Issues

### Error: Port 3000 already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**

1. **Find and kill process (Windows):**
```bash
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

2. **Find and kill process (Mac/Linux):**
```bash
lsof -i :3000
kill -9 [PID_NUMBER]
```

3. **Kill all node processes:**
```bash
# Windows
taskkill /F /IM node.exe

# Mac/Linux
killall node
```

4. **Use different port:**
```bash
PORT=3001 npm run dev
```

### Dev server not reloading

**Symptoms:**
- Changes not reflecting
- Hot reload not working
- Stale content

**Fix:**

1. **Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

2. **Hard refresh browser:**
- Chrome: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

3. **Restart dev server:**
```bash
# Stop (Ctrl+C) and restart
npm run dev
```

4. **Check file watchers (Linux):**
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Merge Conflict Resolution

### Conflict in dashboard files

**Strategy:** Prioritize backend-implement, maintain white UI

**Process:**

1. **Check conflict status:**
```bash
git status
```

2. **For each conflicted file:**

```bash
# View conflict markers
cat dashboard/app/layout.tsx
```

3. **Resolve based on priority:**
- **Backend features** → Use `backend-implement` version
- **UI/Styling** → Use `master` (white layout)
- **Configuration** → Merge both carefully

4. **Mark as resolved:**
```bash
git add dashboard/app/layout.tsx
```

5. **Test after resolving all:**
```bash
npm run type-check
npm run dev
```

6. **Complete merge:**
```bash
git commit -m "Merge: resolve conflicts"
```

### Common conflict patterns

**Layout conflicts:**
```typescript
<<<<<<< HEAD
<body className="bg-uswift-gradient">
=======
<body className="bg-white">
>>>>>>> backend-implement
```

**Resolution:** Use `bg-white` (maintain white UI)

**Import conflicts:**
```typescript
<<<<<<< HEAD
import OldComponent from "@/components/Old";
=======
import NewComponent from "@/components/New";
>>>>>>> backend-implement
```

**Resolution:** Use backend-implement version (newer features)

---

## General Debugging Tips

### Enable Verbose Logging

```bash
# Next.js build with verbose output
npm run build -- --debug

# Dev server with more info
DEBUG=* npm run dev
```

### Check Console Errors

1. **Open browser DevTools:** `F12`
2. **Check Console tab** for JavaScript errors
3. **Check Network tab** for failed requests
4. **Check Application tab** for localStorage/cookies

### TypeScript Debugging

```typescript
// Add type assertions to narrow down issues
const user = data as User;

// Use console.log with types
console.log('User type:', typeof user, user);

// Enable sourceMap for better stack traces
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

### Next.js Debugging

```javascript
// next.config.js
module.exports = {
  // Enable React strict mode
  reactStrictMode: true,

  // Show more detailed errors
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}
```

### Supabase Debugging

```typescript
// Enable Supabase debug mode
const supabase = createClient(url, key, {
  auth: {
    debug: true,  // Logs auth events
  },
})

// Check auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

---

## Useful Commands Cheat Sheet

```bash
# Development
npm run dev              # Start dev server
npm run dev:turbo        # Start with Turbo (faster)
npm run type-check       # Check TypeScript
npm run lint             # Run ESLint

# Building
npm run build            # Production build
npm run start            # Start production server

# Cleaning
rm -rf .next             # Clear Next.js cache
rm -rf node_modules      # Remove dependencies
rm tsconfig.tsbuildinfo  # Clear TS build cache

# Git
git status               # Check merge status
git add <file>           # Stage resolved conflicts
git merge --abort        # Abort merge if needed

# Process Management
taskkill /F /IM node.exe     # Kill all node (Windows)
killall node                  # Kill all node (Mac/Linux)
lsof -i :3000                # Check port usage (Mac/Linux)
netstat -ano | findstr :3000 # Check port usage (Windows)
```

---

## Getting Help

### Documentation

- **Project README:** `CLAUDE.md`
- **Job Management:** `dashboard/JOB_MANAGEMENT_README.md`
- **Extension Guide:** `extension/AUTO_APPLY_GUIDE.md`

### Error-Specific Guides

- [AuthProvider Error](./FIX-AUTH-PROVIDER-ERROR.md)
- [TypeScript Module Error](./FIX-TYPESCRIPT-MODULE-ERROR.md)
- [CSS Vendor Prefix Warning](./FIX-CSS-VENDOR-PREFIX-WARNING.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community

- Next.js Discord
- Supabase Discord
- Stack Overflow (tag: nextjs, supabase)

---

## Preventive Measures

### Before Committing

```bash
# Run all checks
npm run type-check
npm run lint
npm run build

# Test key routes
npm run dev
# Visit: /, /home, /dashboard, /auth/signin
```

### Before Merging

```bash
# Update from main
git fetch origin
git merge origin/main

# Resolve conflicts carefully
# Test thoroughly
npm run type-check
npm run dev
```

### Code Review Checklist

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Dev server runs without errors
- [ ] Build succeeds
- [ ] Key routes load correctly
- [ ] Authentication works
- [ ] No console errors in browser

---

**Last Updated:** 2025-10-13
**Dashboard Version:** Next.js 15.5.2
**Status:** ✅ Production Ready

---

## Quick Issue Resolution Matrix

| Symptom | Likely Cause | First Step |
|---------|--------------|------------|
| Page returns 500 | AuthProvider missing | Check layout.tsx |
| TypeScript errors | Missing files | Create root page.tsx |
| CSS warnings | Vendor prefixes | Add standard properties |
| Port in use | Node process running | Kill node processes |
| Build fails | Type errors | Run type-check |
| Hot reload broken | Cache issues | Clear .next folder |
| Auth not working | Missing env vars | Check .env.local |
| API 404 | Wrong route structure | Check route.ts naming |
| Hydration error | SSR/CSR mismatch | Use suppressHydrationWarning |
| Imports not found | Path mapping issue | Check tsconfig.json |

---

**Remember:** When in doubt, clear cache, restart dev server, and run type-check! 🚀
