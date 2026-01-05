import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep2Request {
  contactFullName: string;
  contactJobTitle?: string;
  contactWorkEmail: string;
  contactIdDocumentFile?: File;
  contactMobile: string;
  contactMobileCountryCode: string;
  termsAccepted: boolean;
}

export interface OnboardingStep2Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step2 API (Contact Person)
 */
export function useOnboardingStep2() {
  return useMutation<
    OnboardingStep2Response,
    AxiosError,
    OnboardingStep2Request
  >({
    mutationFn: async (data: OnboardingStep2Request) => {
      const formData = new FormData();

      // Append all fields to FormData
      formData.append("contactFullName", data.contactFullName);
      if (data.contactJobTitle) {
        formData.append("contactJobTitle", data.contactJobTitle);
      }
      formData.append("contactWorkEmail", data.contactWorkEmail);
      if (data.contactIdDocumentFile) {
        formData.append("contactIdDocumentFile", data.contactIdDocumentFile);
      }
      formData.append("contactMobile", data.contactMobile);
      formData.append("contactMobileCountryCode", data.contactMobileCountryCode);
      formData.append("termsAccepted", data.termsAccepted.toString());

      const response = await api.post<OnboardingStep2Response>(
        "/vendor/onboarding/step2",
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

