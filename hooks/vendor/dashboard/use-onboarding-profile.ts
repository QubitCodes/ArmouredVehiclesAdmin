import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api, { ApiResponse } from "@/lib/api";

export interface OnboardingProfileUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  userType: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingStep: number;
}

export interface OnboardingProfileResponse {
  profile: any | null;
  user: OnboardingProfileUser;
}

/**
 * React Query hook for fetching vendor onboarding profile
 */
export function useOnboardingProfile(enabled: boolean = true) {
  return useQuery<OnboardingProfileResponse, AxiosError>({
    queryKey: ["vendor-onboarding-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<OnboardingProfileResponse>>(
        "/onboarding/profile"
      );
      return response.data.data;
    },
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

