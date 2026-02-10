import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vendorService } from "@/services/admin/vendor.service";
import { AxiosError } from "axios";

export function useVendorActions(userId: string) {
  const queryClient = useQueryClient();

  const updateOnboardingStatusMutation = useMutation({
    mutationFn: ({ status, note, fieldsToClear, targetStep }: { status: string; note?: string; fieldsToClear?: string[]; targetStep?: number }) =>
      vendorService.updateOnboardingStatus(userId, status, note, fieldsToClear, targetStep),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendor", userId] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });

      const isRejection = variables.status === "rejected";
      const message = isRejection
        ? "Vendor rejected successfully"
        : "Vendor approved successfully";
      toast.success(message);
    },
    onError: (error: AxiosError<{ message?: string }>, variables) => {
      const isRejection = variables.status === "rejected";
      const defaultMessage = isRejection
        ? "Failed to reject vendor"
        : "Failed to approve vendor";
      const message = error.response?.data?.message || defaultMessage;
      toast.error(message);
    },
  });

  return {
    updateOnboardingStatus: updateOnboardingStatusMutation.mutateAsync,
    isUpdating: updateOnboardingStatusMutation.isPending,
    // Backward compatibility
    approveVendor: (data: { status: string; note?: string }) =>
      updateOnboardingStatusMutation.mutateAsync(data),
    isApproving: updateOnboardingStatusMutation.isPending,
    rejectVendor: (note: string, fieldsToClear?: string[], targetStep?: number) =>
      updateOnboardingStatusMutation.mutateAsync({ status: "rejected", note, fieldsToClear, targetStep }),
    isRejecting: updateOnboardingStatusMutation.isPending,
  };
}
