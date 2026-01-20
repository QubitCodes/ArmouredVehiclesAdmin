"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { User } from "lucide-react";
import { Customer } from "@/services/admin/customer.service";
import { normalizeImageUrl } from "@/lib/utils";

interface CustomerTableProps {
    customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
    const router = useRouter();

    if (customers.length === 0) {
        return (
            <div className="border p-8 text-center text-muted-foreground">
                No customers found.
            </div>
        );
    }

    const handleCustomerClick = (customerId: string) => {
        router.push(`/admin/customers/${customerId}`);
    };

    const formatPhone = (phone: string | null, countryCode: string | null): string => {
        if (!phone) return "—";
        const code = countryCode || "";
        return `${code} ${phone}`.trim();
    };

    return (
        <div className="w-full">
            <div className="w-full overflow-hidden mb-1">
                <div className="grid items-center grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3 bg-transparent">
                    <div className="min-w-[180px] text-sm font-semibold text-black">
                        Name
                    </div>
                    <div className="min-w-[180px] text-sm font-semibold text-black">
                        Email
                    </div>
                    <div className="min-w-[150px] text-sm font-semibold text-black">
                        Phone
                    </div>
                    <div className="min-w-[100px] text-sm font-semibold text-black">
                        Status
                    </div>
                </div>
            </div>

            <div className="w-full space-y-1">
                {customers.map((customer) => {
                    const avatarUrl = customer.avatar ? normalizeImageUrl(customer.avatar) : null;

                    return (
                        <div
                            key={customer.id}
                            onClick={() => handleCustomerClick(customer.id)}
                            className="w-full overflow-hidden bg-bg-light transition-all hover:shadow-sm cursor-pointer"
                        >
                            <div className="grid items-center grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(100px,1fr)] gap-4 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    {avatarUrl ? (
                                        <Image
                                            src={avatarUrl}
                                            alt={customer.name || "Customer"}
                                            width={32}
                                            height={32}
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                    <span className="font-medium text-foreground">
                                        {customer.name || "—"}
                                    </span>
                                </div>
                                <div className="text-foreground">{customer.email || "—"}</div>
                                <div className="text-foreground">
                                    {formatPhone(customer.phone, customer.country_code)}
                                </div>
                                <div className="text-foreground">
                                    <span
                                        className={`text-sm capitalize ${customer.is_active ? "text-green-600" : "text-red-600"
                                            }`}
                                    >
                                        {customer.is_active ? "Active" : "Suspended"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
