import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Admin,
  adminService,
  GetAdminsParams,
  CreateAdminRequest,
} from "@/services/admin/admin.service";

/**
 * React Query hook for fetching admins
 */
export function useAdmins(params: GetAdminsParams = {}) {
  return useQuery<Admin[], AxiosError>({
    queryKey: ["admins", params],
    queryFn: async () => {
      const response = await adminService.getAdmins(params);
      // Handle different response structures
      return Array.isArray(response) ? response : response.data || [];
    },
  });
}

/**
 * React Query hook for creating a new admin
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation<Admin, AxiosError, CreateAdminRequest>({
    mutationFn: async (data: CreateAdminRequest) => {
      const response = await adminService.createAdmin(data);
      return response.data || response;
    },
    onSuccess: () => {
      // Invalidate and refetch admins list after successful creation
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}

