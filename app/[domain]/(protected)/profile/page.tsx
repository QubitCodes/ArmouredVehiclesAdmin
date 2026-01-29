"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin/admin.service";
import { vendorService } from "@/services/admin/vendor.service";
import { authService } from "@/services/admin/auth.service";
import { vendorAuthService } from "@/services/vendor/auth.service";
import { VendorProfileView } from "@/components/admin/vendor-profile-view";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function ProfilePage() {
    const params = useParams();
    const domain = (params?.domain as string) || "admin";
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Determine auth service and get user details
        const currentAuthService = domain === "vendor" ? vendorAuthService : authService;
        const user = currentAuthService.getUserDetails();
        if (user) {
            setUserId(user.id);
            setUserRole(user.userType || (domain === 'vendor' ? 'vendor' : 'admin'));
        }
    }, [domain]);

    // Fetch full user details based on ID and Role
    const { data: user, isLoading, error } = useQuery({
        queryKey: ["profile", userId, userRole],
        queryFn: async () => {
            if (!userId) return null;

            if (userRole === "vendor") {
                const response = await vendorService.getVendorByUserId(userId);
                return response; // Vendor object
            } else {
                // Admin
                const response = await adminService.getAdmin(userId);
                return response.data; // Admin response wrapped in { success, data } usually? Check service.
                // adminService.getAdmin returns response.data which is { success, data: {...} }.
                // Wait, adminService.getAdmin impl:
                // const response = await api.get(...)
                // return response.data;
                // API response is { success: true, data: user }.
                // So this returns the wrapper.
            }
        },
        enabled: !!userId && !!userRole,
        retry: false,
    });

    // Normalize user data from the different API responses
    // Vendor API returns the Vendor object directly (or nested?)
    // Admin API returns { success, data }.
    // Let's inspect `adminService.getAdmin`.
    // It fetches `/admin/admins/:id`.
    // Controller returns { success: true, data: { ...attributes } }.
    // So `response.data` in `useQuery` (from `adminService.getAdmin`) is the `{ success, data }` object.
    // We need `response.data.data`.

    // Checking `vendorService.getVendorByUserId`:
    // Likely returns `Vendor` object directly or `response.data`.
    // `useVendor` hook uses it directly as `Vendor`.
    // Let's assume normalize logic needed.

    const userData = userRole === 'vendor'
        ? user
        : (user as any)?.data;

    const userProfile = userRole === 'vendor'
        ? (userData?.userProfile || userData?.profile)
        : null; // Admins don't have userProfile usually

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="3xl" className="text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Loading profile...
                    </p>
                </div>
            </div>
        );
    }

    if (!userData && !isLoading && userId) {
        return (
            <div className="flex w-full flex-col gap-4 p-6">
                <Card>
                    <CardContent className="p-12 text-center flex flex-col items-center gap-4">
                        <div className="rounded-full bg-muted p-4">
                            <Info className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xl font-semibold">Profile Not Found</span>
                            <span className="text-muted-foreground">Could not load your profile information.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!userId) return null; // Initial state

    return (
        <div className="container mx-auto py-6 max-w-7xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account details and information.
                </p>
            </div>

            <VendorProfileView user={userData} profile={userProfile} />
        </div>
    );
}
