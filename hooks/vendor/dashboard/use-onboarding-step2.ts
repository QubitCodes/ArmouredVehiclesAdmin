import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep2Request {
  contactFullName: string;
  contactJobTitle?: string;
  contactWorkEmail: string;
  contactIdDocumentUrl: string;
  passportCopy?: File;
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
      // If passportCopy file exists, use FormData, otherwise use JSON
      if (data.passportCopy) {
        const formData = new FormData();
        formData.append("contactFullName", data.contactFullName);
        if (data.contactJobTitle) {
          formData.append("contactJobTitle", data.contactJobTitle);
        }
        formData.append("contactWorkEmail", data.contactWorkEmail);
        formData.append("contactIdDocumentUrl", data.contactIdDocumentUrl);
        formData.append("passportCopy", data.passportCopy);
        formData.append("contactMobile", data.contactMobile);
        formData.append("contactMobileCountryCode", data.contactMobileCountryCode);
        formData.append("termsAccepted", data.termsAccepted.toString());

        const response = await api.post<OnboardingStep2Response>(
          "/vendor/onboarding/step2",
          formData
        );
        return response.data;
      } else {
        // Send as JSON when no file is present
        const jsonPayload = {
          contactFullName: data.contactFullName,
          contactJobTitle: data.contactJobTitle,
          contactWorkEmail: data.contactWorkEmail,
          contactIdDocumentUrl: data.contactIdDocumentUrl,
          contactMobile: data.contactMobile,
          contactMobileCountryCode: data.contactMobileCountryCode,
          termsAccepted: data.termsAccepted,
        };

        const response = await api.post<OnboardingStep2Response>(
          "/vendor/onboarding/step2",
          jsonPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      }
    },
  });
}

