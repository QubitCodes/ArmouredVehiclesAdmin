"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { User } from "lucide-react";
import { Vendor } from "@/services/admin/vendor.service";
import { normalizeImageUrl } from "@/lib/utils";

interface VendorTableProps {
  vendors: Vendor[];
  emptyMessage?: string;
}

export function VendorTable({ vendors, emptyMessage = "No vendors found." }: VendorTableProps) {
  const router = useRouter();

  if (vendors.length === 0) {
    return (
      <div className="border p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const handleVendorClick = (vendorId: string) => {
    router.push(`/admin/vendors/${vendorId}`);
  };

  const formatPhone = (phone: string | null, countryCode: string | null): string => {
    if (!phone) return "—";
    const code = countryCode || "";
    return `${code} ${phone}`.trim();
  };

  const formatOnboardingStatus = (status?: string | null): string => {
    if (!status) return "—";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusColor = (status?: string | null): string => {
    if (!status) return "text-foreground";
    const s = status.toLowerCase();
    if (s === "approved_general") return "text-green-600 dark:text-green-500";
    if (s === "approved_controlled") return "text-green-500 dark:text-green-500";
    if (s === "pending_verification") return "text-yellow-600 dark:text-yellow-500";
    if (s === "rejected") return "text-red-600 dark:text-red-500";
    if (s === "not_started") return "text-gray-600 dark:text-gray-500";
    if (s === "in_progress") return "text-blue-600 dark:text-blue-500";
    return "text-foreground";
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className="grid items-center grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(140px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Name
          </div>
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Email
          </div>
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Phone
          </div>
          <div className="min-w-[140px] text-sm font-semibold text-black">
            Onboarding Status
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {vendors.map((vendor) => {
          const avatarUrl = vendor.avatar ? normalizeImageUrl(vendor.avatar) : null;
          const onboardingStatus = vendor.profile?.onboarding_status;

          return (
            <div
              key={vendor.id}
              onClick={() => handleVendorClick(vendor.id)}
              className="w-full overflow-hidden bg-bg-light transition-all hover:shadow-sm cursor-pointer"
            >
              <div className="grid items-center grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(140px,1fr)] gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={vendor.name || "Vendor"}
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
                    {vendor.name || "—"}
                  </span>
                </div>
                <div className="text-foreground">{vendor.email || "—"}</div>
                <div className="text-foreground">
                  {formatPhone(vendor.phone, vendor.country_code)}
                </div>
                <div className="text-foreground">
                  <span
                    className={`text-sm capitalize ${getStatusColor(onboardingStatus)}`}
                  >
                    {formatOnboardingStatus(onboardingStatus)}
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
