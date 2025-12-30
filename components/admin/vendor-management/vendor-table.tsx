"use client";

import { useRouter } from "next/navigation";
import { Vendor } from "@/services/admin/vendor.service";

interface VendorTableProps {
  vendors: Vendor[];
}

export function VendorTable({ vendors }: VendorTableProps) {
  const router = useRouter();

  if (vendors.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No vendors found.
      </div>
    );
  }

  const handleVendorClick = (vendorId: string) => {
    router.push(`/admin/vendors/${vendorId}`);
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-lg mb-1">
        <div className="grid items-center grid-cols-[minmax(150px,1fr)_minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Company Name
          </div>
          <div className="min-w-[180px] text-sm font-semibold text-black">
            Email
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Status
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Onboarding Status
          </div>
          <div className="min-w-[120px] hidden text-sm font-semibold text-black md:block">
            Email Verified
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => handleVendorClick(vendor.id)}
            className="w-full overflow-hidden rounded-lg bg-bg-light transition-all hover:shadow-sm cursor-pointer"
          >
            <div className="grid items-center grid-cols-[minmax(150px,1fr)_minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3">
              <div className="font-medium text-foreground">
                {vendor.userProfile?.companyName || vendor.name}
              </div>
              <div className="text-foreground">
                {vendor.userProfile?.companyEmail || vendor.email}
              </div>
              <div>
                <span
                  className={`text-sm font-medium ${
                    vendor.isActive
                      ? "text-green-600 dark:text-green-500"
                      : "text-orange-600 dark:text-orange-500"
                  }`}
                >
                  {vendor.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <span
                  className={`text-sm font-medium capitalize ${
                    vendor.userProfile?.onboardingStatus === "approved"
                      ? "text-green-600 dark:text-green-500"
                      : vendor.userProfile?.onboardingStatus === "under_review"
                      ? "text-yellow-600 dark:text-yellow-500"
                      : vendor.userProfile?.onboardingStatus === "rejected"
                      ? "text-red-600 dark:text-red-500"
                      : "text-gray-600 dark:text-gray-500"
                  }`}
                >
                  {vendor.userProfile?.onboardingStatus?.replace("_", " ") || "N/A"}
                </span>
              </div>
              <div className="hidden text-sm text-foreground md:block">
                {vendor.emailVerified ? "Verified" : "Unverified"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

