"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { GlobalHeader } from "@/components/global-header";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { Spinner } from "@/components/ui/spinner";

export default function VendorOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: profileData, isLoading } = useOnboardingProfile();

  useEffect(() => {
    // If onboarding is complete (null), redirect to dashboard
    if (!isLoading && profileData) {
      const step = profileData.user?.onboardingStep;
      if (step === null) {
        router.push("/vendor");
      }
    }
  }, [profileData, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-medium">
        <Spinner size="lg" className="text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
