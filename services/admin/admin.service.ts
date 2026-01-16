import api from "@/lib/api";

export interface Admin {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  country_code?: string | null;
  firebase_uid?: string | null;
  user_type: string;
  avatar?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  completion_percentage?: number;
  token_version?: number;
  onboarding_step?: number;
  is_active: boolean;
  suspended_at?: string | null;
  suspended_by?: string | null;
  suspended_reason?: string | null;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GetAdminsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  misc: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  phone: string;
  country_code: string;
  userType?: string;
}

export interface UpdateAdminRequest {
  name: string;
  email: string;
  phone: string;
  country_code: string;
  is_active?: boolean;
}

class AdminService {
  /**
   * Fetch list of admins
   */
  async getAdmins(params: GetAdminsParams = {}) {
    try {
      const response = await api.get("/admin/admins", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching admins:", error);
      throw error;
    }
  }

  /**
   * Create a new admin
   */
  async createAdmin(data: CreateAdminRequest) {
    try {
      const response = await api.post("/admin/admins", data);
      return response.data;
    } catch (error) {
      console.error("Error creating admin:", error);
      throw error;
    }
  }

  /**
   * Update an existing admin
   */
  async updateAdmin(id: string, data: UpdateAdminRequest) {
    try {
      const response = await api.put(`/admin/admins/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating admin:", error);
      throw error;
    }
  }

  /**
   * Delete an admin
   */
  async deleteAdmin(id: string) {
    try {
      const response = await api.delete(`/admin/admins/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting admin:", error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
