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
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route) && !isPublicRoute
  );

  // Get the access tokens from cookies (separate for admin and vendor)
  const adminToken = request.cookies.get("admin_access_token")?.value;
  const vendorToken = request.cookies.get("vendor_access_token")?.value;

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute) {
    const isVendorRoute = pathname.startsWith("/vendor");
    const isAdminRoute = pathname.startsWith("/admin");
    const hasToken = isVendorRoute
      ? vendorToken
      : isAdminRoute
      ? adminToken
      : false;

    if (!hasToken) {
      const loginPath = isVendorRoute ? "/vendor/login" : "/admin/login";
      const loginUrl = new URL(loginPath, request.url);
      // Preserve the intended destination for redirect after login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If accessing vendor login page while authenticated, redirect to vendor dashboard
  if (pathname === "/vendor/login" && vendorToken) {
    return NextResponse.redirect(new URL("/vendor", request.url));
  }

  // If accessing admin login page while authenticated, redirect to admin dashboard
  if (pathname === "/admin/login" && adminToken) {
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
