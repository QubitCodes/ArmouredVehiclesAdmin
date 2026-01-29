"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  Info,
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
import { authService } from "@/services/admin/auth.service";
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
    mutationFn: async ({ action, reason }: { action: 'activate' | 'suspend'; reason?: string }) => {
      return vendorService.updateStatus(vendor.id, action, reason);
    },
    onSuccess: () => {
      toast.success("Vendor status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vendor", vendor.id] });
      setReason("");
      setSelectedAction(""); // Reset selection on success
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  });

  const handleAction = () => {
    if (selectedAction === 'suspend' && !reason) {
      toast.error("Please provide a reason for suspension");
      return;
    }
    updateStatus({ action: selectedAction as 'activate' | 'suspend', reason });
  };

  return (
    <Card className="border-t-4 border-t-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Account Actions
        </CardTitle>
        <div className="w-56">
          <Select
            placeholder="Select Action..."
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="font-semibold"
          >

            {vendor.is_active ? (
              <option value="suspend">Suspend Account</option>
            ) : (
              <option value="activate">Activate Account</option>
            )}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedAction && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {selectedAction === 'suspend' && (
              <div className="space-y-2">
                <Label
                  htmlFor="reason"
                  className="text-base font-semibold flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Suspension Reason (Required)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why the vendor is being suspended..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[120px] border-destructive/20 focus-visible:ring-destructive/30"
                />
              </div>
            )}

            <div className="flex gap-4">
              <Button
                size="lg"
                className={cn(
                  "px-8 font-semibold shadow-md transition-all min-w-[140px]",
                  selectedAction === "suspend"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground"
                )}
                disabled={isPending}
                onClick={handleAction}
              >
                {isPending ? (
                  <Spinner className="mr-2 h-4 w-4 border-2" />
                ) : selectedAction === "suspend" ? (
                  <XCircle className="mr-2 h-5 w-5" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                Confirm{" "}
                {selectedAction === "suspend" ? "Suspension" : "Activation"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 font-semibold border-2 transition-all"
                disabled={isPending}
                onClick={() => {
                  setSelectedAction("");
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VendorApprovalActions({ vendor }: { vendor: any }) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [comment, setComment] = useState("");
  const [canApproveControlled, setCanApproveControlled] = useState(false);

  useEffect(() => {
    const hasPermission = authService.hasPermission("vendor.controlled.approve");
    setCanApproveControlled(hasPermission);
    // No pre-selection logic
  }, [vendor]);

  const { approveVendor, isApproving, rejectVendor, isRejecting } =
    useVendorActions(vendor.id);

  const handleAction = async () => {
    if (selectedStatus === "rejected") {
      if (!comment) {
        toast.error("Please provide a reason for rejection in the comments");
        return;
      }
      try {
        await rejectVendor(comment);
        setSelectedStatus("");
        setComment("");
      } catch (e) {
        // Error handled in hook
      }
    } else {
      try {
        await approveVendor({ status: selectedStatus, note: comment });
        setSelectedStatus("");
        setComment("");
      } catch (e) {
        // Error handled in hook
      }
    }
  };

  const isPending = isApproving || isRejecting;

  return (
    <Card className="border-t-4 border-t-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Review & Approval
        </CardTitle>
        <div className="w-56">
          <Select
            placeholder="Change Status..."
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="font-semibold"
          >

            {canApproveControlled && (
              <option value="approved_controlled">Approved Controlled</option>
            )}
            <option value="approved_general">Approved General</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedStatus && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <Label
                htmlFor="comment"
                className="text-base font-semibold flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {selectedStatus === "rejected"
                  ? "Rejection Reason (Required)"
                  : "Notes / Comments"}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  selectedStatus === "rejected"
                    ? "Explain why the vendor is being rejected..."
                    : "Add any notes about this approval..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={cn(
                  "min-h-[120px]",
                  selectedStatus === "rejected"
                    ? "border-destructive/20 focus-visible:ring-destructive/30"
                    : ""
                )}
              />
            </div>
            <div className="flex gap-4">
              <Button
                size="lg"
                className={cn(
                  "px-8 font-semibold shadow-md transition-all min-w-[140px]",
                  selectedStatus === "rejected"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground"
                )}
                disabled={isPending}
                onClick={handleAction}
              >
                {isPending ? (
                  <Spinner className="mr-2 h-4 w-4 border-2" />
                ) : selectedStatus === "rejected" ? (
                  <XCircle className="mr-2 h-5 w-5" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                Submit
              </Button>
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
