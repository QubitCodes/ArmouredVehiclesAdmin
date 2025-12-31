import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface SetPhoneRequest {
  userId: string;
  phone: string;
  countryCode: string;
}

export interface SetPhoneResponse {
  message?: string;
  success?: boolean;
}

/**
 * React Query hook for setting phone number API
 */
export function useSetPhone() {
  return useMutation<SetPhoneResponse, AxiosError, SetPhoneRequest>({
    mutationFn: async (data: SetPhoneRequest) => {
      const response = await api.post<SetPhoneResponse>(
        "/auth/otp/set-phone",
        data
      );
      return response.data;
    },
  });
}

