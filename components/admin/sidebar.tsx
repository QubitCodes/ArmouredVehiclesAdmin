"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useParams } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, ShoppingCart, LogOut, Tag, Database, CreditCard, Monitor, Wallet } from "lucide-react";
import { jwtDecode } from "jwt-decode";

import { cn } from "@/lib/utils";
import { authService } from "@/services/admin/auth.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { vendorAuthService } from "@/services/vendor/auth.service";

import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";

// Navigation moved inside component for state access

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const domain = (params?.domain as string) || (pathname?.startsWith("/vendor") ? "vendor" : "admin");

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);

  // Check onboarding status for vendors
  const { data: profileData } = useOnboardingProfile(domain === 'vendor');
  const onboardingStatus = profileData?.profile?.onboarding_status;

  useEffect(() => {
    // Select auth service based on domain
    const currentAuthService = domain === "vendor" ? vendorAuthService : authService;

    // Get user details from auth service
    const user = currentAuthService.getUserDetails();
    if (user) {
      setUserDetails(user);
      if (user.userType) {
        setUserRole(user.userType.toLowerCase());
      }
    }
  }, [domain]);

  const accessCheck = (requiredPerm: string | string[] | null, allowVendor: boolean = false) => {
    if (!userRole) return false;

    // Super Admin has full access
    if (userRole === "super_admin") return true;

    // Vendor access check
    if (userRole === "vendor") {
      return allowVendor;
    }

    // Admin access check
    if (userRole === "admin") {
      // If no specific permission is required, allow access
      if (!requiredPerm) return true;

      const permissions = userDetails?.permissions || [];

      if (Array.isArray(requiredPerm)) {
        // Check if admin has ANY of the required permissions
        return requiredPerm.some(p => permissions.includes(p));
      }

      // Check if admin has the specific permission
      return permissions.includes(requiredPerm);
    }

    return false;
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: `/${domain}`,
      icon: LayoutDashboard,
      visibility: accessCheck(null, true),
    },
    {
      name: "Admins",
      href: `/${domain}/admin-management`,
      icon: Users,
      visibility: accessCheck("admin.view", false),
    },
    {
      name: "Vendors",
      href: `/${domain}/vendors`,
      icon: Store,
      visibility: accessCheck(["vendor.view", "vendor.controlled.approve"], false),
    },
    {
      name: "Customers",
      href: `/${domain}/customers`,
      icon: Users,
      visibility: accessCheck(["customer.view", "customer.controlled.approve"], false),
    },
    {
      name: "Products",
      href: `/${domain}/products`,
      icon: Package,
      visibility: accessCheck(["product.view", "product.controlled.approve"], true),
    },
    {
      name: "Orders",
      href: `/${domain}/orders`,
      icon: ShoppingCart,
      visibility: accessCheck(["order.view", "order.controlled.approve"], true),
    },
    {
      name: "Wallet",
      href: `/${domain}/wallet`,
      icon: Wallet,
      visibility: accessCheck("wallet.view", true),
    },
    {
      name: "Payouts",
      href: `/${domain}/payouts`,
      icon: CreditCard,
      visibility: accessCheck("payout.view", false),
    },
    {
      name: "Categories",
      href: `/${domain}/categories`,
      icon: Tag,
      visibility: accessCheck("category.manage", true),
    },
    {
      name: "Web Frontend",
      href: `/${domain}/web-frontend`,
      icon: Monitor,
      visibility: accessCheck("content.manage", false),
    },
    {
      name: "Platform Settings",
      href: `/${domain}/references`,
      icon: Database,
      visibility: accessCheck("reference.manage", false),
    },
  ];

  // Restrict navigation if verification is pending or rejected (Vendors only)
  const isRestricted = domain === "vendor" && (onboardingStatus === 'pending_verification' || onboardingStatus === 'rejected');
  const filteredNavigation = isRestricted ? [] : navigationItems.filter(item => item.visibility);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    const currentAuthService = domain === "vendor" ? vendorAuthService : authService;
    currentAuthService.clearTokens();
    router.push(`/${domain}/login`);
  };

  const defaultUserLabel = domain === "vendor" ? "Vendor User" : "Admin User";
  const defaultUserEmail = domain === "vendor" ? "vendor@example.com" : "admin@example.com";
  const defaultUserRole = domain === "vendor" ? "VENDOR" : "ADMIN";

  return (
    <div className="flex h-full w-64 flex-col bg-primary">
      {/* Logo */}
      <div className="flex items-center justify-center px-4">
        <Image
          src="/images/white-logo.svg"
          alt="ArmoredMart Logo"
          width={180}
          height={50}
          priority
        />
      </div>

      {!isRestricted && (
        <nav className="flex-1 space-y-1 p-4">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Mini Profile Card & Logout */}
      <div className="border-t border-primary/20 p-4">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 pr-3">
          <Link
            href={`/${domain}/profile`}
            className="flex flex-1 items-center gap-3 rounded-md p-1 hover:bg-white/10 transition-colors min-w-0 group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-primary-foreground">
                {userDetails?.name || defaultUserLabel}
              </span>
              <span className="truncate text-xs text-primary-foreground/70">
                {userDetails?.email || defaultUserEmail}
              </span>
              <span className="truncate text-[10px] uppercase text-primary-foreground/50 tracking-wider">
                {(userDetails?.userType || defaultUserRole).replace(/_/g, " ")}
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogoutClick}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-primary-foreground/70 hover:bg-white/20 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

