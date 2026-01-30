import api, { ApiResponse } from '@/lib/api';

export interface DashboardStats {
  totalSellers?: number;
  activeSellers?: number;
  pendingApprovals?: number;
  
  totalProducts?: number;
  lowStockProducts?: number; // New for Vendors

  totalOrders?: number;
  monthlyOrders?: number; // New

  totalRevenue?: number;
  monthlyRevenue?: number; // New

  totalCustomers?: number;
  monthlyCustomers?: number; // New

  totalRefunds?: number;
  totalUsers?: number;
  
  [key: string]: unknown;
}

class DashboardService {
  /**
   * Fetch dashboard statistics from /admin/dashboard
   * @returns {Promise<DashboardStats>} Dashboard statistics object
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
      
      // Defensive check for response structure
      if (!response?.data) {
        console.error('Dashboard API returned empty response:', response);
        throw new Error('Dashboard API returned empty response');
      }
      
      if (!response.data.status) {
        console.error('Dashboard API returned failure:', response.data);
        throw new Error(response.data.message || 'Failed to fetch dashboard stats');
      }
      
      return response.data.data || {};
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error?.response?.data || error?.message || error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();

