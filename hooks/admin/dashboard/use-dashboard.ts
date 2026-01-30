import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  DashboardData,
  dashboardService,
} from "@/services/admin/dashboard.service";

/**
 * React Query hook for fetching dashboard statistics (SDUI)
 */
export function useDashboard() {
  return useQuery<DashboardData, AxiosError>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      return await dashboardService.getDashboardStats();
    },
  });
}
