import api from "@/lib/api";

export interface Customer {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  user_type: string;
  avatar: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  onboarding_step: number | null;
  is_active: boolean;
  suspended_at: string | null;
  suspended_by: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profile?: any | null; // Generic profile for customers
}

export interface GetCustomersResponse {
  success: boolean;
  data: Customer[];
  misc?: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  onboarding_status?: string;
  controlled?: string;
}

class CustomerService {
  /**
   * Fetch list of customers
   */
  async getCustomers(params: GetCustomersParams = {}) {
    try {
      const response = await api.get<GetCustomersResponse>("/admin/customers", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  }

  /**
   * Fetch a single customer by id
   */
  async getCustomerById(id: string) {
    try {
      const response = await api.get<{ success: boolean; data: Customer }>(`/admin/customers/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  }

  /**
   * Update customer status (activate/suspend)
   */
  async updateStatus(userId: string, action: 'activate' | 'suspend', reason?: string) {
    try {
      const response = await api.patch(`/admin/customers/${userId}/status`, {
        action,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating customer status:", error);
      throw error;
    }
  }

  /**
   * Fetch orders for a specific customer
   */
  async getCustomerOrders(customerId: string, params: any = {}) {
    try {
      // Direct endpoint for customer orders
      const response = await api.get<{ success: boolean; data: any[]; misc: any }>(`/admin/customers/${customerId}/orders`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw error;
    }
  }

  /**
   * Update customer onboarding status
   */
  async updateOnboardingStatus(userId: string, status: string, note?: string, fields_to_clear?: string[]) {
    try {
      const response = await api.patch(`/admin/customers/${userId}/onboarding`, {
        status,
        note,
        fields_to_clear,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating customer onboarding status:", error);
      throw error;
    }
  }

}

export const customerService = new CustomerService();
