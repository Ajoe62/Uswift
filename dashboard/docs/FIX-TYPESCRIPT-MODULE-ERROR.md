# Fix: Cannot find module '@/components/LandingHero'

## Error Description

```
{
  "resource": "/C:/Users/DELL/Uswift/dashboard/app/page.tsx",
  "owner": "typescript",
  "code": "2307",
  "severity": 8,
  "message": "Cannot find module '@/components/LandingHero' or its corresponding type declarations.",
  "source": "ts"
}
```

**TypeScript Error Code:** 2307
**Severity:** Error (8)
**Source:** VSCode TypeScript Server

## Root Cause

VSCode's TypeScript server was looking for `app/page.tsx` at the root level, but the actual home page was located at `app/(marketing)/home/page.tsx`. The Next.js configuration had a redirect from `/` to `/home`, but there was no actual page component at the root, causing VSCode to report module resolution errors.

### Why This Happens

1. **Next.js Routing Convention**: Next.js expects a `page.tsx` file in `app/` for the root route
2. **Missing Root Page**: The redirect was configured in `next.config.js` but no root page component existed
3. **VSCode TypeScript Confusion**: TypeScript server couldn't find the imports because it was checking a non-existent file
4. **Redirect vs. Component**: Server-side redirects don't satisfy TypeScript's static analysis

## The Fix

### Solution: Create Root Page with Client-Side Redirect

Create a root `page.tsx` that redirects to the home page using Next.js navigation.

### Step 1: Create Root Page Component

Create file: `dashboard/app/page.tsx`

```typescript
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

### Why This Works

1. **Satisfies Next.js Routing**: Provides a valid page component at the root
2. **Client-Side Redirect**: Uses Next.js router for smooth navigation
3. **TypeScript Happy**: File exists so no module resolution errors
4. **Works with next.config.js**: Complements the server-side redirect configuration

## Complete Solution

### File: `dashboard/app/page.tsx`

```typescript
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

### File: `dashboard/next.config.js` (Existing)

```javascript
module.exports = {
  // ... other config
  async redirects() {
    return [
      {
        source: "/",
        destination: "/home",
        permanent: true,
      },
    ];
  },
};
```

## Verification

### 1. TypeScript Type Check
```bash
cd dashboard
npm run type-check
```

**Expected output:**
```
> uswift-dashboard@0.1.0 type-check
> tsc --noEmit
```
(No errors)

### 2. Test Root Route
```bash
npm run dev
```

Test the root route:
```bash
curl -I http://localhost:3000/
```

**Expected output:**
```
HTTP/1.1 308 Permanent Redirect
Location: /home
```

### 3. Test Home Route
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/home
```

**Expected output:** `200`

### 4. VSCode Verification

Open VSCode and check:
- ✅ No red underlines in `app/page.tsx`
- ✅ No TypeScript errors in Problems panel
- ✅ IntelliSense works for Next.js imports
- ✅ All routes compile successfully

## Understanding the Routing Structure

### Next.js 15 App Router File Convention

```
app/
├── page.tsx                          ← Root route "/"
├── layout.tsx                        ← Root layout
├── (marketing)/                      ← Route group (doesn't affect URL)
│   ├── home/
│   │   └── page.tsx                 ← "/home" route
│   ├── features/
│   │   └── page.tsx                 ← "/features" route
│   └── pricing/
│       └── page.tsx                 ← "/pricing" route
└── dashboard/
    ├── page.tsx                      ← "/dashboard" route
    └── layout.tsx                    ← Dashboard layout
```

### Route Groups `(marketing)`

- Parentheses create a route group that doesn't affect the URL
- Useful for organizing files without changing routes
- `/home` is served from `app/(marketing)/home/page.tsx`, not `app/marketing/home/page.tsx`

## Alternative Solutions

### Option 1: Keep Homepage at Root (Not Used)

```typescript
// app/page.tsx
import LandingHero from "@/components/LandingHero";
import FeaturesSection from "@/components/FeaturesSection";
// ... other imports

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <FeaturesSection />
      {/* ... other components */}
    </>
  );
}
```

**Pros:** Direct rendering, no redirect
**Cons:** Doesn't match existing structure, breaks `/home` route

### Option 2: Server-Side Redirect Only (Doesn't Fix TypeScript)

```typescript
// app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/home");
}
```

**Issue:** TypeScript error: `Module '"next/navigation"' has no exported member 'redirect'`
**Note:** This is a Next.js 13+ feature but TypeScript definitions may not be complete

### Option 3: Client-Side Redirect (✅ Chosen Solution)

```typescript
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

**Pros:** Works with TypeScript, smooth navigation, complements server redirect
**Cons:** Slight flash before redirect (mitigated by server redirect in next.config.js)

## Common Pitfalls

### ❌ Wrong: Using redirect() without proper types

```typescript
import { redirect } from "next/navigation";  // TypeScript error

export default function RootPage() {
  redirect("/home");  // Error: redirect is not exported
}
```

### ❌ Wrong: No root page at all

```
app/
├── layout.tsx
├── (marketing)/
│   └── home/
│       └── page.tsx
```

Result: TypeScript errors, 404 on root route

### ✅ Correct: Root page with client redirect

```typescript
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

## Path Mapping Configuration

### File: `dashboard/tsconfig.json`

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

This configuration allows:
- `@/components/LandingHero` → `dashboard/components/LandingHero.tsx`
- `@/lib/contexts/AuthContext` → `dashboard/lib/contexts/AuthContext.tsx`

## Troubleshooting

### TypeScript Still Shows Errors

1. **Reload VSCode TypeScript Server:**
   - Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
   - Type "TypeScript: Restart TS Server"
   - Press Enter

2. **Clear TypeScript Cache:**
   ```bash
   cd dashboard
   rm -rf .next
   rm tsconfig.tsbuildinfo
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 404 Error on Root Route

1. **Check file exists:**
   ```bash
   ls dashboard/app/page.tsx
   ```

2. **Verify dev server is running:**
   ```bash
   npm run dev
   ```

3. **Check next.config.js redirects:**
   ```javascript
   async redirects() {
     return [
       {
         source: "/",
         destination: "/home",
         permanent: true,
       },
     ];
   }
   ```

### Module Resolution Errors

If you see `Cannot find module` errors for other files:

1. **Check tsconfig.json paths:**
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

2. **Verify component files exist:**
   ```bash
   ls dashboard/components/LandingHero.tsx
   ls dashboard/components/FeaturesSection.tsx
   ```

3. **Check imports use correct paths:**
   ```typescript
   // ✅ Correct
   import LandingHero from "@/components/LandingHero";

   // ❌ Wrong
   import LandingHero from "../components/LandingHero";
   import LandingHero from "components/LandingHero";
   ```

## Related Files

- `dashboard/app/page.tsx` - Root page with redirect
- `dashboard/app/(marketing)/home/page.tsx` - Actual home page
- `dashboard/next.config.js` - Server-side redirect configuration
- `dashboard/tsconfig.json` - TypeScript path mapping
- `dashboard/app/layout.tsx` - Root layout

## Performance Considerations

### Double Redirect?

The solution uses both:
1. **Server-side redirect** (next.config.js): Fast, SEO-friendly, 308 status
2. **Client-side redirect** (page.tsx): Fallback, smooth navigation

**Result:** Server redirect happens first, client redirect rarely executes.

### SEO Impact

- **308 Permanent Redirect:** Tells search engines the page has permanently moved
- **Client-Side Fallback:** Ensures browsers with JavaScript disabled still work
- **Canonical URL:** Use `/home` in sitemap and canonical tags

## Best Practices

1. **Always have a root page.tsx** in Next.js App Router
2. **Use route groups** `(folder)` for organization without affecting URLs
3. **Prefer server redirects** for SEO and performance
4. **Add client redirects** as fallback for better UX
5. **Test both TypeScript and runtime** after routing changes

## References

- [Next.js 15 Routing Documentation](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js Redirects](https://nextjs.org/docs/app/api-reference/next-config-js/redirects)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Next.js useRouter Hook](https://nextjs.org/docs/app/api-reference/functions/use-router)

---

**Fixed on:** 2025-10-13
**Next.js Version:** 15.5.2
**TypeScript Version:** 5.x
**Status:** ✅ Resolved
