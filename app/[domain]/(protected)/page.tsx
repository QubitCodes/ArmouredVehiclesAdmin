"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Users, Store, ShoppingCart, Package, UserCheck, AlertCircle, DollarSign, RefreshCw, OctagonAlert, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useDashboard } from "@/hooks/admin/dashboard/use-dashboard";
import { useParams } from "next/navigation";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";

export default function AdminDashboard() {
  const params = useParams();
  const domain = (params?.domain as string) || "admin";

  const {
    data: stats,
    isLoading: isStatsLoading,
    error,
  } = useDashboard();

  // Check onboarding status for vendors
  const { data: profileData, isLoading: isProfileLoading } = useOnboardingProfile();
  const onboardingStatus = profileData?.profile?.onboarding_status;
  const isRestricted = domain === "vendor" && (onboardingStatus === 'pending_verification' || onboardingStatus === 'rejected');

  useEffect(() => {
    if (error) {
      console.error("Error fetching dashboard stats:", error);
      // Only show error toast if not restricted (restricted users won't see stats anyway)
      if (!isRestricted) {
        toast.error("Failed to fetch dashboard statistics");
      }
    }
  }, [error, isRestricted]);

  const isLoading = isStatsLoading || (domain === "vendor" && isProfileLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Sellers",
      value: stats?.totalSellers ?? 0,
      icon: Store,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Active Sellers",
      value: stats?.activeSellers ?? 0,
      icon: UserCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: AlertCircle,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      title: "Total Revenue",
      value: `AED ${typeof stats?.totalRevenue === 'number'
        ? stats.totalRevenue.toFixed(2)
        : parseFloat(String(stats?.totalRevenue || '0')).toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      title: "Total Refunds",
      value: stats?.totalRefunds ?? 0,
      icon: RefreshCw,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
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
                  Your vendor application has been rejected. Please contact support for more information regarding your application status.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-6">
                <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
                  <Clock className="h-6 w-6" />
                  <h3 className="font-semibold text-lg">Verification Pending</h3>
                </div>
                <p className="mt-2 text-sm text-yellow-600/90 dark:text-yellow-500/90">
                  Your account is currently pending verification. Our team is reviewing your documents. You will be notified once the review is complete.
                  Access to the dashboard is restricted until approval.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="overflow-hidden gap-2 border-border/40 hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
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


