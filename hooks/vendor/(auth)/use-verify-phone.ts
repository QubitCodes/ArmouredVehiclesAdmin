import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api from "@/lib/api";
import { vendorAuthService } from "@/services/vendor/auth.service";

export interface VerifyPhoneRequest {
  userId: string;
  phone: string;
  code: string;
}

export interface VerifyPhoneResponse {
  message: string;
  user: Record<string, any>;
  accessToken: string;
  refreshToken: string;
}

/**
 * React Query hook for vendor phone verification API
 */
export function useVerifyPhone() {
  return useMutation<VerifyPhoneResponse, AxiosError, VerifyPhoneRequest>({
    mutationFn: async (data: VerifyPhoneRequest) => {
      const response = await api.post<VerifyPhoneResponse>(
        "/auth/otp/verify-phone",
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



