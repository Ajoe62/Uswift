import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/auth/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const redirectTo = sanitizeRedirectPath(requestUrl.searchParams.get('redirectTo'));

  const buildSignInRedirect = () => {
    const signinUrl = new URL('/auth/signin', requestUrl.origin);
    if (redirectTo !== '/dashboard') {
      signinUrl.searchParams.set('redirectTo', redirectTo);
    }
    return signinUrl;
  };

  if (error) {
    const signinUrl = buildSignInRedirect();
    signinUrl.searchParams.set('error', error);
    if (errorDescription) {
      signinUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(signinUrl);
  }

  if (!code) {
    const signinUrl = buildSignInRedirect();
    signinUrl.searchParams.set('error', 'missing_auth_code');
    signinUrl.searchParams.set(
      'error_description',
      'OAuth callback was reached without a code parameter. Check Google/Supabase redirect configuration.'
    );
    return NextResponse.redirect(signinUrl);
  }

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error('Supabase auth code exchange failed', {
        message: exchangeError.message,
        status: (exchangeError as any).status,
        host: requestUrl.host,
        path: requestUrl.pathname,
      });

      const signinUrl = buildSignInRedirect();
      signinUrl.searchParams.set('error', 'auth_callback_failed');
      signinUrl.searchParams.set('error_description', exchangeError.message);
      return NextResponse.redirect(signinUrl);
    }
  } catch (err: any) {
    console.error('Unhandled auth callback error', {
      message: err?.message,
      stack: err?.stack,
    });

    const signinUrl = buildSignInRedirect();
    signinUrl.searchParams.set('error', 'auth_callback_exception');
    signinUrl.searchParams.set(
      'error_description',
      err?.message || 'Unexpected authentication callback error'
    );
    return NextResponse.redirect(signinUrl);
  }

  // Redirect to requested page after successful authentication
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
