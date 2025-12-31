import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface LoginStartRequest {
  email: string;
}

export interface LoginStartResponse {
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for login API (OTP login start)
 */
export function useLoginStart() {
  return useMutation<LoginStartResponse, AxiosError, LoginStartRequest>({
    mutationFn: async (data: LoginStartRequest) => {
      const response = await api.post<LoginStartResponse>(
        "/auth/otp/login/start",
        data
      );
      return response.data;
    },
  });
}

