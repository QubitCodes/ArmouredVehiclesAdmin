import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

import { ApiResponse } from "@/lib/api";

export interface VendorRegistrationRequest {
  email: string;
  username: string;
  name: string;
  userType: "vendor";
}

export type VendorRegistrationResponse = ApiResponse<{
  userId: string;
  email: string;
  username: string;
}>;

/**
 * React Query hook for vendor registration API (OTP registration start)
 */
export function x_useVendorRegistration() {
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

