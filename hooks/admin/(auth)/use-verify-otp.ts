import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api from "@/lib/api";
import { authService } from "@/services/admin/auth.service";

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  message?: string;
  success?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * React Query hook for OTP verification
 */
export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, AxiosError, VerifyOtpRequest>({
    mutationFn: async (data: VerifyOtpRequest) => {
      const response = await api.post<VerifyOtpResponse>(
        "/auth/otp/login/verify",
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

