import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface VendorRegistrationRequest {
  email: string;
  username: string;
  name: string;
  userType: "vendor";
}

export interface VendorRegistrationResponse {
  message?: string;
  success?: boolean;
  userId?: string;
}

/**
 * React Query hook for vendor registration API (OTP registration start)
 */
export function useVendorRegistration() {
  return useMutation<
    VendorRegistrationResponse,
    AxiosError,
    VendorRegistrationRequest
  >({
    mutationFn: async (data: VendorRegistrationRequest) => {
      const response = await api.post<VendorRegistrationResponse>(
        "/auth/otp/register/start",
        data
      );
      return response.data;
    },
  });
}

