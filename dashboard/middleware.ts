import { NextRequest, NextResponse } from "next/server";

function hasSupabaseAuthCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export async function middleware(req: NextRequest) {
  const isAuthenticated = hasSupabaseAuthCookie(req);

  // Protected routes
  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/auth/signin", "/auth/signup"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to signin if not authenticated
    const redirectUrl = new URL("/auth/signin", req.url);
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    // Redirect to dashboard if already authenticated
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
