# OAuth Troubleshooting (Vercel + Supabase + Google)

This guide is for `dashboard` Google OAuth failures, especially:

- `404: NOT_FOUND` on `https://uswift-dashboard.vercel.app/auth/callback`
- `Unsupported provider: provider is not enabled`
- `redirect_uri_mismatch`

## Quick Checks

1. Open `https://uswift-dashboard.vercel.app/auth/debug`
2. Open `http://localhost:3000/auth/debug`
3. Open `https://uswift-dashboard.vercel.app/auth/callback`
4. Run local checker:
   - `cd dashboard`
   - `npm run verify:oauth`

If `/auth/callback` shows a Vercel platform 404 page, the issue is deployment/domain routing, not your app route code.

## Required Google Cloud OAuth Configuration

### Authorized JavaScript origins

- `http://localhost:3000`
- `https://uswift-dashboard.vercel.app`

### Authorized redirect URIs

- `http://localhost:3000/auth/callback`
- `https://uswift-dashboard.vercel.app/auth/callback`
- `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

## Required Supabase Configuration

### Authentication -> Providers -> Google

- Enable Google provider
- Paste Google Cloud `Client ID`
- Paste Google Cloud `Client Secret` (rotated/current)

### Authentication -> URL Configuration

- `Site URL`: `https://uswift-dashboard.vercel.app`
- Redirect allowlist includes:
  - `http://localhost:3000/auth/callback`
  - `https://uswift-dashboard.vercel.app/auth/callback`

## Required Vercel Project Configuration

- Root Directory: `dashboard`
- Framework Preset: `Next.js`
- Output Directory: leave blank/default (do not set for Next.js App Router)
- Environment variables present in Production:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

After changing env vars in Vercel, redeploy production.

## Common Symptoms

### `404: NOT_FOUND` on `/auth/callback`

Likely causes:
- Wrong Vercel project root or framework preset
- Wrong deployment/domain alias attached
- Stale deployment serving old output

Fix:
- Re-check Vercel project settings
- Confirm latest production build logs include `/auth/callback`
- Redeploy production
- Re-attach domain alias if needed

### `Unsupported provider: provider is not enabled`

Likely cause:
- Google provider disabled in Supabase or credentials missing

Fix:
- Enable Google in Supabase Providers
- Save current Google Cloud client ID/secret

### `redirect_uri_mismatch`

Likely cause:
- Missing one of the exact callback URLs in Google Cloud

Fix:
- Add all local + production + Supabase callback URLs exactly

## Security Note

Do not store Google OAuth client secrets in client-side environment variables (`NEXT_PUBLIC_*`).
For this flow, store Google credentials in Supabase Google provider settings.

