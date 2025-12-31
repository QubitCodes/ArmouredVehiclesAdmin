import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api from "@/lib/api";
import { authService } from "@/services/admin/auth.service";

export interface VerifyEmailRequest {
  userId: string;
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  message?: string;
  success?: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

/**
 * React Query hook for vendor email verification API
 */
export function useVerifyEmail() {
  return useMutation<VerifyEmailResponse, AxiosError, VerifyEmailRequest>({
    mutationFn: async (data: VerifyEmailRequest) => {
      const response = await api.post<VerifyEmailResponse>(
        "/auth/otp/verify-email",
        data
      );
      
      // Store tokens if provided in response
      if (response.data.accessToken && response.data.refreshToken) {
        authService.setTokens(
          response.data.accessToken,
          response.data.refreshToken
        );
      }
      
      return response.data;
    },
  });
}

