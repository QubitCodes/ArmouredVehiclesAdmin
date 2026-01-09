"use client";

import { useState } from "react";
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
        
        {/* Logout Button */}
        <div className="border-t border-primary/20 p-4">
          <button
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors bg-white/10 hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
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


