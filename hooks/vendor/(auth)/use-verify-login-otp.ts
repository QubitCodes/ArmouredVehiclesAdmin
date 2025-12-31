import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api from "@/lib/api";
import { vendorAuthService } from "@/services/vendor/auth.service";

export interface VerifyLoginOtpRequest {
  email: string;
  code: string;
}

export interface VerifyLoginOtpResponse {
  message?: string;
  success?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * React Query hook for vendor login OTP verification
 */
export function useVerifyLoginOtp() {
  return useMutation<VerifyLoginOtpResponse, AxiosError, VerifyLoginOtpRequest>({
    mutationFn: async (data: VerifyLoginOtpRequest) => {
      const response = await api.post<VerifyLoginOtpResponse>(
        "/auth/otp/login/verify",
        data
      );
      
      // Store tokens if provided in response
      if (response.data.accessToken && response.data.refreshToken) {
        vendorAuthService.setTokens(
          response.data.accessToken,
          response.data.refreshToken
        );
      }
      
      return response.data;
    },
  });
}

