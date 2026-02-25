import { NextResponse } from "next/server";
import { deriveSupabaseCallbackUrl } from "@/lib/auth/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasEnv(name: string): boolean {
  return Boolean(process.env[name] && process.env[name]?.trim());
}

function safeHost(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const diagnostics = {
    timestamp: new Date().toISOString(),
    request: {
      origin: url.origin,
      host: url.host,
      path: url.pathname,
      inferredCallbackUrl: `${url.origin}/auth/callback`,
    },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: hasEnv("NEXT_PUBLIC_SUPABASE_URL"),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      SUPABASE_SERVICE_ROLE_KEY: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
    },
    supabase: {
      projectUrlHost: safeHost(supabaseUrl),
      derivedProviderCallbackUrl: deriveSupabaseCallbackUrl(supabaseUrl),
    },
    oauthRequiredAllowlist: {
      googleJavaScriptOrigins: ["http://localhost:3000", "https://uswift-dashboard.vercel.app"],
      googleRedirectUris: [
        "http://localhost:3000/auth/callback",
        "https://uswift-dashboard.vercel.app/auth/callback",
        deriveSupabaseCallbackUrl(supabaseUrl),
      ].filter(Boolean),
      supabaseRedirectUrls: [
        "http://localhost:3000/auth/callback",
        "https://uswift-dashboard.vercel.app/auth/callback",
      ],
    },
    warnings: [] as string[],
  };

  if (!diagnostics.env.NEXT_PUBLIC_SUPABASE_URL) {
    diagnostics.warnings.push("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!diagnostics.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    diagnostics.warnings.push("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!diagnostics.supabase.derivedProviderCallbackUrl) {
    diagnostics.warnings.push("NEXT_PUBLIC_SUPABASE_URL is invalid; cannot derive Supabase provider callback URL");
  }

  return NextResponse.json(diagnostics, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

