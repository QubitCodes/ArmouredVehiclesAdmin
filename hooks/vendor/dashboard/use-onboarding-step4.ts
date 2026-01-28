import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep4Request {
  sellingCategories: string[];
  registerAs: string | null;
  preferredCurrency: string;
  sponsorContent: boolean;
  password?: string;
  isDraft?: boolean;
}

export interface OnboardingStep4Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step4 API (Account Preferences)
 */
export function useOnboardingStep4() {
  return useMutation<
    OnboardingStep4Response,
    AxiosError,
    OnboardingStep4Request
  >({
    mutationFn: async (data: OnboardingStep4Request) => {
      const response = await api.post<OnboardingStep4Response>(
        "/onboarding/step4",
        data,
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

