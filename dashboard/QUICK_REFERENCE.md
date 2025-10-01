# 🚀 Uswift Dashboard - Quick Reference Guide

> **For Developers:** Fast lookup for common tasks and important information

---

## 🎨 Color System

### **Use These Colors:**

```jsx
// Primary colors (most common)
className="bg-uswift-primary"     // Blue (#3B82F6)
className="bg-uswift-secondary"   // Violet (#8B5CF6)
className="bg-uswift-accent"      // Cyan (#06B6D4)

// Dark backgrounds
className="bg-uswift-dark"        // Slate-800 (#1E293B)
className="bg-uswift-navy"        // Slate-900 (#0F172A)

// Gradients
className="bg-uswift-gradient"       // Blue → Violet → Cyan
className="bg-uswift-gradient-dark"  // Dark slate gradient
```

### **Text Colors:**

```jsx
className="text-uswift-primary"
className="text-uswift-accent"
className="hover:text-uswift-secondary"
```

---

## 🖼️ Images

### **Always Use Next.js Image Component:**

```jsx
import Image from 'next/image'

// For fixed size images (like avatars)
<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={48}
  height={48}
  className="rounded-full"
  loading="lazy"
  quality={75}
/>

// For responsive images
<div className="relative w-full h-64">
  <Image
    src="/path/to/image.jpg"
    alt="Description"
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
    className="object-cover"
  />
</div>
```

### **Image Optimization Rules:**

1. ✅ Always use `<Image>` from `next/image`
2. ✅ Set `loading="lazy"` for below-fold images
3. ✅ Use `quality={75}` for photos
4. ✅ Compress images before adding to project
5. ✅ Use WebP format when possible

---

## ⚡ Performance Best Practices

### **1. Lazy Load Heavy Components:**

```jsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false // If component doesn't need SSR
})
```

### **2. Use React.memo for Expensive Components:**

```jsx
const MyComponent = React.memo(function MyComponent(props) {
  // Component logic
})
```

### **3. Intersection Observer for Scroll-Based Loading:**

```jsx
const [isVisible, setIsVisible] = useState(false)
const ref = useRef(null)

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setIsVisible(true)
    }
  })

  if (ref.current) observer.observe(ref.current)
  return () => observer.disconnect()
}, [])
```

---

## 🔒 Authentication

### **Using AuthContext:**

```jsx
'use client'
import { useAuth } from '@/lib/contexts/AuthContext'

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {user ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={() => signIn(email, password)}>
          Sign In
        </button>
      )}
    </div>
  )
}
```

### **Auth Pages Structure:**

- **Sign In:** `/auth/signin`
- **Sign Up:** `/auth/signup`
- **Forgot Password:** `/auth/forgot-password`
- **Reset Password:** `/auth/reset-password`

---

## 📱 Responsive Design

### **Tailwind Breakpoints:**

```jsx
// Mobile first approach
className="
  text-sm           // Mobile (default)
  sm:text-base      // Tablet (640px+)
  md:text-lg        // Desktop (768px+)
  lg:text-xl        // Large desktop (1024px+)
"

// Common patterns
className="
  px-4 sm:px-6 md:px-8           // Horizontal padding
  py-2 sm:py-3 md:py-4           // Vertical padding
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  // Grid columns
  flex-col sm:flex-row           // Flex direction
"
```

---

## 🎭 Animations

### **Card Magic Effect:**

```jsx
<div className="card-magic">
  {/* Hover to lift and add shadow */}
</div>

<div className="card-magic card-magic--glow">
  {/* Hover for glow + lift effect */}
</div>
```

### **Data Attributes for GSAP/Scroll:**

```jsx
<section data-animate="reveal">
  {/* Auto-animates on scroll */}
</section>

<div data-parallax="0.5">
  {/* Parallax effect with 0.5 speed */}
</div>
```

---

## 🗂️ File Structure

```
dashboard/
├── app/
│   ├── (marketing)/       # Marketing pages (home, features, pricing)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── lib/                   # Utilities & contexts
│   ├── contexts/          # React contexts (AuthContext)
│   └── supabaseClient.ts  # Supabase setup
├── public/                # Static assets
├── styles/                # Global styles
│   ├── globals.css        # Main CSS
│   └── theme.css          # Color system & animations
└── data/                  # Static data (JSON files)
```

---

## 🔧 Common Tasks

### **Add a New Page:**

1. Create file in `app/` directory
2. Add to navigation in `components/ui/Navbar.tsx`
3. Use layout wrapper if needed

### **Add New Color:**

1. Add to `tailwind.config.js` colors
2. Add to `styles/theme.css` custom properties
3. Use in components via Tailwind classes

### **Optimize an Image:**

```bash
# Run compression script
node scripts/compress-images.js

# Or manually with sharp
npm install sharp
node -e "require('sharp')('input.jpg').resize(96).webp({quality: 80}).toFile('output.webp')"
```

### **Test Performance:**

```bash
# Build for production
npm run build

# Run local production server
npm start

# Run Lighthouse
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000
```

---

## ⚠️ Important Reminders

### **DO:**
- ✅ Use Next.js Image component
- ✅ Add alt text to all images
- ✅ Lazy load below-fold content
- ✅ Use semantic HTML
- ✅ Test on mobile first
- ✅ Compress images before committing
- ✅ Use TypeScript for type safety

### **DON'T:**
- ❌ Use `<img>` tags directly
- ❌ Load all data on initial render
- ❌ Forget mobile responsiveness
- ❌ Commit large images (>100KB)
- ❌ Skip accessibility attributes
- ❌ Use inline styles (use Tailwind)
- ❌ Bypass TypeScript with `any`

---

## 🐛 Troubleshooting

### **Images Not Loading:**
1. Check file exists in `public/` directory
2. Verify path starts with `/` (e.g., `/avatars/image.jpg`)
3. Check Next.js Image config in `next.config.js`
4. Clear `.next` cache: `rm -rf .next`

### **Styles Not Applying:**
1. Restart dev server
2. Check Tailwind config includes file path
3. Verify class names are correct (no typos)
4. Check CSS specificity issues

### **Performance Issues:**
1. Run production build, not dev mode
2. Check Network tab for large files
3. Use React DevTools Profiler
4. Review Lighthouse report

### **Auth Not Working:**
1. Check `.env.local` has Supabase keys
2. Verify AuthContext import path
3. Check if user is wrapped in AuthProvider
4. Review Supabase dashboard for errors

---

## 📚 Resources

**Documentation:**
- [CHANGELOG.md](./CHANGELOG.md) - Detailed change history
- [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) - Performance guide
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

**Tools:**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Vercel Analytics](https://vercel.com/analytics)

---

**Last Updated:** October 1, 2025
