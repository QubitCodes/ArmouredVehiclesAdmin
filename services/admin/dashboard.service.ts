import api from "@/lib/api";

export interface DashboardStats {
  totalSellers?: number;
  activeSellers?: number;
  pendingApprovals?: number;
  totalProducts?: number;
  totalOrders?: number;
  totalRevenue?: number;
  totalCustomers?: number;
  totalRefunds?: number;
  [key: string]: unknown;
}

class DashboardService {
  /**
   * Fetch dashboard statistics from /admin/dashboard
   */
  async getDashboardStats() {
    try {
      const response = await api.get<DashboardStats>("/admin/dashboard");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();

