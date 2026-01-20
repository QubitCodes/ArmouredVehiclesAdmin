"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Spinner } from "@/components/ui/spinner";
import { OrderTable } from "@/components/admin/order-management/order-table";
import { customerService } from "@/services/admin/customer.service";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

interface CustomerOrdersProps {
    customerId: string;
}

export function CustomerOrders({ customerId }: CustomerOrdersProps) {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, error } = useQuery({
        queryKey: ["customer-orders", customerId, page],
        queryFn: async () => {
            const response = await customerService.getCustomerOrders(customerId, {
                page,
                limit,
            });
            return response;
        },
    });

    if (isLoading) {
        return (
            <div className="flex min-h-[200px] items-center justify-center">
                <Spinner size="xl" className="text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                Failed to load orders.
            </div>
        );
    }

    const orders = data?.data || [];
    const misc = data?.misc;
    const totalPages = misc?.pages || 0;

    return (
        <div className="space-y-4">
            <OrderTable orders={orders} basePath="/admin/orders" />

            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}
