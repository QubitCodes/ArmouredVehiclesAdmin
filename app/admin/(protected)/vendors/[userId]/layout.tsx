"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { VendorTabs } from "@/components/admin/vendor-management/vendor-tabs";
import { useVendor } from "@/hooks/admin/vendor-management/use-vendor";

export default function VendorDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const {
    data: vendor,
    isLoading,
  } = useVendor(userId);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading vendor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {vendor?.companyName || vendor?.user.name || "Vendor"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vendor Details
            </p>
          </div>
        </div>
      </div>

      <VendorTabs userId={userId} />
      {children}
    </div>
  );
}

