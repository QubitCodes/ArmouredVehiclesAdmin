"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { vendorAuthService } from "@/services/vendor/auth.service";
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

const navigation = [
  {
    name: "Dashboard",
    href: "/vendor",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/vendor/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/vendor/orders",
    icon: ShoppingCart,
  },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    const user = vendorAuthService.getUserDetails();
    if (user) {
      setUserDetails(user);
    }
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogout = () => {
    vendorAuthService.clearTokens();
    router.push("/vendor/login");
  };

  return (
    <>
      <div className="flex h-full w-64 flex-col bg-primary">
        <nav className="flex-1 space-y-1 p-4 pt-10">
          {navigation.map((item) => {
            const Icon = item.icon;
            // For Dashboard, only match exact path. For others, match exact or sub-routes
            const isActive = item.href === "/vendor"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.name}
                href={item.href}
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
        
        {/* Mini Profile Card & Logout */}
        <div className="border-t border-primary/20 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <span className="font-semibold text-sm">
                {(userDetails?.name || "V").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-primary-foreground">
                {userDetails?.name || "Vendor User"}
              </span>
              <span className="truncate text-xs text-primary-foreground/70">
                {userDetails?.email || "vendor@example.com"}
              </span>
              <span className="truncate text-[10px] uppercase text-primary-foreground/50 tracking-wider">
                {(userDetails?.userType || "VENDOR").replace(/_/g, " ")}
              </span>
            </div>
            <button
              onClick={handleLogoutClick}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-primary-foreground/70 hover:bg-white/20 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access the vendor portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


