# Layout Router Error Diagnosis

## Error
`invariant expected layout router to be mounted`

## Root Cause
This error occurs when Next.js App Router cannot properly mount nested layouts. This typically happens when:

1. **Missing layout.tsx in route groups** - Route groups like `(marketing)` that contain pages need their own `layout.tsx`
2. **Nested route structure conflicts** - Pages nested too deeply without proper layouts at each level
3. **Client component wrapping issues** - `"use client"` pages inside route groups without layouts

## Files Currently Causing the Issue

### PRIMARY SUSPECTS:

1. **`dashboard/app/(marketing)/features/page.tsx`** (Line 1-17)
   - Located in route group `(marketing)`
   - Route group has NO `layout.tsx` file
   - **FIX**: Add `dashboard/app/(marketing)/layout.tsx` OR move pages out of route group

2. **`dashboard/app/(marketing)/pricing/page.tsx`**
   - Same issue as features page
   - In `(marketing)` route group without a layout

3. **`dashboard/app/auth/signin/page.tsx`** (Line 1-216)
   - Uses `"use client"` directive
   - Located in `/auth` folder with NO `layout.tsx`
   - **FIX**: Add `dashboard/app/auth/layout.tsx` OR ensure root layout handles it

4. **`dashboard/app/auth/signup/page.tsx`**
5. **`dashboard/app/auth/forgot-password/page.tsx`**
6. **`dashboard/app/auth/reset-password/page.tsx`**
   - All auth pages have same issue

## Current Layout Structure

```
dashboard/app/
├── layout.tsx ✓ (Root layout - EXISTS)
├── page.tsx ✓ (Root page - EXISTS)
├── (marketing)/
│   ├── layout.tsx ✗ (MISSING - CAUSES ERROR)
│   ├── features/page.tsx
│   └── pricing/page.tsx
├── auth/
│   ├── layout.tsx ✗ (MISSING - CAUSES ERROR)
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
└── dashboard/
    ├── layout.tsx ✓ (EXISTS)
    └── page.tsx ✓ (EXISTS)
```

## Solutions (Choose One)

### Option 1: Add Missing Layouts (RECOMMENDED)
Create layout files for route groups that need them.

### Option 2: Remove Route Groups
Move pages out of `(marketing)` folder to app root level.

### Option 3: Flatten Structure
Remove nested folders and put all pages at same level.

## How to Debug
1. Check browser console for the EXACT route causing error
2. Look at the URL in browser when error appears
3. The route that fails will point to which folder needs a layout

## Next Steps
Tell me which page/URL shows the error so I can fix that specific route.
