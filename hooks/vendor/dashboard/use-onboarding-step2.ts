import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep2Request {
  contactFullName: string;
  contactJobTitle?: string;
  contactWorkEmail: string;
  contactIdDocumentUrl?: string; // Changed from File to Url
  contactMobile: string;
  contactMobileCountryCode: string;
  termsAccepted: boolean;
}

export interface OnboardingStep2Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step2 API (Contact Person)
 */
export function useOnboardingStep2() {
  return useMutation<
    OnboardingStep2Response,
    AxiosError,
    OnboardingStep2Request
  >({
    mutationFn: async (data: OnboardingStep2Request) => {
      // Send as JSON
      const response = await api.post<OnboardingStep2Response>(
        "/onboarding/step2",
        data
      );
      return response.data;
    },
  });
}

