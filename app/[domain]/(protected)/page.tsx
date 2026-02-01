"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  Users, Store, ShoppingCart, Package, UserCheck, AlertCircle,
  DollarSign, OctagonAlert, Clock, Shield, ShieldAlert, UserPlus, Loader, LucideIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useDashboard } from "@/hooks/admin/dashboard/use-dashboard";
import { useParams, useRouter } from "next/navigation";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { DashboardWidget } from "@/services/admin/dashboard.service";

/**
 * Icon Name to Lucide Component Mapping
 */
const iconMap: Record<string, LucideIcon> = {
  DollarSign, ShoppingCart, Users, Package, AlertCircle, Store,
  UserCheck, Clock, Shield, ShieldAlert, UserPlus, Loader,
};

/**
 * Theme Name to Tailwind Classes Mapping
 */
const themeMap: Record<string, { text: string; bg: string }> = {
  emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  orange: { text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/20" },
  blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20" },
  purple: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20" },
  red: { text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20" },
  green: { text: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20" },
  amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20" },
  yellow: { text: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
  indigo: { text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
};

export default function AdminDashboard() {
  const params = useParams();
  const domain = (params?.domain as string) || "admin";

  const { data: stats, isLoading: isStatsLoading, error } = useDashboard();

  // Check onboarding status for vendors
  const { data: profileData, isLoading: isProfileLoading } = useOnboardingProfile();
  const onboardingStatus = profileData?.profile?.onboarding_status;
  const isRestricted = domain === "vendor" && (onboardingStatus === 'pending_verification' || onboardingStatus === 'rejected' || onboardingStatus === 'update_needed');

  useEffect(() => {
    if (error) {
      console.error("Error fetching dashboard stats:", error);
      if (!isRestricted) {
        toast.error("Failed to fetch dashboard statistics");
      }
    }
  }, [error, isRestricted]);

  const isLoading = isStatsLoading || (domain === "vendor" && isProfileLoading);
  const router = useRouter(); // Currently unused but needed for redirection
  const onboardingStep = profileData?.user?.onboardingStep;

  // Sticky redirection for vendors
  useEffect(() => {
    if (domain === "vendor" && !isProfileLoading && profileData) {
      // If step is not null, force redirect to that step
      if (onboardingStep !== null && onboardingStep !== undefined) {
        const stepMap: Record<number, string> = {
          0: "create-store",
          1: "company-information",
          2: "contact-person",
          3: "declaration",
          4: "account-preferences",
          5: "bank-account",
          6: "verification",
        };
        const stepPath = stepMap[onboardingStep];
        if (stepPath) {
          router.push(`/vendor/${stepPath}`);
        }
      }
    }
  }, [domain, isProfileLoading, profileData, onboardingStep, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Widgets from API (SDUI)
  const widgets: DashboardWidget[] = stats?.items || [];

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome to ArmoredMart {domain === 'vendor' ? 'Vendor' : 'Admin'} Panel
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {isRestricted ? (
          <div className="col-span-full">
            {onboardingStatus === 'rejected' ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                <div className="flex items-center gap-3 text-destructive">
                  <OctagonAlert className="h-6 w-6" />
                  <h3 className="font-semibold text-lg">Application Rejected</h3>
                </div>
                <p className="mt-2 text-sm text-destructive/90">
                  {profileData?.profile?.rejection_reason || "Your vendor application has been rejected. Please contact support."}
                </p>
              </div>
            ) : onboardingStatus === 'update_needed' ? (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-6">
                <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
                  <AlertCircle className="h-6 w-6" />
                  <h3 className="font-semibold text-lg">Update Required</h3>
                </div>
                <p className="mt-2 text-sm text-yellow-600/90 dark:text-yellow-500/90">
                  {profileData?.profile?.rejection_reason || "Your application requires updates. Please check your email or profile for details."}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-6">
                <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
                  <Clock className="h-6 w-6" />
                  <h3 className="font-semibold text-lg">Verification Pending</h3>
                </div>
                <p className="mt-2 text-sm text-yellow-600/90 dark:text-yellow-500/90">
                  Your account is pending verification.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {widgets.map((widget, index) => {
              const Icon = iconMap[widget.icon] || Package;
              const theme = themeMap[widget.theme] || themeMap.blue;
              return (
                <Card key={index} className="overflow-hidden gap-2 border-border/40 hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {widget.title}
                    </CardTitle>
                    <div className={`${theme.bg} p-2 rounded-md`}>
                      <Icon className={`h-4 w-4 ${theme.text}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{widget.value}</div>
                    {widget.subValue && (
                      <p className="text-xs text-muted-foreground mt-1">{widget.subValue}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
