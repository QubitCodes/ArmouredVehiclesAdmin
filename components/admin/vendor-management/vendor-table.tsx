"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vendor, vendorService } from "@/services/admin/vendor.service";

interface VendorTableProps {
  vendors: Vendor[];
}

export function VendorTable({ vendors }: VendorTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await vendorService.approveVendor(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason, note }: { userId: string; reason: string; note: string }) => {
      return await vendorService.rejectVendor(userId, reason, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });

  if (vendors.length === 0) {
    return (
      <div className="border p-8 text-center text-muted-foreground">
        No vendors found.
      </div>
    );
  }

  const handleVendorClick = (vendorId: string) => {
    router.push(`/admin/vendors/${vendorId}`);
  };

  const handleApprove = async (userId: string) => {
    try {
      setUpdatingId(userId);
      await approveMutation.mutateAsync(userId);
      toast.success("Vendor approved successfully");
      router.refresh();
    } catch (error) {
      console.error("Error approving vendor:", error);
      toast.error("Failed to approve vendor");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectClick = (userId: string) => {
    setSelectedVendorId(userId);
    setRejectReason("");
    setRejectNote("");
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedVendorId) return;

    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (!rejectNote.trim()) {
      toast.error("Please provide a note for rejection");
      return;
    }

    try {
      setUpdatingId(selectedVendorId);
      await rejectMutation.mutateAsync({
        userId: selectedVendorId,
        reason: rejectReason,
        note: rejectNote,
      });
      toast.success("Vendor rejected successfully");
      setRejectDialogOpen(false);
      setSelectedVendorId(null);
      setRejectReason("");
      setRejectNote("");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      toast.error("Failed to reject vendor");
    } finally {
      setUpdatingId(null);
    }
  };

  const getOnboardingStatusColor = (status?: string) => {
    if (status === "approved") return "text-green-600 dark:text-green-500";
    if (status === "under_review") return "text-yellow-600 dark:text-yellow-500";
    if (status === "rejected") return "text-red-600 dark:text-red-500";
    return "text-gray-600 dark:text-gray-500";
  };

  const getOnboardingStatusDisplay = (status?: string) => {
    if (!status) return "N/A";
    return status.replace("_", " ");
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden mb-1">
        <div className="grid items-center grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3 bg-transparent">
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Company Name
          </div>
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Username
          </div>
          <div className="min-w-[200px] text-sm font-semibold text-black">
            Email
          </div>
          <div className="min-w-[150px] text-sm font-semibold text-black">
            Onboarding Status
          </div>
          <div className="min-w-[120px] text-sm font-semibold text-black">
            Action
          </div>
        </div>
      </div>

      <div className="w-full space-y-1">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            onClick={() => handleVendorClick(vendor.id)}
            className="w-full overflow-hidden bg-bg-light transition-all hover:shadow-sm cursor-pointer"
          >
            <div className="grid items-center grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(120px,1fr)] gap-4 px-4 py-3">
              <div className="font-medium text-foreground">
                {vendor.userProfile?.companyName || vendor.name}
              </div>
              <div className="text-sm text-foreground">
                {vendor.username || "—"}
              </div>
              <div className="text-foreground">
                {vendor.userProfile?.companyEmail || vendor.email}
              </div>
              <div>
                <span
                  className={`text-sm font-medium capitalize ${getOnboardingStatusColor(
                    vendor.userProfile?.onboardingStatus
                  )}`}
                >
                  {getOnboardingStatusDisplay(vendor.userProfile?.onboardingStatus)}
                </span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={updatingId === vendor.id}
                    className="flex items-center gap-1 outline-none"
                  >
                    <span
                      className={`text-sm font-medium ${
                        updatingId === vendor.id ? "opacity-50" : ""
                      }`}
                    >
                      {updatingId === vendor.id ? "Updating..." : "Actions"}
                    </span>
                    {updatingId !== vendor.id && (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleApprove(vendor.id)}
                      className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-950/20"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRejectClick(vendor.id)}
                      className="flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                      Reject
                    </DropdownMenuItem>
                    {/* Placeholder for future suspend action */}
                    {/* <DropdownMenuItem
                      onClick={() => handleSuspend(vendor.id)}
                      className="flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    >
                      <Ban className="h-4 w-4 text-orange-600" />
                      Suspend
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-bg-light">
          <DialogHeader>
            <DialogTitle>Reject Vendor</DialogTitle>
            <DialogDescription>
              Please provide a reason and note for rejecting this vendor. Both fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                placeholder="Enter rejection reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note *</Label>
              <textarea
                id="note"
                placeholder="Enter rejection note"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
                className="flex min-h-[80px] w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedVendorId(null);
                setRejectReason("");
                setRejectNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending || !rejectReason.trim() || !rejectNote.trim()}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

