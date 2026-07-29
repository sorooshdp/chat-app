import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Verify token with backend
 */
async function verifyTokenWithBackend(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env["NEXT_PUBLIC_API_URL"]}/api/auth/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}

/**
 * Middleware to protect routes that require authentication
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard"];
  const authRoutes = ["/login", "/signup"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isValid = await verifyTokenWithBackend(token);
    if (!isValid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthRoute && token) {
    const isValid = await verifyTokenWithBackend(token);
    if (isValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Configure which routes should run the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
