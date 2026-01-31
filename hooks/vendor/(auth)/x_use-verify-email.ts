import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api from "@/lib/api";
import { vendorAuthService } from "@/services/vendor/auth.service";

import { ApiResponse } from "@/lib/api";

export interface VerifyEmailRequest {
  userId: string;
  email: string;
  code: string;
}

export type VerifyEmailResponse = ApiResponse<{
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    userType: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}>;

/**
 * React Query hook for vendor email verification API
 */
export function x_useVerifyEmail() {
  return useMutation<VerifyEmailResponse, AxiosError, VerifyEmailRequest>({
    mutationFn: async (data: VerifyEmailRequest) => {
      const response = await api.post<VerifyEmailResponse>(
        "/auth/otp/register/verify",
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

