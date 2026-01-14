import api from "@/lib/api";

export interface Admin {
  id: string;
  name: string;
  email: string;
  user_type: string;
  isActive: boolean;
  createdAt: string;
  avatar?: string | null;
  phone?: string | null;
  country_code?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  suspendedReason?: string | null;
}

export interface GetAdminsParams {
  page?: number;
  limit?: number;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  phone: string;
  country_code: string;
  userType?: string;
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
}

export const adminService = new AdminService();
