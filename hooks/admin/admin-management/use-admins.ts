import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Admin,
  adminService,
  GetAdminsParams,
  CreateAdminRequest,
} from "@/services/admin/admin.service";

interface AdminsResponse {
  admins: Admin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * React Query hook for fetching admins
 */
export function useAdmins(params: GetAdminsParams = {}) {
  return useQuery<AdminsResponse, AxiosError>({
    queryKey: ["admins", params],
    queryFn: async () => {
      const response = await adminService.getAdmins(params);

      // Handle array response (legacy)
      if (Array.isArray(response)) {
        return {
          admins: response,
          pagination: { page: 1, limit: 10, total: response.length, totalPages: 1 },
        };
      }

      // API response structure: { success, data, misc: { total, page, pages } }
      const admins = response.data || [];
      const misc = response.misc || {};

      return {
        admins,
        pagination: {
          page: misc.page || 1,
          limit: params.limit || 10,
          total: misc.total || admins.length,
          totalPages: misc.pages || 1,
        },
      };
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

