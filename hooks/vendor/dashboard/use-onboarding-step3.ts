import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep3Request {
  natureOfBusiness: string[];
  controlledDualUseItems?: string;
  manufacturingSourceName?: string;
  licenseTypes: string[];
  endUseMarkets: string[];
  operatingCountries: string[];
  isOnSanctionsList: boolean;
  complianceTermsAccepted: boolean;
  businessLicenseUrl?: string;
  companyProfileUrl?: string;
  modLicenseUrl?: string;
  eocnApprovalUrl?: string;
  itarRegistrationUrl?: string;
  localAuthorityApprovalUrl?: string;
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
      // Send as JSON
      const response = await api.post<OnboardingStep3Response>(
        "/onboarding/step3",
        data
      );
      return response.data;
    },
  });
}

