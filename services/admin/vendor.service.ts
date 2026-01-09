import api from "@/lib/api";

export interface VendorUserProfile {
  id: number;
  userId: string;
  typeOfBuyer: string | null;
  complianceRegistration: string | null;
  country: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyPhoneCountryCode: string;
  countryOfRegistration: string | null;
  registeredCompanyName: string | null;
  tradeBrandName: string | null;
  yearOfEstablishment: number | null;
  legalEntityId: string | null;
  legalEntityIssueDate: string | null;
  legalEntityExpiryDate: string | null;
  cityOfficeAddress: string | null;
  officialWebsite: string;
  entityType: string;
  dunsNumber: string | null;
  vatCertificateUrl: string | null;
  taxVatNumber: string | null;
  taxIssuingDate: string | null;
  taxExpiryDate: string | null;
  contactFullName: string | null;
  contactJobTitle: string | null;
  contactWorkEmail: string | null;
  contactIdDocumentUrl: string | null;
  contactMobile: string | null;
  contactMobileCountryCode: string | null;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  natureOfBusiness: string[];
  controlledDualUseItems: string | null;
  licenseTypes: string | null;
  endUseMarkets: string | null;
  operatingCountries: string | null;
  isOnSanctionsList: boolean;
  businessLicenseUrl: string | null;
  defenseApprovalUrl: string | null;
  companyProfileUrl: string | null;
  complianceTermsAccepted: boolean;
  complianceTermsAcceptedAt: string | null;
  sellingCategories: string[];
  registerAs: string;
  preferredCurrency: string;
  sponsorContent: boolean;
  paymentMethod: string | null;
  bankCountry: string | null;
  financialInstitution: string | null;
  swiftCode: string | null;
  bankAccountNumber: string | null;
  proofType: string | null;
  bankProofUrl: string | null;
  commissionPercent: number | null;
  verificationMethod: string | null;
  submittedForApproval: boolean;
  submittedAt: string;
  onboardingStatus: string;
  currentStep: number;
  completedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
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
  countryCode: string | null;
  password: null;
  firebaseUid: string | null;
  userType: string;
  avatar: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  completionPercentage: number;
  tokenVersion: number;
  onboardingStep: number;
  isActive: boolean;
  suspendedAt: string | null;
  suspendedBy: string | null;
  suspendedReason: string | null;
  createdAt: string;
  userProfile: VendorUserProfile | null;
  stats: VendorStats;
  recentOrders: unknown[];
}

export interface GetVendorsResponse {
  success: boolean;
  data: Vendor[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetVendorsParams {
  page?: number;
  limit?: number;
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

