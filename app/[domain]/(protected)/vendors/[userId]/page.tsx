"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Calendar,
  Shield,
  FileText,
  CreditCard,
  BarChart3,
  ExternalLink,
  FileCheck,
  Phone,
  Globe,
  Info,
  Briefcase,
  MapPin,
  Hash,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useVendor } from "@/hooks/admin/vendor-management/use-vendor";
import { useVendorActions } from "@/hooks/admin/vendor-management/use-vendor-actions";
import { cn } from "@/lib/utils";
import { vendorService } from "@/services/admin/vendor.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { VendorProfileView } from "@/components/admin/vendor-profile-view";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { data: vendor, isLoading, error } = useVendor(userId);

  console.log('[DEBUG] VendorPage Render', { userId, isLoading, hasVendor: !!vendor, error: error?.message });

  // Handle 404 errors - Display error but don't redirect
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      // If 404, we let the UI handle the "Not Found" display
      if (axiosError?.response?.status !== 404) {
        const errorMessage =
          axiosError?.response?.data?.message ||
          axiosError?.message ||
          "Failed to fetch vendor";
        toast.error(errorMessage);
      }
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Checking vendor status...
          </p>
        </div>
      </div>
    );
  }

  if (!vendor || error) {
    return (
      <div className="flex w-full flex-col gap-4 p-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/vendors")}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-12 text-center flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-semibold">Vendor Not Found</span>
              <span className="text-muted-foreground">The requested vendor could not be found or you do not have permission to access it.</span>
            </div>
            {error && <div className="mt-2 rounded bg-destructive/10 p-2 text-xs text-destructive font-mono">{(error as any).message || String(error)}</div>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendorProfileData = (vendor.userProfile ||
    vendor.profile) as unknown as Record<string, unknown> | null;

  return (
    <div className="flex w-full flex-col gap-6">
      <VendorProfileView user={vendor} profile={vendorProfileData} />

      {/* Admin Actions */}
      <VendorApprovalActions vendor={vendor} />
      <VendorActions vendor={vendor} />
    </div>
  );
}

function VendorActions({ vendor }: { vendor: any }) {
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    // No auto-selection logic
  }, [vendor.is_active]);

  const { mutate: updateStatus, isPending } = useMutation({
// ... (rest of mutation) ...
// (Inside VendorActions return)
        < div className = "w-56" >
  <Select
    placeholder="Select Action..."
    value={selectedAction}
    onChange={(e) => setSelectedAction(e.target.value)}
    className="font-semibold"
  >
    <option value="" disabled>Select Action...</option>
    {vendor.is_active ? (
      <option value="suspend">Suspend Account</option>
    ) : (
      <option value="activate">Activate Account</option>
    )}
  </Select>
        </div >
    // ...
    // (Inside VendorApprovalActions)
    useEffect(() => {
      const hasPermission = authService.hasPermission("vendor.controlled.approve");
      setCanApproveControlled(hasPermission);
      // No pre-selection logic
    }, [vendor]);
  // ...
  // (Inside VendorApprovalActions return)
  <div className="w-56">
    <Select
      placeholder="Change Status..."
      value={selectedStatus}
      onChange={(e) => setSelectedStatus(e.target.value)}
      className="font-semibold"
    >
      <option value="" disabled>Change Status...</option>
      {canApproveControlled && (
        <option value="approved_controlled">Approved Controlled</option>
      )}
      <option value="approved_general">Approved General</option>
      <option value="rejected">Rejected</option>
    </Select>
  </div>
  // ...
  // (Inside VendorApprovalActions button)
  {
    isPending ? (
      <Spinner className="mr-2 h-4 w-4 border-2" />
    ) : selectedStatus === "rejected" ? (
      <XCircle className="mr-2 h-5 w-5" />
    ) : (
      <CheckCircle2 className="mr-2 h-5 w-5" />
    )
  }
  Submit
              </Button >
    <Button
      variant="outline"
      size="lg"
      className="px-8 font-semibold border-2 transition-all"
      disabled={isPending}
      onClick={() => {
        setSelectedStatus("");
        setComment("");
      }}
    >
      Cancel
    </Button>
            </div >
          </div >
        )
}
      </CardContent >
    </Card >
  );
}
