import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface ResendPhoneRequest {
  userId: string;
  phone: string;
}

export interface ResendPhoneResponse {
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for resending phone OTP API
 */
export function x_useResendPhone() {
  return useMutation<ResendPhoneResponse, AxiosError, ResendPhoneRequest>({
    mutationFn: async (data: ResendPhoneRequest) => {
      const response = await api.post<ResendPhoneResponse>(
        "/auth/otp/resend-phone",
        data
      );
      return response.data;
    },
  });
}

