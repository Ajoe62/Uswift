# Uswift Dashboard Documentation

Comprehensive documentation and troubleshooting guides for the Uswift Dashboard application.

## 📚 Documentation Overview

This directory contains detailed guides for common errors, fixes, and troubleshooting procedures encountered during development and deployment.

## 🚀 Quick Start

New to the project? Start here:

1. **[Main Project Guide](../CLAUDE.md)** - Complete project overview and setup
2. **[Troubleshooting Guide](./TROUBLESHOOTING-GUIDE.md)** - Quick reference for common issues
3. **[Job Management](../JOB_MANAGEMENT_README.md)** - Database schema and job tracking setup

## 📖 Error Fix Guides

Detailed documentation for specific errors and their complete solutions:

### 1. Authentication Error
**File:** [FIX-AUTH-PROVIDER-ERROR.md](./FIX-AUTH-PROVIDER-ERROR.md)

**Error:** `useAuth must be used within an AuthProvider`

**Quick Fix:**
```typescript
// dashboard/app/layout.tsx
import { AuthProvider } from "../lib/contexts/AuthContext";

<AuthProvider>
  {/* Your app components */}
</AuthProvider>
```

**Covers:**
- Root cause analysis
- Step-by-step fix
- Next.js 15 context patterns
- Server vs Client components
- Verification steps

---

### 2. TypeScript Module Error
**File:** [FIX-TYPESCRIPT-MODULE-ERROR.md](./FIX-TYPESCRIPT-MODULE-ERROR.md)

**Error:** `Cannot find module '@/components/LandingHero'`

**Quick Fix:**
```typescript
// Create dashboard/app/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => router.replace("/home"), [router]);
  return null;
}
```

**Covers:**
- Next.js App Router conventions
- Route groups and page structure
- TypeScript path mapping
- Client-side vs server-side redirects
- Alternative solutions

---

### 3. CSS Vendor Prefix Warning
**File:** [FIX-CSS-VENDOR-PREFIX-WARNING.md](./FIX-CSS-VENDOR-PREFIX-WARNING.md)

**Warning:** `Also define the standard property 'mask' for compatibility`

**Quick Fix:**
```css
/* dashboard/styles/globals.css */
-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
-webkit-mask-composite: xor;
mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
mask-composite: exclude;
```

**Covers:**
- CSS vendor prefix best practices
- Browser compatibility
- Standard vs prefixed properties
- Visual effects explanation
- Autoprefixer configuration

---

## 🔧 Master Troubleshooting Guide

**File:** [TROUBLESHOOTING-GUIDE.md](./TROUBLESHOOTING-GUIDE.md)

Comprehensive guide covering:

### Quick Reference
- Most common errors and fixes
- Emergency commands
- Issue resolution matrix

### Categories
1. **Authentication Errors**
   - AuthProvider issues
   - Supabase client initialization
   - Session management

2. **TypeScript / Module Resolution**
   - Module not found errors
   - Path mapping issues
   - Type definition problems

3. **CSS / Styling**
   - Vendor prefix warnings
   - Tailwind not working
   - Hydration mismatches

4. **Build & Compilation**
   - Build failures
   - Memory issues
   - Module resolution in production

5. **Runtime Errors**
   - Hydration errors
   - API route 404s
   - Client-side errors

6. **Development Server**
   - Port conflicts
   - Hot reload issues
   - Performance problems

7. **Merge Conflicts**
   - Conflict resolution strategy
   - Testing after merge
   - Common patterns

8. **General Debugging**
   - Console debugging
   - TypeScript debugging
   - Next.js debugging

---

## 🎯 Use Cases

### "My dev server won't start"
→ [Development Server Issues](./TROUBLESHOOTING-GUIDE.md#development-server-issues)

### "TypeScript is showing errors but code works"
→ [TypeScript Module Error Guide](./FIX-TYPESCRIPT-MODULE-ERROR.md)

### "Authentication isn't working"
→ [AuthProvider Error Guide](./FIX-AUTH-PROVIDER-ERROR.md)

### "CSS warnings in VSCode"
→ [CSS Vendor Prefix Guide](./FIX-CSS-VENDOR-PREFIX-WARNING.md)

### "Build fails with errors"
→ [Build & Compilation](./TROUBLESHOOTING-GUIDE.md#build--compilation-errors)

### "Merge conflicts after git pull"
→ [Merge Conflict Resolution](./TROUBLESHOOTING-GUIDE.md#merge-conflict-resolution)

---

## 📋 Document Structure

Each error fix guide follows this structure:

1. **Error Description**
   - Full error message
   - Error code and severity
   - Context

2. **Root Cause**
   - Why this happens
   - Technical explanation
   - Related concepts

3. **The Fix**
   - Step-by-step solution
   - Code examples
   - Complete working solution

4. **Verification**
   - How to test the fix
   - Expected outcomes
   - Command examples

5. **Understanding the Solution**
   - Technical deep-dive
   - Best practices
   - Related patterns

6. **Common Pitfalls**
   - What not to do
   - Wrong approaches
   - Correct alternatives

7. **Troubleshooting**
   - What if fix doesn't work
   - Alternative solutions
   - Advanced debugging

8. **Prevention**
   - How to avoid in future
   - Code review checklist
   - Automation tips

9. **References**
   - Official documentation
   - Related resources
   - Community links

---

## 🛠️ Quick Commands Reference

### Development
```bash
npm run dev              # Start dev server
npm run dev:turbo        # Start with Turbo
npm run type-check       # TypeScript validation
npm run lint             # ESLint
```

### Building
```bash
npm run build            # Production build
npm run start            # Start production
```

### Cleaning
```bash
rm -rf .next                    # Clear Next.js cache
rm -rf node_modules             # Remove dependencies
rm tsconfig.tsbuildinfo         # Clear TS cache
```

### Debugging
```bash
npm run build -- --debug        # Verbose build
DEBUG=* npm run dev             # Debug mode
```

### Process Management
```bash
# Windows
taskkill /F /IM node.exe
netstat -ano | findstr :3000

# Mac/Linux
killall node
lsof -i :3000
```

---

## 📊 Error Severity Levels

| Level | Severity | Action Required | Example |
|-------|----------|-----------------|---------|
| 🔴 **Error** | Blocks development | Fix immediately | AuthProvider error, TS2307 |
| 🟡 **Warning** | Should fix | Fix before production | Vendor prefix warning |
| 🔵 **Info** | Optional improvement | Fix when convenient | Unused variables |

---

## 🔍 Finding the Right Guide

### By Error Code
- **TS2307** → [TypeScript Module Error](./FIX-TYPESCRIPT-MODULE-ERROR.md)
- **vendorPrefix** → [CSS Vendor Prefix](./FIX-CSS-VENDOR-PREFIX-WARNING.md)
- **500 Status** → [AuthProvider Error](./FIX-AUTH-PROVIDER-ERROR.md)

### By Error Message
- "useAuth must be used" → [AuthProvider Error](./FIX-AUTH-PROVIDER-ERROR.md)
- "Cannot find module" → [TypeScript Module Error](./FIX-TYPESCRIPT-MODULE-ERROR.md)
- "define standard property" → [CSS Vendor Prefix](./FIX-CSS-VENDOR-PREFIX-WARNING.md)

### By File
- `app/layout.tsx` → [AuthProvider Error](./FIX-AUTH-PROVIDER-ERROR.md)
- `app/page.tsx` → [TypeScript Module Error](./FIX-TYPESCRIPT-MODULE-ERROR.md)
- `styles/globals.css` → [CSS Vendor Prefix](./FIX-CSS-VENDOR-PREFIX-WARNING.md)

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Follow the structure** used in existing guides
2. **Include code examples** with syntax highlighting
3. **Add verification steps** to confirm fix works
4. **Link related documentation**
5. **Update this README** with new guide links

### Documentation Template

```markdown
# Fix: [Error Title]

## Error Description
[Full error with context]

## Root Cause
[Why this happens]

## The Fix
[Step-by-step solution]

## Verification
[How to test]

## Understanding the Solution
[Technical explanation]

## Common Pitfalls
[What to avoid]

## Troubleshooting
[If fix doesn't work]

## Prevention
[How to avoid in future]

## References
[Links to resources]
```

---

## 🔗 Related Documentation

### Project Documentation
- **[CLAUDE.md](../CLAUDE.md)** - Main project guide
- **[Job Management](../JOB_MANAGEMENT_README.md)** - Database setup
- **[Extension Guide](../../extension/AUTO_APPLY_GUIDE.md)** - Chrome extension

### External Resources
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

## 📞 Getting Help

### In This Repository
1. Check [Troubleshooting Guide](./TROUBLESHOOTING-GUIDE.md)
2. Search error-specific guides
3. Review [CLAUDE.md](../CLAUDE.md) for project context

### External Help
- Next.js Discord
- Supabase Discord
- Stack Overflow (tags: nextjs, supabase, react)
- GitHub Issues

---

## 📈 Document History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-13 | 1.0.0 | Initial documentation created |
|  |  | - AuthProvider error guide |
|  |  | - TypeScript module error guide |
|  |  | - CSS vendor prefix guide |
|  |  | - Master troubleshooting guide |

---

## ✅ Checklist for Common Issues

Before asking for help, have you:

- [ ] Read the [Troubleshooting Guide](./TROUBLESHOOTING-GUIDE.md)?
- [ ] Cleared Next.js cache (`rm -rf .next`)?
- [ ] Restarted the dev server?
- [ ] Run `npm run type-check`?
- [ ] Checked environment variables?
- [ ] Reviewed error-specific guide?
- [ ] Searched existing documentation?
- [ ] Killed and restarted node processes?

---

**Last Updated:** 2025-10-13
**Dashboard Version:** Next.js 15.5.2
**Documentation Status:** ✅ Complete

---

**Quick Links:**
- [Troubleshooting Guide](./TROUBLESHOOTING-GUIDE.md)
- [AuthProvider Fix](./FIX-AUTH-PROVIDER-ERROR.md)
- [TypeScript Fix](./FIX-TYPESCRIPT-MODULE-ERROR.md)
- [CSS Fix](./FIX-CSS-VENDOR-PREFIX-WARNING.md)
