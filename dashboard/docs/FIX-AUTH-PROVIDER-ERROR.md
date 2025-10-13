# Fix: useAuth must be used within an AuthProvider

## Error Description

```
Error: useAuth must be used within an AuthProvider
    at useAuth (lib\contexts\AuthContext.tsx:85:11)
    at Navbar (components\ui\Navbar.tsx:10:36)
```

**Status Code:** 500 (Internal Server Error)

## Root Cause

The `Navbar` component was using the `useAuth()` hook, but the application wasn't wrapped with the `AuthProvider` context provider. In Next.js 15 with the App Router, the root layout must explicitly wrap children with any context providers.

### Why This Happens

1. **Next.js 15 App Router**: Server Components are the default, and context providers are Client Components
2. **Missing Provider Wrapper**: The root layout didn't include the `AuthProvider` wrapper
3. **Hook Usage Outside Context**: Components using `useAuth()` were rendered before the provider was initialized

## The Fix

### Step 1: Import AuthProvider in Root Layout

Edit `dashboard/app/layout.tsx`:

```typescript
import { AuthProvider } from "../lib/contexts/AuthContext";
```

### Step 2: Wrap Children with AuthProvider

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon16.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white min-h-screen">
        <AuthProvider>  {/* ← Added this wrapper */}
          <Navbar />
          <main className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4">
            {children}
          </main>
          <footer className="mt-12 p-6 sm:p-8 text-center bg-gray-50 text-gray-600 border-t border-gray-200">
            <p className="text-sm">© {new Date().getFullYear()} Uswift. All rights reserved.</p>
          </footer>
        </AuthProvider>  {/* ← Close wrapper */}
      </body>
    </html>
  );
}
```

## Complete Solution

### File: `dashboard/app/layout.tsx`

```typescript
import "../styles/globals.css";
import "../styles/uswift-accent-fallback.css";
import { AuthProvider } from "../lib/contexts/AuthContext";
import Navbar from "../components/ui/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon16.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4">
            {children}
          </main>
          <footer className="mt-12 p-6 sm:p-8 text-center bg-gray-50 text-gray-600 border-t border-gray-200">
            <p className="text-sm">© {new Date().getFullYear()} Uswift. All rights reserved.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Verification

### 1. Type Check
```bash
cd dashboard
npm run type-check
```

Expected output: No errors

### 2. Dev Server Test
```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- ✅ Homepage loads without errors
- ✅ Navbar renders correctly
- ✅ No "useAuth must be used within an AuthProvider" error
- ✅ Status code: 200 OK (not 500)

### 3. Test Authentication Flow
```bash
# Test routes that use auth
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/home
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/features
```

All should return `200` or `308` (redirect).

## Understanding the AuthContext

### File: `dashboard/lib/contexts/AuthContext.tsx`

The AuthContext provides:
- `user`: Current user object from Supabase
- `session`: Current session object
- `loading`: Boolean indicating auth state loading
- `signIn`: Function to sign in with email/password
- `signUp`: Function to create new account
- `signOut`: Function to sign out

### Usage in Components

```typescript
"use client";

import { useAuth } from "@/lib/contexts/AuthContext";

export default function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <a href="/auth/signin">Sign In</a>
      )}
    </div>
  );
}
```

## Common Pitfalls

### ❌ Wrong: Provider Not Wrapping Component
```typescript
// layout.tsx
<body>
  <Navbar />  {/* ← Uses useAuth() but no provider! */}
  <AuthProvider>
    {children}
  </AuthProvider>
</body>
```

### ✅ Correct: Provider Wraps All Components
```typescript
// layout.tsx
<body>
  <AuthProvider>
    <Navbar />  {/* ← Now has access to auth context */}
    {children}
  </AuthProvider>
</body>
```

## Related Files

- `dashboard/lib/contexts/AuthContext.tsx` - Context provider definition
- `dashboard/components/ui/Navbar.tsx` - Component using useAuth
- `dashboard/app/layout.tsx` - Root layout with provider
- `dashboard/lib/supabaseClient.ts` - Supabase client configuration

## Additional Notes

### Server vs Client Components in Next.js 15

- **Server Components** (default): Cannot use React hooks or context
- **Client Components** (`"use client"`): Can use hooks and context
- **AuthProvider** is a Client Component because it uses `useContext` and `useEffect`
- **Root Layout** is a Server Component but can render Client Components as children

### Why This Pattern Works

1. Root layout (Server Component) renders the HTML structure
2. AuthProvider (Client Component) handles authentication state
3. Child components can use `useAuth()` hook to access auth state
4. Next.js handles hydration and state synchronization

## Troubleshooting

### Error Persists After Fix

1. **Clear Next.js cache:**
   ```bash
   cd dashboard
   rm -rf .next
   npm run dev
   ```

2. **Restart dev server:**
   ```bash
   # Kill existing processes
   taskkill /F /IM node.exe  # Windows
   # or
   killall node  # Mac/Linux

   # Restart
   npm run dev
   ```

3. **Check import paths:**
   - Verify `@/lib/contexts/AuthContext` resolves correctly
   - Check `tsconfig.json` has proper path mapping

### TypeScript Errors

If you see TypeScript errors about missing types:
```bash
npm install --save-dev @types/react @types/node
```

## Prevention

To prevent this error in future:

1. **Always wrap context-using components** with their providers in the layout
2. **Test authentication flow** after any layout changes
3. **Use TypeScript** to catch missing context providers at compile time
4. **Follow Next.js 15 patterns** for Server/Client component composition

## References

- [Next.js 15 App Router Documentation](https://nextjs.org/docs/app)
- [React Context API](https://react.dev/reference/react/useContext)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**Fixed on:** 2025-10-13
**Next.js Version:** 15.5.2
**Status:** ✅ Resolved
