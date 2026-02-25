export const DEFAULT_POST_AUTH_REDIRECT = "/dashboard";

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getPublicAppOrigin(fallbackOrigin?: string | null): string | null {
  // Prefer an explicit canonical URL so auth callbacks do not follow preview hosts.
  const configuredOrigin =
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);

  if (configuredOrigin) return configuredOrigin;
  return normalizeOrigin(fallbackOrigin);
}

export function sanitizeRedirectPath(
  redirectTo: string | null | undefined,
  fallback = DEFAULT_POST_AUTH_REDIRECT
): string {
  if (!redirectTo) return fallback;
  if (!redirectTo.startsWith("/")) return fallback;
  if (redirectTo.startsWith("//")) return fallback;
  return redirectTo;
}

export function buildOAuthCallbackUrl(origin: string, redirectTo?: string | null): string {
  const resolvedOrigin = getPublicAppOrigin(origin) ?? origin;
  const callbackUrl = new URL("/auth/callback", resolvedOrigin);
  const safeRedirect = sanitizeRedirectPath(redirectTo);
  if (safeRedirect !== DEFAULT_POST_AUTH_REDIRECT) {
    callbackUrl.searchParams.set("redirectTo", safeRedirect);
  }
  return callbackUrl.toString();
}

export function deriveSupabaseCallbackUrl(supabaseUrl?: string | null): string | null {
  if (!supabaseUrl) return null;
  try {
    const url = new URL(supabaseUrl);
    return `${url.origin}/auth/v1/callback`;
  } catch {
    return null;
  }
}
