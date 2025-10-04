# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Uswift is a Chrome extension-based job application automation platform with multiple components:
- **Chrome Extension**: Auto-apply to jobs on 25+ job boards with AI-powered features
- **Dashboard (Next.js)**: Web dashboard for managing applications, profile, and stats
- **Payment Backend**: Express.js backend handling Stripe payments and entitlements
- **Payment Webapp**: React frontend for payment flows

This is a **monorepo** with workspaces for dashboard and extension.

## Architecture

### Monorepo Structure
```
/
├── dashboard/          # Next.js 15 App Router dashboard
├── extension/          # Chrome extension (Vite + React)
├── payment-backend/    # Express.js payment API
├── payment-webapp/     # React payment UI
└── package.json        # Root workspace config
```

### Key Technologies
- **Dashboard**: Next.js 15, React 19, Tailwind CSS 4, Supabase (auth + DB)
- **Extension**: React 18, Vite, TypeScript, Chrome APIs, Mistral AI
- **Payment Backend**: Express, TypeScript, Stripe, PostgreSQL, JWT
- **Shared**: TypeScript across all projects

### Authentication & Data Flow
- **Supabase** handles auth for both dashboard and extension
- Dashboard uses `@supabase/auth-helpers-nextjs` with middleware for protected routes
- Extension uses custom `SupabaseClient` class (extension/src/supabase.js) that works with Chrome storage
- Payment backend uses JWT tokens for API authentication
- Row-Level Security (RLS) ensures users only see their own data

### Extension Architecture
The extension has three main entry points:
- **popup.html**: Main UI with tabs (Job Tracker, Chat, Resume, Cover Letter, Interview Prep, Auto-Apply)
- **content.ts**: Injected into job board pages for auto-apply functionality
- **background.ts**: Service worker for Chrome extension APIs

Auto-apply workflow:
1. Page analysis and platform detection (98%+ accuracy for 25+ job boards)
2. Form readiness check with smart timing
3. Parallel field filling with validation
4. File upload (resume/cover letter)
5. Smart submission and verification

## Common Development Commands

### Dashboard (Next.js)
```bash
cd dashboard
npm run dev              # Start dev server (Next.js default)
npm run dev:turbo        # Start dev server with Turbo
npm run dev:fast         # Dev with 8GB memory allocation
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript check without emit
npm run clean            # Remove .next directory
```

### Extension (Chrome)
```bash
cd extension
npm run dev              # Vite dev server
npm run build            # Development build
npm run build:prod       # Production build (NODE_ENV=production)
npm run watch            # Watch mode for development
npm run type-check       # TypeScript validation
npm run clean            # Clean dist directory
npm run package          # Build and create production package
npm run package:dev      # Build and create dev package
```

**Loading extension in Chrome:**
1. `npm run build` (in extension/)
2. Chrome → chrome://extensions/
3. Enable "Developer mode"
4. "Load unpacked" → Select `extension/dist/`

### Payment Backend
```bash
cd payment-backend
npm run dev              # Development with nodemon
npm run build            # Compile TypeScript
npm run start            # Run production build
npm run test             # Run Jest tests
npm run test:watch       # Jest watch mode
npm run migrate          # Run database migrations
npm run seed             # Seed database
npm run lint             # ESLint
stripe listen --forward-to localhost:3000/webhooks/stripe  # Stripe webhook testing
```

**Docker deployment:**
```bash
cd payment-backend
docker-compose up        # Start all services (API, PostgreSQL, Redis, Nginx)
```

### Payment Webapp
```bash
cd payment-webapp
npm run dev              # Vite dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint
```

### Root Level
```bash
npm run build            # Build dashboard (cd dashboard && npm ci && npm run build)
npm run start            # Start dashboard production server
```

## Environment Variables

### Dashboard (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Extension (via Vite or src/config.js)
```bash
# Option 1: .env in extension/
VITE_MISTRAL_API_KEY=your_mistral_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_API_URL=payment_backend_url

# Option 2: Hardcode in extension/src/config.js
# Edit mistral.apiKey and supabase config directly
```

### Payment Backend (.env)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/uswift_payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your_jwt_secret
EXTENSION_TOKEN_SECRET=your_extension_token_secret
APP_DOMAIN=https://pay.uswift.app
```

## Database Setup

### Supabase (Dashboard + Extension)
1. Create Supabase project
2. Run `dashboard/database/schema.sql` in Supabase SQL Editor
3. (Optional) Run `dashboard/database/sample_data.sql` for test data
4. RLS policies are included in schema - users see only their own job applications

### PostgreSQL (Payment Backend)
1. Run `payment-backend/migrations/001_initial_schema.sql`
2. (Optional) Run `payment-backend/migrations/seed.sql`
3. Or use Docker Compose which auto-runs migrations

## Key Files & Patterns

### Dashboard Route Protection
- `dashboard/middleware.ts`: Protects `/dashboard/*` routes, redirects unauthenticated users to `/auth/signin`
- Uses Supabase auth helpers with session management

### Extension Content Scripts
- `extension/src/content.ts`: Main content script for job board automation
- Platform detection logic handles 25+ job boards (Greenhouse, Lever, LinkedIn, Indeed, etc.)
- Test with `testJobBoard()` in browser console on any job page

### Payment Gateway Pattern
- `payment-backend/src/gateways/PaymentGateway.ts`: Abstract interface
- Concrete implementations: StripeGateway, PayPalGateway, BraintreeGateway, AdyenGateway
- Factory pattern in `PaymentGatewayFactory.register()`

### API Routes
Dashboard API routes (`dashboard/app/api/`):
- `/api/jobs` - CRUD for job applications
- `/api/dashboard/stats` - User statistics
- `/api/mistral/chat` - AI chat proxy
- `/api/mistral/embeddings` - AI embeddings

Payment Backend routes (`payment-backend/src/routes/`):
- `/api/checkout` - Create checkout sessions
- `/api/entitlements` - Check user entitlements
- `/api/admin` - Admin operations
- `/webhooks/stripe` - Stripe webhook handler

## Important Notes

### Extension Permissions
The extension requires broad permissions for auto-apply functionality. Content scripts must inject into job board pages. User grants "On all sites" permission for full functionality.

### Mistral AI Integration
- Extension uses Mistral AI for chat, resume enhancement, cover letter generation
- API key must be configured in `extension/src/config.js` or environment variables
- Dashboard proxies Mistral API calls through Next.js API routes

### Tailwind CSS Version
Dashboard uses **Tailwind CSS v4** (newer PostCSS plugin syntax). Check `dashboard/postcss.config.js` - uses `@tailwindcss/postcss` instead of traditional Tailwind v3 setup.

### Next.js App Router
Dashboard uses Next.js 15 with App Router (`app/` directory). All pages are Server Components by default. Use `"use client"` directive for client components.

### Chrome Extension Manifest V3
Extension uses Manifest V3. Service workers (background.ts) have limitations. Content scripts use message passing to communicate with popup.

### Payment Security
Payment backend is **PCI SAQ A compliant** - never handles raw card data. All payment forms use Stripe Checkout (hosted). Webhook signature verification is critical for security.

### Job Application Management
See `dashboard/JOB_MANAGEMENT_README.md` for complete setup guide. Database schema in `dashboard/database/schema.sql` includes RLS policies.

### Auto-Apply Troubleshooting
See `extension/AUTO_APPLY_GUIDE.md` for comprehensive guide. Key diagnostic commands:
- `checkUSwiftHealth()` - Extension health check
- `testJobBoard()` - Platform detection test

## Development Workflow

### Working on Dashboard Features
1. Ensure Supabase credentials in `.env.local`
2. `cd dashboard && npm run dev`
3. Protected routes require authentication
4. API routes are in `app/api/`
5. Use `npm run type-check` before committing

### Working on Extension Features
1. Configure Mistral API key in `src/config.js`
2. `npm run build` after changes
3. Reload extension in chrome://extensions/
4. Test on supported job boards (LinkedIn, Indeed, Greenhouse, etc.)
5. Check browser console for errors

### Working on Payment Backend
1. Set up `.env` with Stripe keys
2. `npm run dev` for hot reload
3. Use `stripe listen` for webhook testing
4. Run tests with `npm run test`
5. Docker Compose for full stack testing

### Working Across Multiple Components
This is a monorepo but workspaces are independent. Changes to dashboard don't affect extension and vice versa. Shared types/interfaces should be kept in sync manually.

## Testing Extension Auto-Apply
1. Complete profile in extension popup (name, email, phone, resume)
2. Navigate to a job application page (try LinkedIn Easy Apply or Greenhouse)
3. Open browser console and run: `testJobBoard()` to verify detection
4. Click "Auto-Apply" in extension popup
5. Monitor console for detailed logs

## Common Issues

### Dashboard Build Errors
- **"Module not found"**: Run `npm install` in dashboard directory
- **Supabase errors**: Check `.env.local` variables
- **Type errors**: Run `npm run type-check` to identify issues

### Extension Not Working
- **"Content script ping failed"**: Reload extension in chrome://extensions/
- **"Unsupported job board"**: Run `testJobBoard()` to check confidence level
- **AI chat errors**: Verify Mistral API key in `src/config.js`

### Payment Backend Issues
- **Database connection failed**: Check DATABASE_URL in .env
- **Webhook errors**: Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- **CORS errors**: Check corsOrigins in config

## Branch Strategy
Current branch: `backend-implement`
Main branch: Not set (use main branch for PRs)
