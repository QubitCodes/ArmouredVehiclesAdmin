"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { useOnboardingProgress } from "@/hooks/vendor/dashboard/use-onboarding-progress";
import { Spinner } from "@/components/ui/spinner";
import { AxiosError } from "axios";

/**
 * Step mapping for onboarding routes
 */
const ONBOARDING_STEP_ROUTES: Record<number, string> = {
  0: "/vendor/create-store",
  1: "/vendor/company-information",
  2: "/vendor/contact-person",
  3: "/vendor/declaration",
  4: "/vendor/account-preferences",
  5: "/vendor/bank-account",
  6: "/vendor/verification",
};

/**
 * All onboarding and auth routes that should be accessible
 */
const ALLOWED_ROUTES = [
  "/vendor/verify-email",
  "/vendor/add-phone",
  "/vendor/verify-phone",
  "/vendor/create-store",
  "/vendor/company-information",
  "/vendor/contact-person",
  "/vendor/declaration",
  "/vendor/account-preferences",
  "/vendor/bank-account",
  "/vendor/verification",
  "/vendor/login",
  "/vendor/create-account",
  "/vendor/login/verify-email",
];

/**
 * Client component that checks vendor verification status and redirects if needed
 * Priority order: Email → Phone → Onboarding
 * This should wrap protected vendor routes to ensure email/phone verification and onboarding completion
 */
export function VerificationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, error } = useOnboardingProfile();

  // Only fetch onboarding progress if email and phone are verified
  const isEmailPhoneVerified =
    data?.user?.emailVerified && data?.user?.phoneVerified;
  const {
    data: onboardingProgress,
    isLoading: isOnboardingLoading,
    error: onboardingError,
  } = useOnboardingProgress(isEmailPhoneVerified && !!data?.user);

  useEffect(() => {
    // Don't redirect if data is still loading
    if (isLoading) return;

    // If there's an error (e.g., 401), allow navigation 
    // or let the API interceptor handle it
    if (error) return;

    // Only check verification if we have user data
    if (!data?.user) return;

    // Skip check if we're on an allowed route (auth or onboarding)
    const normalizedPath = pathname?.replace(/\/$/, "");
    const isOnAllowedRoute = ALLOWED_ROUTES.some((route) =>
      normalizedPath?.startsWith(route)
    );
    if (isOnAllowedRoute) return;

    const { emailVerified, phoneVerified, onboardingStep } = data.user;

    // Priority 1: Check email verification first
    if (!emailVerified) {
      if (pathname !== "/vendor/verify-email") {
        router.push("/vendor/verify-email");
      }
      return;
    }

    // Priority 2: Check phone verification
    if (!phoneVerified) {
      if (!data.user.phone) {
        if (pathname !== "/vendor/add-phone") {
          router.push("/vendor/add-phone");
        }
      } else {
        if (pathname !== "/vendor/verify-phone") {
          router.push("/vendor/verify-phone");
        }
      }
      return;
    }

    // Priority 3: Check onboarding step
    if (onboardingStep !== null && onboardingStep !== undefined) {
      const targetRoute = ONBOARDING_STEP_ROUTES[onboardingStep] || ONBOARDING_STEP_ROUTES[0];

      if (pathname !== targetRoute) {
        router.push(targetRoute);
      }
      return;
    }

    // If onboarding is complete (null), but we are on an onboarding route, redirect to dashboard
    const isOnOnboardingStepRoute = Object.values(ONBOARDING_STEP_ROUTES).some(
      (route) => pathname === route
    );
    if (isOnOnboardingStepRoute && pathname !== "/vendor") {
      router.push("/vendor");
      return;
    }

  }, [
    data,
    isLoading,
    error,
    pathname,
    router,
  ]);

  // Show loading state while checking verification
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}

