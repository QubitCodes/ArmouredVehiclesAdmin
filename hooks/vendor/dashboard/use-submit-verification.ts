import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface SubmitVerificationRequest {
  verificationMethod: string;
}

export interface SubmitVerificationResponse {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for submitting verification method selection
 */
export function useSubmitVerification() {
  return useMutation<
    SubmitVerificationResponse,
    AxiosError,
    SubmitVerificationRequest
  >({
    mutationFn: async (data: SubmitVerificationRequest) => {
      const response = await api.post<SubmitVerificationResponse>(
        "/vendor/onboarding/submit-verification",
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

