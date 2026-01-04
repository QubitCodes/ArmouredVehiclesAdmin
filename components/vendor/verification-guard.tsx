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

    // If there's an error (e.g., 401), let the API interceptor handle redirect to login
    // We don't want to redirect here as it might conflict with auth flow
    if (error) {
      const axiosError = error as AxiosError;
      // If it's a 401, the API interceptor will handle redirect to login
      if (axiosError.response?.status === 401) {
        return;
      }
      // For other errors, allow the page to render and show error
      return;
    }

    // Only check verification if we have user data
    if (!data?.user) return;

    // Skip check if we're on an allowed route (auth or onboarding)
    const isOnAllowedRoute = ALLOWED_ROUTES.some((route) =>
      pathname?.startsWith(route)
    );
    if (isOnAllowedRoute) return;

    const { emailVerified, phoneVerified } = data.user;

    // Priority 1: Check email verification first
    if (!emailVerified) {
      router.push("/vendor/verify-email");
      return;
    }

    // Priority 2: Check phone verification
    if (!phoneVerified) {
      // Check if user has a phone number - if not, redirect to add phone
      // If they have a phone but haven't verified, redirect to verify phone
      if (!data.user.phone) {
        router.push("/vendor/add-phone");
      } else {
        router.push("/vendor/verify-phone");
      }
      return;
    }

    // Priority 3: Only check onboarding if email and phone are verified
    
    // Don't check if onboarding data is still loading
    if (isOnboardingLoading) return;

    // If there's an onboarding error, allow access (don't block on API errors)
    if (onboardingError) {
      return;
    }

    // Check onboarding status
    if (onboardingProgress) {
      // If onboarding is pending or in_progress, redirect to the appropriate step
      if (onboardingProgress.status === "pending" || onboardingProgress.status === "in_progress") {
        const targetRoute =
          ONBOARDING_STEP_ROUTES[onboardingProgress.currentStep] ||
          ONBOARDING_STEP_ROUTES[0]; // Default to step 0 if invalid

        // Only redirect if not already on the target route
        if (pathname !== targetRoute) {
          router.push(targetRoute);
        }
        return;
      }
      // If onboarding is completed or in other statuses (pending_verification, under_review, approved, rejected, suspended), allow access to protected routes
    }
  }, [
    data,
    isLoading,
    error,
    pathname,
    router,
    onboardingProgress,
    isOnboardingLoading,
    onboardingError,
  ]);

  // Show loading state while checking verification
  if (isLoading || (isEmailPhoneVerified && isOnboardingLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}

