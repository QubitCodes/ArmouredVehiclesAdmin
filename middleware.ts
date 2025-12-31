import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/admin/login",
  "/admin/verify-email",
  "/vendor/create-account",
  "/vendor/verify-email",
  "/vendor/add-phone",
  "/vendor/verify-phone",
  "/vendor/create-store",
  "/vendor/company-information",
  "/vendor/login",
  "/vendor/login/verify-email",
];

// Protected routes that require authentication
const protectedRoutes = ["/admin", "/vendor"];

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
    // Determine which login page to redirect to based on the route
    const isVendorRoute = pathname.startsWith("/vendor");
    const loginPath = isVendorRoute ? "/vendor/login" : "/admin/login";
    const loginUrl = new URL(loginPath, request.url);
    // Preserve the intended destination for redirect after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes are always accessible (authenticated or not)
  // No redirects for auth pages - users can access them regardless of auth status

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

