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

import { AdminProfileView } from "@/components/admin/admin-profile-view";

// ... existing imports

export default function ProfilePage() {
    const params = useParams();
    const domain = (params?.domain as string) || "admin";
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Determine auth service and get user details
        const currentAuthService = domain === "vendor" ? vendorAuthService : authService;
        const user = currentAuthService.getUserDetails();
        console.log('[DEBUG] ProfilePage useEffect', { domain, user });
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

            console.log('[DEBUG] Fetching profile', { userId, userRole });
            if (userRole === "vendor") {
                const response = await vendorService.getVendorByUserId(userId);
                return response; // Vendor object
            } else {
                // Admin
                const response = await adminService.getAdmin(userId);
                console.log('[DEBUG] Admin Response', response);
                return response.data;
            }
        },
        enabled: !!userId && !!userRole,
        retry: false,
    });

    const userData = userRole === 'vendor'
        ? user
        : (user as any)?.data || (user as any); // Fallback if structure is different

    const userProfile = userRole === 'vendor'
        ? (userData?.userProfile || userData?.profile)
        : null; // Admins don't have userProfile usually

    console.log('[DEBUG] ProfilePage Render', { userId, userRole, userData, error, isLoading });

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

    // Check if we have userData. 
    const hasData = !!userData;

    if (!hasData && !isLoading && userId) {
        return (
            <div className="flex w-full flex-col gap-4 p-6">
                <Card>
                    <CardContent className="p-12 text-center flex flex-col items-center gap-4">
                        <div className="rounded-full bg-muted p-4">
                            <Info className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                            <span className="text-xl font-semibold">Profile Not Found</span>
                            <span className="text-muted-foreground">Could not load your profile information.</span>
                            {error && (
                                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm font-mono text-left max-w-lg overflow-auto">
                                    <strong>Error:</strong> {error instanceof Error ? error.message : String(error)}
                                    {(error as any)?.response?.data?.message && (
                                        <div className="mt-1">
                                            Server Message: {(error as any).response.data.message}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-4 font-mono p-1 bg-muted rounded">
                                Debug: ID={userId} | Role={userRole} | Data={String(!!userData)}
                            </div>
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

            {/* Editable User Information (For Admin & Vendor) */}
            <AdminProfileView user={userData} profile={userProfile} />

            {/* Vendor Company Information (Read Only) */}
            {userRole === 'vendor' && (
                <VendorProfileView
                    user={userData}
                    profile={userProfile}
                    hideUserInfo={true}
                />
            )}
        </div>
    );
}
