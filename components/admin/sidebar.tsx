"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, ShoppingCart, LogOut } from "lucide-react";
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

// Navigation moved inside component for state access

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Simple check from local storage as per user request
    const storedType = localStorage.getItem("user_type");
    if (storedType) {
        // console.log("Sidebar: user_type from storage:", storedType);
        setUserRole(storedType.toLowerCase());
    }
  }, []);

  const navigationItems = [
    {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        visibility: true,
    },
    {
        name: "Admins",
        href: "/admin/admin-management",
        icon: Users,
        visibility: (userRole === "vendor") ? false : true,
    },
    {
        name: "Products",
        href: "/admin/products",
        icon: Package,
        visibility: true,
    },
    {
        name: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
        visibility: true,
    },
    {
        name: "Vendors",
        href: "/admin/vendors",
        icon: Store,
        visibility: (userRole === "vendor") ? false : true,
    },
  ];

  const filteredNavigation = navigationItems.filter(item => item.visibility);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    authService.clearTokens();
    // Clear user_type from storage on logout
    localStorage.removeItem("user_type");
    router.push("/admin/login");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-primary">
      <nav className="flex-1 space-y-1 p-4 pt-10">
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

