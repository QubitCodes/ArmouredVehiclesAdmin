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
        {profileData?.profile?.onboarding_status === 'rejected' && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-4">
            <div className="container mx-auto flex gap-3 text-destructive">
              <div className="font-semibold">Application Rejected:</div>
              <div>{profileData.profile.rejection_reason || "Your application was rejected."}</div>
            </div>
          </div>
        )}
        {profileData?.profile?.onboarding_status === 'update_needed' && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
            <div className="container mx-auto flex gap-3 text-yellow-700 dark:text-yellow-500">
              <div className="font-semibold">Update Required:</div>
              <div>{profileData.profile.rejection_reason || "Please update your application details."}</div>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
