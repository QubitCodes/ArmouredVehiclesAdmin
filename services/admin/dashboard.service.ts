import api, { ApiResponse } from '@/lib/api';

/**
 * SDUI Dashboard Widget Interface
 */
export interface DashboardWidget {
	type: 'stat_card';
	width: number;
	title: string;
	value: string | number;
	subValue?: string;
	icon: string; // Lucide icon name
	theme: string; // Tailwind color key (e.g., 'blue', 'emerald', 'amber')
}

/**
 * Dashboard API Response Data
 */
export interface DashboardData {
	items: DashboardWidget[];
}

class DashboardService {
	/**
	 * Fetch dashboard statistics from /admin/dashboard (SDUI Format)
	 * @returns {Promise<DashboardData>} Dashboard data with SDUI widgets
	 */
	async getDashboardStats(): Promise<DashboardData> {
		try {
			const response = await api.get<ApiResponse<DashboardData>>('/admin/dashboard');
			
			if (!response?.data) {
				console.error('Dashboard API returned empty response:', response);
				throw new Error('Dashboard API returned empty response');
			}
			
			if (!response.data.status) {
				console.error('Dashboard API returned failure:', response.data);
				throw new Error(response.data.message || 'Failed to fetch dashboard stats');
			}
			
			return response.data.data || { items: [] };
		} catch (error: any) {
			console.error('Error fetching dashboard stats:', error?.response?.data || error?.message || error);
			throw error;
		}
	}
}

export const dashboardService = new DashboardService();
