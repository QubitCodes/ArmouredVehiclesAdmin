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
  sellers: Vendor[];
  total: number;
  page: number;
  limit: number;
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
      const response = await api.get<GetVendorsResponse>("/admin/sellers", {
        params,
      });
      return response.data;
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
      const response = await api.get<Vendor>(`/admin/sellers/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching vendor:", error);
      throw error;
    }
  }
}

export const vendorService = new VendorService();

