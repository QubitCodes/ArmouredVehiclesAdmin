import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";

import api, { ApiResponse } from "@/lib/api";
import { vendorAuthService } from "@/services/vendor/auth.service";

export interface VerifyLoginOtpRequest {
  email: string;
  code: string;
}

export interface VerifyLoginOtpPayload {
    user: {
      id: string;
      name: string;
      email: string;
      userType: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface VerifyLoginOtpResponse extends ApiResponse<VerifyLoginOtpPayload> {}

/**
 * React Query hook for vendor login OTP verification
 */
export function useVerifyLoginOtp() {
  return useMutation<VerifyLoginOtpResponse, AxiosError, VerifyLoginOtpRequest>({
    mutationFn: async (data: VerifyLoginOtpRequest) => {
      const response = await api.post<VerifyLoginOtpResponse>(
        "/auth/otp/login/verify",
        {
            identifier: data.email,
            code: data.code
        }
      );
      
      // Store tokens if provided in response
      if (response.data.data && response.data.data.accessToken) {
        vendorAuthService.setTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken
        );

        if (response.data.data.user) {
            vendorAuthService.setUserDetails(response.data.data.user);
        }
      }
      
      return response.data;
    },
  });
}


