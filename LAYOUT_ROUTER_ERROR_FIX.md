# Layout Router Error Fix - Complete Guide

**Date:** October 10, 2025  
**Error:** `Uncaught Error: invariant expected layout router to be mounted`  
**Status:** ✅ RESOLVED

---

## 🔴 The Problem

### Primary Error
```
Uncaught Error: invariant expected layout router to be mounted
    at OuterLayoutRouter (layout-router.js:369:37)
```

This error occurs when:
1. **Client components manipulate the DOM before Next.js App Router finishes mounting**
2. **Path casing conflicts on Windows cause webpack to load modules twice**

---

## 🔍 Root Causes Identified

### 1. **ScrollEffects.tsx Component (Primary Cause)**

**Location:** `dashboard/components/ScrollEffects.tsx`

**Problem:** The component was performing aggressive DOM manipulation in `useEffect` with empty dependencies `[]`, causing it to run immediately on mount:

```tsx
useEffect(() => {
  // ❌ PROBLEMATIC: Runs immediately on mount
  const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  
  // ❌ Hijacks document scroll before router mounts
  ScrollTrigger.scrollerProxy(document.scrollingElement || document.documentElement, {...});
  
  // ❌ Queries DOM elements before React hydration completes
  gsap.utils.toArray("[data-animate='reveal']").forEach(el => gsap.fromTo(el, {...}));
  gsap.utils.toArray("[data-animate='stagger']").forEach(container => {...});
  gsap.utils.toArray("[data-parallax]").forEach(el => ScrollTrigger.create({...}));
}, []); // Empty deps = runs on first mount
```

**Why it breaks:**
- Lenis hijacks native scroll behavior
- ScrollTrigger.scrollerProxy manipulates `document.scrollingElement`
- GSAP queries DOM before React finishes hydration
- All of this happens **before** the Next.js layout router can establish its context

---

### 2. **Windows Path Casing Conflict (Secondary Cause)**

**Problem:** Webpack loads modules from both paths:
- `C:\Users\DELL\Uswift` (actual folder name - capital U)
- `C:\Users\DELL\uswift` (Git Bash lowercase access)

**Evidence:**
```bash
$ ls -la /c/Users/DELL | grep -i uswift
drwxr-xr-x 1 DELL 197121  0 Oct 10 19:08 Uswift/  # ✅ Actual folder

$ pwd
/c/Users/DELL/uswift/dashboard  # ❌ Git Bash using lowercase
```

**Webpack Warnings:**
```
There are multiple modules with names that only differ in casing.
* C:\Users\DELL\Uswift\node_modules\next\dist\...
* C:\Users\DELL\uswift\node_modules\next\dist\...
```

**Why it breaks:**
- Webpack sees two different paths for the same module
- This causes duplicate module loading
- The layout router gets initialized twice with different contexts
- Result: "invariant expected layout router to be mounted" error

---

## ✅ The Complete Fix

### Step 1: Remove or Fix ScrollEffects.tsx

#### **Option A: Remove ScrollEffects (Temporary Fix)**

Remove the import from `dashboard/app/page.tsx`:

```tsx
// ❌ Remove this line
import ScrollEffects from "@/components/ScrollEffects";

export default function HomePage() {
  return (
    <>
      {/* ❌ Remove this component */}
      {/* <ScrollEffects /> */}
      
      {/* ✅ Keep the rest of your page */}
      <LandingHero />
      {/* ... other components */}
    </>
  );
}
```

#### **Option B: Fix ScrollEffects (Permanent Solution)**

Delay initialization until after layout router mounts:

```tsx
"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollEffects(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // ✅ CRITICAL FIX: Wait 100ms for layout router to mount
    const initTimeout = setTimeout(() => {
      const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
      let rafId = 0;
      
      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      ScrollTrigger.scrollerProxy(document.scrollingElement || document.documentElement, {
        scrollTop(value) {
          if (arguments.length && value !== undefined) return lenis.scrollTo(value);
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
      });

      // ... rest of GSAP animations
      
    }, 100); // ✅ 100ms delay ensures router mounts first

    return () => {
      clearTimeout(initTimeout);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}
```

---

### Step 2: Fix Windows Path Casing

**Always use the correct capitalized path:** `Uswift` (capital U)

#### Check your current path:
```bash
pwd
# Should show: /c/Users/DELL/Uswift/dashboard
```

#### Navigate to correct path:
```bash
cd /c/Users/DELL/Uswift/dashboard
```

#### Clear the build cache:
```bash
rm -rf .next
```

#### Verify folder name:
```bash
cd /c/Users/DELL && ls -la | grep -i uswift
# Should show: drwxr-xr-x 1 DELL 197121  0 Oct 10 19:08 Uswift/
```

---

### Step 3: Start Dev Server from Correct Path

```bash
cd /c/Users/DELL/Uswift/dashboard
pnpm dev
```

**Important:** Always ensure you're working in `/c/Users/DELL/Uswift` (capital U), not `/c/Users/DELL/uswift` (lowercase).

---

## 📋 Verification Checklist

- [ ] ScrollEffects removed from `app/page.tsx` OR fixed with `setTimeout` delay
- [ ] Working directory is `/c/Users/DELL/Uswift/dashboard` (capital U)
- [ ] Build cache cleared: `.next` folder deleted
- [ ] Dev server started with `pnpm dev`
- [ ] No "invariant expected layout router to be mounted" error
- [ ] No webpack casing warnings in console

---

## 🎯 Key Lessons Learned

1. **Never manipulate `document.scrollingElement` or query DOM elements in `useEffect` without checking if the router is mounted first**

2. **Windows is case-insensitive but webpack is case-sensitive:**
   - Use the correct folder casing consistently
   - Git Bash can access folders with any casing, but this causes webpack conflicts

3. **Next.js 15 App Router requires:**
   - Layout router must mount before any client-side DOM manipulation
   - Use `setTimeout` or mount state checks before initializing libraries like Lenis, GSAP ScrollTrigger, etc.

4. **Heavy animation libraries (GSAP, Lenis) should:**
   - Delay initialization by at least 100ms
   - Check for `document.readyState === 'complete'`
   - Use dynamic imports with `next/dynamic` for better control

5. **Always clear `.next` cache after:**
   - Path changes
   - Major file deletions/renames
   - Provider/layout restructuring

---

## 🚫 What Didn't Work (Attempted Fixes)

### ❌ Failed Approach 1: Provider Restructuring
- Created `providers.tsx` wrapper
- Created `ClientAuthProvider.tsx`
- Result: Error persisted

### ❌ Failed Approach 2: Error Boundaries
- Added `LayoutErrorBoundary.tsx`
- Result: Boundary caught error but didn't prevent it

### ❌ Failed Approach 3: Removing head.tsx
- Deleted conflicting `app/head.tsx`
- Updated `layout.tsx` to use Metadata export
- Result: Fixed metadata conflict but layout router error persisted

### ❌ Failed Approach 4: Removing Client-Side Redirects
- Removed redirect logic from pages
- Result: Error still occurred on initial page load

### ✅ What Actually Worked:
1. **Removing/delaying ScrollEffects DOM manipulation**
2. **Using correct path casing (Uswift not uswift)**
3. **Clearing build cache**

---

## 🔧 Debugging Tips for Future

### Check if it's a DOM manipulation issue:
```tsx
// Add this to suspect components
useEffect(() => {
  console.log('Component mounted:', document.readyState);
  console.log('Has layout router:', document.querySelector('[data-nextjs-router]'));
}, []);
```

### Check path casing issues:
```bash
# In Git Bash
pwd  # Should show capital U
cd .. && ls -la | grep -i uswift  # Verify actual folder name
```

### Force webpack to show all warnings:
```js
// next.config.js
module.exports = {
  webpack: (config) => {
    config.stats = 'verbose';
    return config;
  },
};
```

---

## 📝 Related Files Modified

- `dashboard/app/page.tsx` - Removed ScrollEffects import
- `dashboard/components/ScrollEffects.tsx` - Added setTimeout delay (if using Option B)
- `dashboard/app/head.tsx` - **DELETED** (was conflicting with layout metadata)
- `dashboard/app/layout.tsx` - Uses Metadata export instead of <head> tag

---

## 🌐 Environment Details

- **OS:** Windows 10/11
- **Shell:** Git Bash (MINGW64)
- **Next.js:** 15.5.3
- **React:** 19.1.1
- **Node.js:** Compatible with pnpm
- **Package Manager:** pnpm
- **Repository:** https://github.com/Ajoe62/Uswift.git

---

## ⚡ Quick Reference Commands

```bash
# Navigate to correct path
cd /c/Users/DELL/Uswift/dashboard

# Clear cache
rm -rf .next

# Start dev server
pnpm dev

# Check path
pwd  # Should be /c/Users/DELL/Uswift/dashboard

# Verify folder casing
cd /c/Users/DELL && ls -la | grep Uswift
```

---

**Status:** This error is now fully documented and resolved. Future developers should refer to this guide if they encounter similar layout router mounting issues.
