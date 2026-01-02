"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { Spinner } from "@/components/ui/spinner";
import { AxiosError } from "axios";

/**
 * Client component that checks vendor verification status and redirects if needed
 * This should wrap protected vendor routes to ensure email/phone verification
 */
export function VerificationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, error } = useOnboardingProfile();

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

    const verificationPages = [
      "/vendor/verify-email",
      "/vendor/add-phone",
      "/vendor/verify-phone",
      "/vendor/create-store",
      "/vendor/company-information",
    ];

    // Skip check if we're on a verification/onboarding page
    const isOnVerificationPage = verificationPages.some((page) =>
      pathname?.startsWith(page)
    );
    if (isOnVerificationPage) return;

    const { emailVerified, phoneVerified } = data.user;

    // Check email verification first
    if (!emailVerified) {
      router.push("/vendor/verify-email");
      return;
    }

    // Check phone verification
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
  }, [data, isLoading, error, pathname, router]);

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

