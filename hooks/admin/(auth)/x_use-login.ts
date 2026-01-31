import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api, { ApiResponse } from "@/lib/api";

export interface LoginStartRequest {
  identifier: string;
}

export interface LoginStartResponse extends ApiResponse<{
  expiresIn: number;
  debugOtp?: string;
}> {}

/**
 * React Query hook for login API (OTP login start)
 */
export function x_useLoginStart() {
  return useMutation<LoginStartResponse, AxiosError, LoginStartRequest>({
    mutationFn: async (data: LoginStartRequest) => {
      const response = await api.post<LoginStartResponse>(
        "/auth/otp/login/start",
        { identifier: data.identifier }
      );
      return response.data;
    },
  });
}

