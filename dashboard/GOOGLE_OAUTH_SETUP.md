# Google OAuth Setup Guide

This guide explains how to enable Google OAuth authentication in your Uswift dashboard.

## Current Status

Google OAuth buttons are present in the sign-in and sign-up pages but will return the following error if clicked:

```json
{
  "code": 400,
  "error_code": "validation_failed",
  "msg": "Unsupported provider: provider is not enabled"
}
```

**Reason**: Google OAuth provider is not configured in Supabase.

## How to Enable Google OAuth

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External (for public apps) or Internal (for workspace-only)
   - App name: **Uswift**
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **Uswift Dashboard**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `https://yourdomain.com` (your production domain)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (for local)
     - `https://yourdomain.com/auth/callback` (for production)
     - **Important**: Also add your Supabase callback URL (see Step 2)

7. Click **Create** and save your **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your Uswift project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Enable the Google provider
6. Add your Google OAuth credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
7. Copy the **Callback URL** shown (format: `https://<project-ref>.supabase.co/auth/v1/callback`)
8. Go back to Google Cloud Console and add this callback URL to your OAuth 2.0 Client's **Authorized redirect URIs**
9. Click **Save** in Supabase

### Step 3: Test OAuth Flow

1. Start your development server:
   ```bash
   cd dashboard
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Click **"Continue with Google"**

4. You should be redirected to Google's OAuth consent screen

5. After approving, you'll be redirected back to `/dashboard`

### Step 4: Verify User in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. You should see your Google-authenticated user with:
   - Email from your Google account
   - Provider: `google`
   - User metadata including Google profile info

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI in your request doesn't match what's registered in Google Cloud Console.

**Solution**:
1. Check the exact callback URL in Supabase (**Authentication** → **Providers** → **Google**)
2. Add this exact URL to **Authorized redirect URIs** in Google Cloud Console
3. URLs must match exactly (including http/https, port numbers, and trailing slashes)

### Error: "Access blocked: Uswift has not completed the Google verification process"

**Problem**: Your OAuth consent screen is not verified by Google.

**Solution** (for development):
1. Add your email as a test user in Google Cloud Console:
   - **APIs & Services** → **OAuth consent screen**
   - Scroll to **Test users**
   - Click **Add Users** and add your email
2. For production, you'll need to submit your app for Google verification

### Error: "Unsupported provider: provider is not enabled" (Current Error)

**Problem**: Google provider is not enabled in Supabase.

**Solution**: Follow Steps 1-2 above to configure Google OAuth.

### Users Can't Sign In After OAuth

**Problem**: Users are authenticated but redirected incorrectly.

**Solution**: Check the `redirectTo` option in the OAuth call:
```typescript
// In app/auth/signin/page.tsx and app/auth/signup/page.tsx
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin + "/dashboard" },
});
```

## Code Implementation

The Google OAuth implementation is already in place:

### Sign In Page (`app/auth/signin/page.tsx`)
```typescript
async function handleGoogleSignIn() {
  setLoading(true);
  setMessage("");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/dashboard" },
  });
  if (error) {
    setMessage(error.message);
    setMessageType("error");
  }
  setLoading(false);
}
```

### Sign Up Page (`app/auth/signup/page.tsx`)
```typescript
async function handleGoogleSignUp() {
  setLoading(true);
  setMessage("");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/dashboard" },
  });
  if (error) {
    setMessage(error.message);
    setMessageType("error");
  }
  setLoading(false);
}
```

## Alternative: Disable Google OAuth (Temporary)

If you don't want to set up Google OAuth right now, you can temporarily remove the buttons:

1. Edit `dashboard/app/auth/signin/page.tsx`
2. Remove or comment out the Google Sign In button (lines 88-101)
3. Remove the divider (lines 103-110)
4. Repeat for `dashboard/app/auth/signup/page.tsx` (lines 81-94 and 96-103)

Users will only see email/password authentication.

## Production Checklist

Before deploying to production with Google OAuth:

- [ ] Google OAuth 2.0 Client created
- [ ] Production domain added to Authorized JavaScript origins
- [ ] Production callback URL added to Authorized redirect URIs
- [ ] Google provider enabled in Supabase
- [ ] Google OAuth credentials added to Supabase
- [ ] Tested OAuth flow on local development
- [ ] Tested OAuth flow on production domain
- [ ] OAuth consent screen configured (app name, logo, privacy policy, terms of service)
- [ ] Test users added (for unverified apps)
- [ ] or App submitted for Google verification (for public apps)

## Support

For more information:
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
