import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep1Request {
  countryOfRegistration: string;
  registeredCompanyName: string;
  tradeBrandName?: string;
  yearOfEstablishment: number;
  legalEntityId: string;
  legalEntityIssueDate: string;
  legalEntityExpiryDate: string;
  cityOfficeAddress: string;
  officialWebsite?: string;
  entityType: string;
  dunsNumber?: string;
  vatCertificateUrl?: string; // Changed from File to Url
  taxVatNumber?: string;
  taxIssuingDate?: string;
  taxExpiryDate?: string;
}

export interface OnboardingStep1Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step1 API (Company Information)
 */
export function useOnboardingStep1() {
  return useMutation<
    OnboardingStep1Response,
    AxiosError,
    OnboardingStep1Request
  >({
    mutationFn: async (data: OnboardingStep1Request) => {
      // Send as JSON
      const response = await api.post<OnboardingStep1Response>(
        "/onboarding/step1",
        data
      );
      return response.data;
    },
  });
}

