"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, ShoppingCart, LogOut, Tag, Database } from "lucide-react";
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
  const [userDetails, setUserDetails] = useState<any>(null);

  useEffect(() => {
    // Get user details from auth service
    const user = authService.getUserDetails();
    if (user) {
        setUserDetails(user);
        if (user.userType) {
            setUserRole(user.userType.toLowerCase());
        }
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
        name: "Categories",
        href: "/admin/categories",
        icon: Tag, // Auto-import needed
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
    {
        name: "References",
        href: "/admin/references",
        icon: Database, // Auto-import needed
        visibility: (userRole === "vendor") ? false : true,
    },
  ];

  const filteredNavigation = navigationItems.filter(item => item.visibility);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    authService.clearTokens();
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
      
      {/* Mini Profile Card & Logout */}
      <div className="border-t border-primary/20 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-primary-foreground">
              {userDetails?.name || "Admin User"}
            </span>
            <span className="truncate text-xs text-primary-foreground/70">
              {userDetails?.email || "admin@example.com"}
            </span>
            <span className="truncate text-[10px] uppercase text-primary-foreground/50 tracking-wider">
              {(userDetails?.userType || "ADMIN").replace(/_/g, " ")}
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

