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

  /* 
  const formatOnboardingStatus = (status?: string | null): string => {
    if (!status) return "—";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusColor = (status?: string | null): string => {
     // ... legacy logic ...
     return "text-foreground";
  }; 
  */

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className="grid items-center grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_minmax(150px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Name
          </div>
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Email
          </div>
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Phone
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Products
          </div>
          <div className="min-w-[110px] text-sm font-semibold text-black">
            Controlled
          </div>
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Status
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
              <div className="grid items-center grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_minmax(150px,1fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_minmax(150px,1fr)] gap-4 px-4 py-3">
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

                {/* Product Counts */}
                <div className="text-foreground text-sm">
                  <div className="flex items-center gap-2">
                    <span>{vendor.product_count || 0}</span>
                    {(vendor.pending_product_count || 0) > 0 && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">
                        {vendor.pending_product_count} Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-foreground">
                  {(onboardingStatus === 'approved_controlled' || (!!vendor.profile?.controlled_items && onboardingStatus !== 'approved_general')) ? 'Yes' : 'No'}
                </div>

                <div className="flex flex-col gap-1.5 align-start">
                  {/* Account Status */}
                  <span
                    className={`text-sm font-medium capitalize ${vendor.is_active ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {vendor.is_active ? "Active" : "Suspended"}
                  </span>

                  {/* Onboarding Status Badge */}
                  <div className="flex">
                    {(!onboardingStatus || onboardingStatus === 'not_started') && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Not Started</span>}
                    {onboardingStatus === 'in_progress' && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">In Progress</span>}
                    {onboardingStatus === 'pending_verification' && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>}
                    {(onboardingStatus === 'approved_general' || onboardingStatus === 'approved_controlled') && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {onboardingStatus === 'approved_controlled' ? 'Controlled' : 'Approved'}
                      </span>
                    )}
                    {onboardingStatus === 'rejected' && <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Rejected</span>}
                    {onboardingStatus === 'update_needed' && <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Update Needed</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
