import api from "@/lib/api";

export interface VendorUserProfile {
  id: string;
  user_id: string;
  country: string;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  company_phone_country_code: string | null;
  country_of_registration: string | null;
  registered_company_name: string | null;
  trade_brand_name: string | null;
  year_of_establishment: number | null;
  legal_entity_id: string | null;
  legal_entity_issue_date: string | null;
  legal_entity_expiry_date: string | null;
  city_office_address: string | null;
  official_website: string | null;
  entity_type: string | null;
  duns_number: string | null;
  vat_certificate_url: string | null;
  tax_vat_number: string | null;
  tax_issuing_date: string | null;
  tax_expiry_date: string | null;
  contact_full_name: string | null;
  contact_job_title: string | null;
  contact_work_email: string | null;
  contact_id_document_url: string | null;
  contact_mobile: string | null;
  contact_mobile_country_code: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  nature_of_business: string | null;
  controlled_dual_use_items: string | null;
  license_types: string | null;
  end_use_markets: string | null;
  operating_countries: string | null;
  is_on_sanctions_list: boolean;
  business_license_url: string | null;
  defense_approval_url: string | null;
  company_profile_url: string | null;
  compliance_terms_accepted: boolean;
  compliance_terms_accepted_at: string | null;
  selling_categories: string | null;
  register_as: string;
  preferred_currency: string | null;
  sponsor_content: boolean;
  payment_method: string | null;
  bank_country: string | null;
  financial_institution: string | null;
  swift_code: string | null;
  bank_account_number: string | null;
  proof_type: string | null;
  bank_proof_url: string | null;
  verification_method: string | null;
  submitted_for_approval: boolean | null;
  submitted_at: string | null;
  onboarding_status: string;
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface VendorStats {
  products: number;
  orders: number;
  revenue: number;
  customers: number;
}

export interface Vendor {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  firebase_uid: string | null;
  user_type: string;
  avatar: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  completion_percentage: number;
  token_version: number;
  onboarding_step: number | null;
  is_active: boolean;
  suspended_at: string | null;
  suspended_by: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profile?: VendorUserProfile | null;
  userProfile?: VendorUserProfile | null;
  stats?: VendorStats;
  recentOrders?: unknown[];
}

export interface GetVendorsResponse {
  success: boolean;
  data: Vendor[];
  misc?: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface GetVendorsParams {
  page?: number;
  limit?: number;
  search?: string;
  onboarding_status?: string;
}

class VendorService {
  /**
   * Fetch list of vendors
   */
  async getVendors(params: GetVendorsParams = {}) {
    try {
      const response = await api.get<GetVendorsResponse>("/admin/vendors", {
        params,
      });
      return response.data; // This returns the whole object { success, data: [], ... } or just data?
      // Backend returns: { success: true, data: vendors.rows, total, page, totalPages }
      // If api.get unwraps axios, response.data is the body.
      // So return response.data should be the object above.
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw error;
    }
  }

  /**
   * Fetch a single vendor by id
   */
  async getVendorByUserId(id: string) {
    try {
      const response = await api.get<{ success: boolean; data: Vendor }>(`/admin/vendors/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching vendor:", error);
      throw error;
    }
  }

  /**
   * Approve a vendor
   */
  async approveVendor(userId: string) {
    try {
      const response = await api.post(`/admin/vendors/${userId}/approve`, {
        status: "approved",
      });
      return response.data;
    } catch (error) {
      console.error("Error approving vendor:", error);
      throw error;
    }
  }

  /**
   * Reject a vendor
   */
  async rejectVendor(userId: string, reason: string, note: string) {
    try {
      const response = await api.post(`/admin/vendors/${userId}/reject`, {
        reason,
        note,
      });
      return response.data;
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      throw error;
    }
  }

  /**
   * Fetch orders for a specific vendor
   */
  async getVendorOrders(vendorId: string, params: GetVendorsParams & { vendorId?: string } = {}) {
    try {
      // Exclude vendorId from query params as it is in the path
      const { vendorId: _, ...queryParams } = params;
      const response = await api.get<{ success: boolean; data: any[]; total: number }>(`/admin/vendors/${vendorId}/orders`, {
        params: queryParams,
      });
      return response.data; // Expected { success: true, data: [], total... }
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      throw error;
    }
  }

  /**
   * Fetch single order for a specific vendor
   */
  async getVendorOrder(vendorId: string, orderId: string) {
    try {
      const response = await api.get<{ success: boolean; data: any }>(`/admin/vendors/${vendorId}/orders/${orderId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching vendor order:", error);
      throw error;
    }
  }
}

export const vendorService = new VendorService();

