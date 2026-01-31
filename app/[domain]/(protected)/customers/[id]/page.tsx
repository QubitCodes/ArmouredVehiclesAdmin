"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
    ArrowLeft,
    Info,
    ShoppingCart,
    User,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CustomerProfile } from "@/components/admin/customer-management/customer-profile";
import { CustomerOrders } from "@/components/admin/customer-management/customer-orders";
import { customerService, Customer } from "@/services/admin/customer.service";
import { authService } from "@/services/admin/auth.service";
import { useQuery } from "@tanstack/react-query";

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const customerId = params.id as string;
    const domain = (params?.domain as string) || "admin";
    const currentTab = searchParams.get('tab') || 'details';

    const { data: customer, isLoading, error } = useQuery({
        queryKey: ["customer", customerId],
        queryFn: async () => customerService.getCustomerById(customerId),
        retry: false
    });

    // Marked fields for removal state
    const [markedFields, setMarkedFields] = useState<Set<string>>(new Set());
    const [canPerformActions, setCanPerformActions] = useState(false);

    useEffect(() => {
        // Simple permission check (can be refined based on actual permission names)
        const perm = authService.hasPermission("customer.approve") || authService.hasPermission("customer.controlled.approve");
        setCanPerformActions(perm);
    }, []);

    const toggleMarkField = (field: string) => {
        setMarkedFields(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
            } else {
                next.add(field);
            }
            return next;
        });
    };

    // Handle errors
    useEffect(() => {
        if (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error("Customer Fetch Error:", axiosError);
            if (axiosError?.response?.status !== 404) {
                toast.error("Failed to fetch customer details");
            }
        }
    }, [error]);

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="3xl" className="text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">
                        Loading customer details...
                    </p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex w-full flex-col gap-4">
                <Button
                    variant="outline"
                    onClick={() => router.push(`/${domain}/customers`)}
                    className="w-fit"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        Customer not found.
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 ">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push(`/${domain}/customers`)}
                    className="h-9 w-9"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                    <p className="text-sm text-muted-foreground">Customer ID: {customer.id}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="flex gap-4" aria-label="Customer navigation tabs">
                    <button
                        onClick={() => handleTabChange('details')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                            currentTab === 'details'
                                ? "text-primary border-primary"
                                : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground"
                        )}
                    >
                        <Info className="h-4 w-4" />
                        <span>Info</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('orders')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                            currentTab === 'orders'
                                ? "text-primary border-primary"
                                : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground"
                        )}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Orders</span>
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="pb-10">
                {currentTab === 'details' && (
                    <CustomerProfile
                        customer={customer}
                        markedFields={markedFields}
                        toggleMarkField={toggleMarkField}
                        canPerformActions={canPerformActions}
                    />
                )}
                {currentTab === 'orders' && <CustomerOrders customerId={customerId} basePath={`/${domain}/orders`} />}
            </div>

        </div>
    );
}
