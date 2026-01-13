import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api from "@/lib/api";
import { vendorAuthService } from "@/services/vendor/auth.service";

import { ApiResponse } from "@/lib/api";

export interface VerifyPhoneRequest {
  userId: string;
  phone: string;
  code: string;
}

export type VerifyPhoneResponse = ApiResponse<{
  user: Record<string, any>;
  accessToken: string;
  refreshToken: string;
  phoneVerified: boolean;
}>;

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
      
      // Store tokens if provided in response data (payload)
      const payload = response.data.data;
      if (payload?.accessToken && payload?.refreshToken) {
        vendorAuthService.setTokens(
          payload.accessToken,
          payload.refreshToken
        );
      }
      
      return response.data;
    },
  });
}



