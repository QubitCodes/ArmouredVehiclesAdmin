"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Store, LogOut } from "lucide-react";

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
  {
    name: "Store",
    href: "/vendor/store",
    icon: Store,
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
    authService.clearTokens();
    router.push("/vendor/login");
  };

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <h2 className="text-lg font-semibold text-foreground">Vendor Portal</h2>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <button
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your vendor account. You can log back in anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


