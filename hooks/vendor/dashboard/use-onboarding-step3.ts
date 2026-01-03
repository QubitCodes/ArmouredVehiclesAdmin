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
  businessLicenseUrl: string;
  defenseApprovalUrl?: string;
  companyProfileUrl?: string;
  complianceTermsAccepted: boolean;
  businessLicense?: File;
  companyProfile?: File;
  licenseFiles?: Record<string, File>;
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
      // Send as JSON (backend only supports JSON for now, FormData will be added later)
      const jsonPayload = {
        natureOfBusiness: data.natureOfBusiness,
        controlledDualUseItems: data.controlledDualUseItems || "",
        licenseTypes: data.licenseTypes,
        endUseMarkets: data.endUseMarkets,
        operatingCountries: data.operatingCountries,
        isOnSanctionsList: data.isOnSanctionsList,
        businessLicenseUrl: data.businessLicenseUrl || "",
        defenseApprovalUrl: data.defenseApprovalUrl || "",
        companyProfileUrl: data.companyProfileUrl || "",
        complianceTermsAccepted: data.complianceTermsAccepted,
      };
      
      const response = await api.post<OnboardingStep3Response>(
        "/vendor/onboarding/step3",
        jsonPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    },
  });
}

