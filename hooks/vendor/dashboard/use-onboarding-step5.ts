import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep5Request {
  bankCountry: string;
  financialInstitution: string;
  swiftCode?: string;
  bankAccountNumber: string;
  proofType: string;
  bankProofFile?: File;
}

export interface OnboardingStep5Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step5 API (Bank Account)
 */
export function useOnboardingStep5() {
  return useMutation<
    OnboardingStep5Response,
    AxiosError,
    OnboardingStep5Request
  >({
    mutationFn: async (data: OnboardingStep5Request) => {
      const formData = new FormData();

      // Append all fields to FormData
      formData.append("bankCountry", data.bankCountry);
      formData.append("financialInstitution", data.financialInstitution);
      if (data.swiftCode) {
        formData.append("swiftCode", data.swiftCode);
      }
      formData.append("bankAccountNumber", data.bankAccountNumber);
      formData.append("proofType", data.proofType);
      if (data.bankProofFile) {
        formData.append("bankProofFile", data.bankProofFile);
      }

      const response = await api.post<OnboardingStep5Response>(
        "/vendor/onboarding/step5",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
  });
}

