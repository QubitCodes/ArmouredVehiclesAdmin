import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingProgressResponse {
  status:
    | "pending"
    | "in_progress"
    | "pending_verification"
    | "under_review"
    | "approved"
    | "rejected"
    | "suspended";
  currentStep: number;
  totalSteps: number;
  remainingSteps: number;
  profileCompleted: boolean;
}

/**
 * React Query hook for fetching vendor onboarding progress
 */
export function useOnboardingProgress(enabled: boolean = true) {
  return useQuery<OnboardingProgressResponse, AxiosError>({
    queryKey: ["vendor-onboarding-progress"],
    queryFn: async () => {
      const response = await api.get<OnboardingProgressResponse>(
        "/onboarding/progress"
      );
      return response.data;
    },
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
