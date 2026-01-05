import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep0Request {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyPhoneCountryCode: string;
}

export interface OnboardingStep0Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step0 API
 */
export function useOnboardingStep0() {
  return useMutation<
    OnboardingStep0Response,
    AxiosError,
    OnboardingStep0Request
  >({
    mutationFn: async (data: OnboardingStep0Request) => {
      const response = await api.post<OnboardingStep0Response>(
        "/vendor/onboarding/step0",
        data
      );
      return response.data;
    },
  });
}

