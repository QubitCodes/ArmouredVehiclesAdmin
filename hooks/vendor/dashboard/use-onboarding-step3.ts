import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep3Request {
  natureOfBusiness: string[];
  controlledDualUseItems?: string;
  licenseTypes: string[];
  endUseMarkets: string[];
  operatingCountries: string[];
  isOnSanctionsList: boolean;
  complianceTermsAccepted: boolean;
  businessLicenseFile?: File;
  companyProfileFile?: File;
  modLicenseFile?: File;
  eocnApprovalFile?: File;
  itarRegistrationFile?: File;
  localAuthorityApprovalFile?: File;
}

export interface OnboardingStep3Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step3 API (Declaration)
 */
export function useOnboardingStep3() {
  return useMutation<
    OnboardingStep3Response,
    AxiosError,
    OnboardingStep3Request
  >({
    mutationFn: async (data: OnboardingStep3Request) => {
      const formData = new FormData();

      // Append all non-file fields to FormData
      formData.append("natureOfBusiness", JSON.stringify(data.natureOfBusiness));
      if (data.controlledDualUseItems) {
        formData.append("controlledDualUseItems", data.controlledDualUseItems);
      }
      formData.append("licenseTypes", JSON.stringify(data.licenseTypes));
      formData.append("endUseMarkets", JSON.stringify(data.endUseMarkets));
      formData.append("operatingCountries", JSON.stringify(data.operatingCountries));
      formData.append("isOnSanctionsList", data.isOnSanctionsList.toString());
      formData.append("complianceTermsAccepted", data.complianceTermsAccepted.toString());

      // Append file fields only if they exist
      if (data.businessLicenseFile) {
        formData.append("businessLicenseFile", data.businessLicenseFile);
      }
      if (data.companyProfileFile) {
        formData.append("companyProfileFile", data.companyProfileFile);
      }
      if (data.modLicenseFile) {
        formData.append("modLicenseFile", data.modLicenseFile);
      }
      if (data.eocnApprovalFile) {
        formData.append("eocnApprovalFile", data.eocnApprovalFile);
      }
      if (data.itarRegistrationFile) {
        formData.append("itarRegistrationFile", data.itarRegistrationFile);
      }
      if (data.localAuthorityApprovalFile) {
        formData.append("localAuthorityApprovalFile", data.localAuthorityApprovalFile);
      }

      const response = await api.post<OnboardingStep3Response>(
        "/onboarding/step3",
        formData
      );
      return response.data;
    },
  });
}

