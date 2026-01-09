import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api, { ApiResponse } from "@/lib/api";
import { authService } from "@/services/admin/auth.service";

export interface VerifyOtpRequest {
  identifier: string;
  code: string;
}

export interface VerifyOtpPayload {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    userType: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface VerifyOtpResponse extends ApiResponse<VerifyOtpPayload> {}

/**
 * React Query hook for OTP verification
 */
export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, AxiosError, VerifyOtpRequest>({
    mutationFn: async (data: VerifyOtpRequest) => {
      const response = await api.post<VerifyOtpResponse>(
        "/auth/otp/login/verify",
        { identifier: data.identifier, code: data.code }
      );
      
        authService.setTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken
        );

        if (response.data.data.user) {
            authService.setUserDetails(response.data.data.user);
        }

      
      return response.data;
    },
  });
}

