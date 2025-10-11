# Uswift Dashboard - Complete Color Scheme Guide

## 📊 Overview
This document provides a comprehensive breakdown of all colors used throughout the Uswift dashboard application, organized by page, component, and purpose.

---

## 🎨 Primary Color Palette

### Brand Colors (Tailwind Custom Configuration)

| Color Name | Hex Code | RGB | Purpose | Location |
|------------|----------|-----|---------|----------|
| **uswift-primary** | `#3B82F6` | `rgb(59, 130, 246)` | Main brand color (Blue-500) | Primary actions, links, highlights |
| **uswift-secondary** | `#8B5CF6` | `rgb(139, 92, 246)` | Secondary actions (Violet-500) | Secondary CTAs, accents |
| **uswift-accent** | `#06B6D4` | `rgb(6, 182, 212)` | Highlights & CTAs (Cyan-500) | Hover states, important highlights |
| **uswift-dark** | `#1E293B` | `rgb(30, 41, 59)` | Dark sections (Slate-800) | Dark backgrounds, footers |
| **uswift-navy** | `#0F172A` | `rgb(15, 23, 42)` | Darkest backgrounds (Slate-900) | Sidebar, dark mode backgrounds |

### Legacy Colors (Being Phased Out)
- **uswiftBlue**: `#3B82F6` (same as uswift-primary)
- **uswiftNavy**: `#0F172A` (same as uswift-navy)
- **uswiftPurple**: `#8B5CF6` (same as uswift-secondary)

### Gradients

#### Main Gradient
```css
background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%);
```
- **Start**: Blue (`#3B82F6`)
- **Middle**: Violet (`#8B5CF6`)
- **End**: Cyan (`#06B6D4`)
- **Usage**: Navbar, hero sections, primary CTAs

#### Dark Gradient
```css
background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
```
- **Start**: Slate-800 (`#1E293B`)
- **End**: Slate-900 (`#0F172A`)
- **Usage**: Dark section backgrounds

#### Legacy Gradient (globals.css)
```css
background: linear-gradient(90deg, #1cb5e0 0%, #000851 100%);
```
- **Start**: Cyan (`#1CB5E0`)
- **End**: Navy (`#000851`)
- **Usage**: Old gradient, likely unused

---

## 🏠 Page-by-Page Color Breakdown

### 1. Landing Page (`/`)

#### Hero Section (`LandingHero.tsx`)
- **Background**: `bg-gray-900` (`#111827`)
- **Text**: `text-white` (`#FFFFFF`)
- **Heading Gradient**: 
  - `bg-gradient-to-b from-white to-gray-400`
  - `bg-clip-text text-transparent`
- **Decorative Grid**: `bg-grid-white/[0.07]` (7% opacity white grid)
- **Trust Badge Background**: `bg-white/6` (6% opacity white)
- **Star Icon**: `text-yellow-400` (`#FACC15`)
- **Secondary Text**: `text-gray-300` (`#D1D5DB`)

#### Features Section (`FeaturesSection.tsx`)
- **Container**: White/transparent background
- **Cards**: `bg-white`, `shadow`, `border-gray-100`
- **Icons**: Primary brand colors (blue, violet, cyan)
- **Text**: 
  - Headings: `text-gray-900` (`#111827`)
  - Body: `text-gray-600` (`#4B5563`)

#### How It Works (`HowItWorks.tsx`)
- **Background**: Light gray or white
- **Step Cards**: `bg-white` with shadow
- **Step Numbers**: Gradient background (brand colors)
- **Text**: Dark gray for readability

#### Trust Stats (`TrustStats.tsx`)
- **Main Background**: `bg-transparent text-white`
- **Inner Container**: `bg-gray-900/60 backdrop-blur-sm` (60% opacity gray-900 with blur)
- **Stat Cards**: `bg-white/6` (6% opacity white)
- **Text Colors**:
  - Headings: `text-white` (`#FFFFFF`)
  - Stats: `text-xl sm:text-2xl font-bold` white
  - Labels: `text-xs text-gray-300` (`#D1D5DB`)
  - Secondary: `text-gray-400` (`#9CA3AF`)
- **CTA Button**: `bg-uswift-navy` with hover `bg-uswift-navy/90`
- **Rating Button**: `bg-white/6` hover `bg-white/10`

#### Testimonials (`Testimonials.tsx`)
- **Cards**: `bg-white rounded-lg shadow`
- **Border**: `border-gray-100` (`#F3F4F6`)
- **Loading State**: `bg-gray-200` (`#E5E7EB`)
- **Quote Text**: `text-gray-700` (`#374151`)
- **Author**: `text-gray-900` (`#111827`)
- **Role**: `text-gray-500` (`#6B7280`)

#### Footer (`ModernShowcaseAndFooter.tsx`)
- **Background**: `bg-gray-900` (`#111827`)
- **Text**: `text-gray-300` (`#D1D5DB`)
- **Links**: `text-gray-400` hover `text-white`
- **Dividers**: `border-gray-800` (`#1F2937`)

---

### 2. Authentication Pages

#### Sign Up (`/auth/signup`)
- **Page Background**: `bg-gray-50` (`#F9FAFB`)
- **Card Background**: `bg-white`
- **Form Border**: `border-gray-300` (`#D1D5DB`)
- **Input Focus**: `focus:border-blue-500 focus:ring-blue-500`
- **Primary Button**: 
  - Background: `bg-gradient-to-r from-blue-600 to-purple-600`
  - Hover: `hover:from-blue-700 hover:to-purple-700`
  - Text: `text-white`
- **Google Button**: 
  - Background: `bg-white`
  - Border: `border-gray-300`
  - Hover: `hover:bg-gray-50`
  - Text: `text-gray-700`
- **Google Logo Colors** (SVG):
  - Blue: `#4285F4`
  - Green: `#34A853`
  - Yellow: `#FBBC05`
  - Red: `#EA4335`
- **Links**: `text-blue-600` hover `text-blue-700`

#### Sign In (`/auth/signin`)
- **Same color scheme as Sign Up page**
- Consistent form styling and button colors

#### Password Reset (`/auth/reset-password`)
- **Same color scheme as Sign Up/Sign In**

---

### 3. Dashboard Pages

#### Dashboard Home (`/dashboard`)

**Welcome Header**:
- **Background**: `bg-gradient-to-r from-blue-600 to-purple-600`
- **Shadow**: `shadow-xl`
- **Text**: `text-white`
- **Avatar Background**: `bg-white/20 backdrop-blur-sm`
- **Avatar Border**: `border-2 border-white/30`
- **Subtitle**: `text-blue-100` (`#DBEAFE`)

**Stats Cards** (`DashboardStats.tsx`):
- **Card Background**: `bg-white`
- **Shadow**: `shadow-lg`
- **Border**: `rounded-xl`
- **Stat Values**: `text-3xl font-bold text-gray-900`
- **Stat Labels**: `text-sm text-gray-600`
- **Icon Backgrounds**:
  - Applied: `bg-blue-100` (`#DBEAFE`)
  - Interviewing: `bg-purple-100` (`#F3E8FF`)
  - Offers: `bg-green-100` (`#DCFCE7`)
  - Rejected: `bg-red-100` (`#FEE2E2`)
- **Icon Colors**:
  - Applied: `text-blue-600` (`#2563EB`)
  - Interviewing: `text-purple-600` (`#9333EA`)
  - Offers: `text-green-600` (`#16A34A`)
  - Rejected: `text-red-600` (`#DC2626`)

**Quick Actions**:
- **Button Background**: `bg-gradient-to-r from-blue-600 to-purple-600`
- **Hover**: `hover:from-blue-700 hover:to-purple-700`
- **Text**: `text-white`
- **Secondary Actions**: `bg-gray-100` hover `bg-gray-200`

**Recent Activity**:
- **Card**: `bg-white rounded-xl shadow-lg`
- **Items**: `border-b border-gray-100`
- **Status Badges**:
  - Applied: `bg-blue-100 text-blue-800`
  - Interviewing: `bg-purple-100 text-purple-800`
  - Offer: `bg-green-100 text-green-800`
  - Rejected: `bg-red-100 text-red-800`

#### Jobs Page (`/dashboard/jobs`)
- **Page Background**: `bg-gray-50`
- **Search Bar**: `bg-white border-gray-300`
- **Job Cards**: 
  - Background: `bg-white`
  - Border: `border-gray-200`
  - Hover: `hover:shadow-lg`
- **Status Pills**:
  - New: `bg-blue-100 text-blue-800`
  - Saved: `bg-yellow-100 text-yellow-800`
  - Applied: `bg-green-100 text-green-800`

#### Profile Page (`/dashboard/profile`)
- **Background**: `bg-gray-50`
- **Profile Card**: `bg-white shadow-xl rounded-2xl`
- **Avatar**: `bg-gradient-to-r from-blue-600 to-purple-600`
- **Edit Button**: `bg-blue-600 hover:bg-blue-700 text-white`
- **Form Inputs**: 
  - Border: `border-gray-300`
  - Focus: `focus:border-blue-500 focus:ring-blue-500`

#### Settings Page (`/dashboard/settings`)
- **Background**: `bg-gray-50`
- **Sections**: `bg-white shadow rounded-lg`
- **Toggle Switches**: `bg-gray-200` (off), `bg-blue-600` (on)
- **Danger Zone**: `bg-red-50 border-red-200`

---

### 4. Marketing Pages

#### Features Page (`/(marketing)/features`)
- **Hero**: Gradient background similar to landing
- **Feature Cards**: `bg-white shadow-lg`
- **Icons**: Primary brand colors
- **Accent Lines**: `border-blue-500`

#### Pricing Page (`/(marketing)/pricing`)

**Pricing Cards** (`PricingTable.tsx`):
- **Free Tier**:
  - Background: `bg-white`
  - Border: `border-gray-200`
  - Button: `bg-gray-800 text-white`
- **Pro Tier** (Highlighted):
  - Background: `bg-gradient-to-br from-blue-500 to-purple-600`
  - Text: `text-white`
  - Border: `border-blue-400 shadow-2xl`
  - Button: `bg-white text-blue-600`
- **Enterprise Tier**:
  - Background: `bg-gray-900`
  - Text: `text-white`
  - Button: `bg-gradient-to-r from-blue-500 to-purple-600`

**FAQ Section**:
- **Questions**: `text-gray-900`
- **Answers**: `text-gray-600`
- **Borders**: `border-gray-200`
- **Arrow Indicator**: `text-uswift-accent` (Cyan)

---

## 🧩 Component-Specific Colors

### Navbar (`components/ui/Navbar.tsx`)
- **Background**: `bg-uswift-gradient` (full brand gradient)
- **Text**: `text-white`
- **Logo Area**: Transparent
- **Links**: 
  - Default: `text-white`
  - Hover: `hover:text-uswift-accent` (Cyan `#06B6D4`)
- **Mobile Menu**: 
  - Background: `bg-uswift-gradient`
  - Shadow: `shadow-lg`
- **Sign Out Button**: `text-white hover:text-uswift-accent`

### Sidebar (`components/ui/Sidebar.tsx`)
- **Background**: `bg-uswift-navy` (`#0F172A`)
- **Text**: `text-white`
- **Links**: 
  - Default: `text-white`
  - Hover: `hover:text-uswift-blue` (`#3B82F6`)

### Modal (`components/ui/Modal.tsx`)
- **Overlay**: `bg-black bg-opacity-50`
- **Modal Background**: `bg-white`
- **Border**: `border-b` (for header)
- **Close Button**: 
  - Default: `text-gray-400`
  - Hover: `hover:text-gray-600`
- **Title**: `text-gray-900`

### Buttons (`components/ui/CTAButton.tsx`, etc.)

**Primary CTA**:
```css
background: linear-gradient(135deg, #3B82F6, #8B5CF6, #06B6D4)
color: white
hover: brightness(110%)
```

**Secondary Button**:
- Background: `bg-gray-100`
- Text: `text-gray-900`
- Hover: `hover:bg-gray-200`

**Danger Button**:
- Background: `bg-red-600`
- Text: `text-white`
- Hover: `hover:bg-red-700`

### Input Fields (`components/ui/Input.tsx`)
- **Border**: `border-uswift-blue` (`#3B82F6`)
- **Background**: `bg-white`
- **Text**: `text-gray-900`
- **Placeholder**: `placeholder-gray-400`
- **Focus Ring**: `focus:ring-uswift-blue`

### Cards (`components/ui/Card.tsx`)
- **Background**: `bg-white`
- **Text**: `text-black`
- **Shadow**: `shadow` (default Tailwind)
- **Border Radius**: `rounded-lg`
- **Magic Effect**: Custom glow animation (subtle)

---

## 🌈 Semantic Color Usage

### Status Colors

| Status | Background | Text | Border | Use Case |
|--------|-----------|------|--------|----------|
| **Success** | `bg-green-100` | `text-green-800` | `border-green-200` | Offers, completed actions |
| **Warning** | `bg-yellow-100` | `text-yellow-800` | `border-yellow-200` | Pending, saved items |
| **Error** | `bg-red-100` | `text-red-800` | `border-red-200` | Rejections, errors |
| **Info** | `bg-blue-100` | `text-blue-800` | `border-blue-200` | Applied, general info |
| **Processing** | `bg-purple-100` | `text-purple-800` | `border-purple-200` | Interviewing, in progress |

### Interactive States

| State | Color | Example |
|-------|-------|---------|
| **Default** | `text-gray-900` | Normal text |
| **Hover** | `text-uswift-accent` | Link hover (`#06B6D4`) |
| **Active** | `bg-blue-600` | Selected item |
| **Disabled** | `text-gray-400` | Disabled button |
| **Focus** | `ring-blue-500` | Input focus ring |

---

## 📐 Grayscale System

### White to Black Scale
- **White**: `#FFFFFF` - `bg-white`, `text-white`
- **Gray-50**: `#F9FAFB` - `bg-gray-50` (lightest backgrounds)
- **Gray-100**: `#F3F4F6` - `bg-gray-100` (borders, subtle backgrounds)
- **Gray-200**: `#E5E7EB` - `bg-gray-200` (borders)
- **Gray-300**: `#D1D5DB` - `border-gray-300` (input borders)
- **Gray-400**: `#9CA3AF` - `text-gray-400` (placeholder text)
- **Gray-500**: `#6B7280` - `text-gray-500` (secondary text)
- **Gray-600**: `#4B5563` - `text-gray-600` (body text)
- **Gray-700**: `#374151` - `text-gray-700` (strong text)
- **Gray-800**: `#1F2937` - `bg-gray-800` (dark sections)
- **Gray-900**: `#111827` - `bg-gray-900` (darkest backgrounds)
- **Black**: `#000000` - Rarely used (modal overlays at opacity)

---

## 🎭 Special Effects & Overlays

### Glassmorphism
- **Background**: `bg-white/6` or `bg-gray-900/60`
- **Backdrop**: `backdrop-blur-sm`
- **Usage**: Trust stats, stat cards, overlays

### Gradient Text
```css
bg-gradient-to-b from-white to-gray-400
bg-clip-text text-transparent
```
**Usage**: Hero headlines, special titles

### Grid Overlay
```css
bg-grid-white/[0.07]
[mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]
```
**Usage**: Hero section decorative background

### Shadows
- **sm**: `shadow-sm` - Subtle lift
- **md**: `shadow` - Standard card shadow
- **lg**: `shadow-lg` - Prominent cards
- **xl**: `shadow-xl` - Hero sections, modals
- **2xl**: `shadow-2xl` - Highlighted pricing card

---

## 📱 Responsive Color Considerations

### Mobile (< 640px)
- Higher contrast for readability
- Larger touch targets with clear visual feedback
- Simplified gradients for performance

### Tablet (640px - 1024px)
- Balanced contrast
- Intermediate sizing
- Full gradient effects

### Desktop (> 1024px)
- Full color palette
- Complex gradients and effects
- Subtle hover states

---

## ♿ Accessibility Notes

### WCAG 2.1 Compliance
- **Text on white backgrounds**: Use `text-gray-900` or darker for AAA contrast
- **Text on dark backgrounds**: Use `text-white` or `text-gray-100`
- **Links**: Minimum 4.5:1 contrast ratio
- **Buttons**: Clear focus states with `focus:ring`

### Color Blindness Considerations
- Don't rely solely on color for status (use icons + text)
- Status colors have distinct brightness levels
- Important actions have multiple visual cues

---

## 🔄 Color Migration Plan

### Current State
- Mix of custom colors and Tailwind defaults
- Some legacy gradient in `globals.css`
- Inconsistent use of `uswiftBlue` vs `uswift-primary`

### Recommended Changes
1. ✅ **Phase out legacy colors**:
   - Replace `uswiftBlue` with `uswift-primary`
   - Replace `uswiftNavy` with `uswift-navy`
   - Replace `uswiftPurple` with `uswift-secondary`

2. ✅ **Standardize gradients**:
   - Remove old gradient from `globals.css`
   - Use `bg-uswift-gradient` everywhere

3. ✅ **Consolidate status colors**:
   - Create custom status color scale in `tailwind.config.js`
   - Use consistent naming: `status-success`, `status-warning`, etc.

4. ✅ **Document all custom colors**:
   - Add comments in `tailwind.config.js`
   - Create visual color swatch page in dashboard

---

## 🎨 Quick Reference: Common Color Combinations

### Hero Sections
```tsx
<div className="bg-gray-900 text-white">
  <h1 className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
  <p className="text-gray-300">
</div>
```

### Cards
```tsx
<div className="bg-white shadow-lg rounded-xl border border-gray-100">
  <h3 className="text-gray-900">
  <p className="text-gray-600">
</div>
```

### Buttons
```tsx
// Primary
<button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">

// Secondary
<button className="bg-gray-100 text-gray-900 hover:bg-gray-200">

// Danger
<button className="bg-red-600 text-white hover:bg-red-700">
```

### Status Badges
```tsx
<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
<span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
<span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
```

---

## 🔗 Related Files
- `tailwind.config.js` - Color definitions
- `styles/globals.css` - Global styles and gradients
- `components/ui/CTAButton.tsx` - Button styles
- `app/layout.tsx` - Root layout with global styling

---

**Last Updated**: October 11, 2025  
**Maintained By**: Uswift Development Team  
**Version**: 1.0
