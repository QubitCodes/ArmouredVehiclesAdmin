import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = ["/admin/login", "/admin/verify-email"];

// Protected routes that require authentication
const protectedRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is a public auth route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route is a protected admin route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route) && !isPublicRoute
  );

  // Get the access token from cookies
  const accessToken = request.cookies.get("access_token")?.value;

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/admin/login", request.url);
    // Preserve the intended destination for redirect after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page while authenticated, redirect to dashboard
  if (pathname === "/admin/login" && accessToken) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Other public routes are accessible to everyone (authenticated or not)
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

