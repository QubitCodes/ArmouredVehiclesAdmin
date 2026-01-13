import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import api from "@/lib/api";

export interface OnboardingStep1Request {
  countryOfRegistration: string;
  registeredCompanyName: string;
  tradeBrandName?: string;
  yearOfEstablishment: number;
  legalEntityId: string;
  legalEntityIssueDate: string;
  legalEntityExpiryDate: string;
  cityOfficeAddress: string;
  officialWebsite?: string;
  entityType: string;
  dunsNumber?: string;
  vatCertificateFile?: File;
  taxVatNumber?: string;
  taxIssuingDate?: string;
  taxExpiryDate?: string;
}

export interface OnboardingStep1Response {
  message?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * React Query hook for vendor onboarding step1 API (Company Information)
 */
export function useOnboardingStep1() {
  return useMutation<
    OnboardingStep1Response,
    AxiosError,
    OnboardingStep1Request
  >({
    mutationFn: async (data: OnboardingStep1Request) => {
      const formData = new FormData();

      // Append all fields to FormData
      formData.append("countryOfRegistration", data.countryOfRegistration);
      formData.append("registeredCompanyName", data.registeredCompanyName);
      if (data.tradeBrandName) {
        formData.append("tradeBrandName", data.tradeBrandName);
      }
      formData.append("yearOfEstablishment", data.yearOfEstablishment.toString());
      formData.append("legalEntityId", data.legalEntityId);
      formData.append("legalEntityIssueDate", data.legalEntityIssueDate);
      formData.append("legalEntityExpiryDate", data.legalEntityExpiryDate);
      formData.append("cityOfficeAddress", data.cityOfficeAddress);
      if (data.officialWebsite) {
        formData.append("officialWebsite", data.officialWebsite);
      }
      formData.append("entityType", data.entityType);
      if (data.dunsNumber) {
        formData.append("dunsNumber", data.dunsNumber);
      }
      if (data.vatCertificateFile) {
        formData.append("vatCertificateFile", data.vatCertificateFile);
      }
      if (data.taxVatNumber) {
        formData.append("taxVatNumber", data.taxVatNumber);
      }
      if (data.taxIssuingDate) {
        formData.append("taxIssuingDate", data.taxIssuingDate);
      }
      if (data.taxExpiryDate) {
        formData.append("taxExpiryDate", data.taxExpiryDate);
      }

      const response = await api.post<OnboardingStep1Response>(
        "/onboarding/step1",
        formData
      );
      return response.data;
    },
  });
}

