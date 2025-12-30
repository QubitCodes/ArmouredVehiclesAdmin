import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  DashboardStats,
  dashboardService,
} from "@/services/admin/dashboard.service";

/**
 * React Query hook for fetching dashboard statistics
 */
export function useDashboard() {
  return useQuery<DashboardStats, AxiosError>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      return await dashboardService.getDashboardStats();
    },
  });
}

