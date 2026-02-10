"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Info, Upload, ChevronDown, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import("@/components/vendor/pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="text-gray-500">Loading PDF preview...</div>
    </div>
  ),
});

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DateSelector } from "@/components/ui/date-selector";
import { Spinner } from "@/components/ui/spinner";
import { useCountries, type Country } from "@/hooks/vendor/dashboard/use-countries";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { useOnboardingStep1 } from "@/hooks/vendor/dashboard/use-onboarding-step1";
import { OnboardingProgressBar } from "@/components/vendor/onboarding-progress-bar";

const companyInformationSchema = z.object({
  countryOfRegistration: z
    .string()
    .min(1, "Country of registration is required"),
  registeredCompanyName: z
    .string()
    .min(1, "Registered company name is required"),
  yearOfEstablishment: z.string().min(1, "Year of establishment is required"),
  tradeBrandName: z.string().optional(),
  legalEntityId: z.string().min(1, "Legal Entity ID / CR No is required"),
  issueDate: z.object({
    day: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
  }),
  expiryDate: z.object({
    day: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
  }),
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State / Province is required"),
  postalCode: z.string().min(1, "Postal / Zip Code is required"),
  officialWebsite: z
    .string()
    .url("Please enter a valid website URL")
    .optional()
    .or(z.literal("")),
  entityType: z.string().min(1, "Entity Type is required"),
  dunsNumber: z.string().optional(),
  taxVatNumber: z.string().min(1, "Tax / VAT Number is required"),
  taxIssueDate: z
    .object({
      day: z.number().optional(),
      month: z.number().optional(),
      year: z.number().optional(),
    })
    .refine(
      (date) => date.day && date.month && date.year,
      { message: "Issuing Date is required" }
    ),
  taxExpiryDate: z
    .object({
      day: z.number().optional(),
      month: z.number().optional(),
      year: z.number().optional(),
    })
    .optional(),
  vatCertificate: z
    .any()
    .refine((file) => file instanceof File, {
      message: "VAT Registration Certificate is required",
    }),
});

type CompanyInformationFormValues = z.infer<typeof companyInformationSchema>;

// Entity Type Option Type
type EntityTypeOption = {
  id: number;
  name: string;
};

// Helper function to convert date object to ISO date string
function dateObjectToISOString(dateObj: { day?: number; month?: number; year?: number }): string | undefined {
  if (!dateObj.year || !dateObj.month || !dateObj.day) {
    return undefined;
  }
  const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

export default function CompanyInformationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);

  // Fetch countries from API
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries();

  // Fetch onboarding profile to auto-fill company name
  const { data: profileData, isLoading: isProfileLoading } =
    useOnboardingProfile();

  const step1Mutation = useOnboardingStep1();

  const form = useForm<CompanyInformationFormValues>({
    resolver: zodResolver(companyInformationSchema),
    defaultValues: {
      countryOfRegistration: "ae",
      registeredCompanyName: "",
      yearOfEstablishment: "",
      tradeBrandName: "",
      legalEntityId: "",
      issueDate: {},
      expiryDate: {},
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      officialWebsite: "",
      entityType: "",
      dunsNumber: "",
      taxVatNumber: "",
      taxIssueDate: {},
      taxExpiryDate: {},
    },
  });

  const [states, setStates] = useState<any[]>([]);
  const [statesLoading, setStatesLoading] = useState<boolean>(false);
  const [entityTypes, setEntityTypes] = useState<EntityTypeOption[]>([]);
  const [entityTypesLoading, setEntityTypesLoading] = useState<boolean>(false);

  // Fetch Entity Types
  useEffect(() => {
    const fetchEntityTypes = async () => {
      setEntityTypesLoading(true);
      try {
        const response = await api.get("/references/entity-type");
        if (response.data.status) {
          setEntityTypes(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch entity types:", error);
      } finally {
        setEntityTypesLoading(false);
      }
    };
    fetchEntityTypes();
  }, []);

  // Auto-fill form when profile data is available
  useEffect(() => {
    if (profileData?.profile && !isProfileLoading) {
      const p = profileData.profile;

      // Helper to parse ISO date string to { day, month, year }
      const parseDate = (isoString?: string) => {
        if (!isoString) return {};
        const date = new Date(isoString);
        return {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
        };
      };

      // Helper to find country code from profile value
      const countryCode = (() => {
        const val = p.country_of_registration || "United Arab Emirates";
        const found = (countries as Country[]).find(
          c => c.value === val.toLowerCase() || c.label.toLowerCase() === val.toLowerCase()
        );
        return found ? found.value : "ae";
      })();

      form.reset({
        countryOfRegistration: countryCode,
        registeredCompanyName: p.registered_company_name || "",
        yearOfEstablishment: p.year_of_establishment ? String(p.year_of_establishment) : "",
        tradeBrandName: p.trade_brand_name || "",
        legalEntityId: p.legal_entity_id || "",
        issueDate: parseDate(p.legal_entity_issue_date),
        expiryDate: parseDate(p.legal_entity_expiry_date),
        addressLine1: p.address_line1 || p.city_office_address || "",
        addressLine2: p.address_line2 || "",
        state: p.state || "",
        city: p.city || "",
        postalCode: p.postal_code || "",
        officialWebsite: p.official_website || "",
        entityType: p.entity_type ? String(p.entity_type) : "",
        dunsNumber: p.duns_number || "",
        taxVatNumber: p.tax_vat_number || "",
        taxIssueDate: parseDate(p.tax_issuing_date),
        taxExpiryDate: parseDate(p.tax_expiry_date),
      });

      // Handle file preview if URL exists
      if (p.govt_compliance_reg_url) {
        setImagePreview(p.govt_compliance_reg_url);
        const isPdf = p.govt_compliance_reg_url.toLowerCase().endsWith('.pdf');
        setFileType(isPdf ? 'pdf' : 'image');

        const dummyFile = new File([""], "existing_file", { type: isPdf ? "application/pdf" : "image/jpeg" });
        form.setValue("vatCertificate", dummyFile);
      }
    }
  }, [profileData, isProfileLoading, form]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        form.setValue("vatCertificate", file);
        setFileType('image');
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        form.setValue("vatCertificate", file);
        setFileType('pdf');
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    form.setValue("vatCertificate", undefined);
    setImagePreview(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: CompanyInformationFormValues) => {
    try {
      let vatCertificateUrl = undefined;

      if (data.vatCertificate instanceof File) {
        const uploadData = new FormData();
        uploadData.append("files", data.vatCertificate);
        uploadData.append("label", "VENDOR_VAT_CERTIFICATE");
        uploadData.append("data", JSON.stringify({}));

        const uploadRes = await api.post('/upload/files', uploadData);

        const uploadJson = uploadRes.data;
        if (uploadJson.status && uploadJson.data && uploadJson.data.length > 0) {
          vatCertificateUrl = uploadJson.data[0];
        } else {
          throw new Error("File upload response invalid");
        }
      } else if (typeof data.vatCertificate === 'string') {
        if (imagePreview) {
          vatCertificateUrl = imagePreview;
        }
      }

      const payload = {
        countryOfRegistration: data.countryOfRegistration,
        registeredCompanyName: data.registeredCompanyName,
        tradeBrandName: data.tradeBrandName || undefined,
        yearOfEstablishment: parseInt(data.yearOfEstablishment, 10),
        legalEntityId: data.legalEntityId,
        legalEntityIssueDate: dateObjectToISOString(data.issueDate) || "",
        legalEntityExpiryDate: dateObjectToISOString(data.expiryDate) || "",
        cityOfficeAddress: `${data.addressLine1}, ${data.city}, ${data.state}, ${data.postalCode}`,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        state: data.state,
        city: data.city,
        postalCode: data.postalCode,
        officialWebsite: data.officialWebsite || undefined,
        entityType: data.entityType,
        dunsNumber: data.dunsNumber || undefined,
        vatCertificateUrl: vatCertificateUrl,
        taxVatNumber: data.taxVatNumber || undefined,
        taxIssuingDate: data.taxIssueDate ? dateObjectToISOString(data.taxIssueDate) : undefined,
        taxExpiryDate: data.taxExpiryDate ? dateObjectToISOString(data.taxExpiryDate) : undefined,
      };

      await step1Mutation.mutateAsync(payload);
      toast.success("Company information saved successfully!");
      router.push("/vendor/contact-person");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to save company information. Please try again.";
      toast.error(errorMessage);
    }
  };

  const countryOfRegistration = useWatch({
    control: form.control,
    name: "countryOfRegistration",
  });
  const selectedCountry = (countries as Country[]).find(
    (c) => c.value === countryOfRegistration
  );
  const countryValue = selectedCountry?.value;

  // Fetch states when country changes
  useEffect(() => {
    if (!countryOfRegistration) {
      setStates([]);
      return;
    }

    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const selectedCountryObj = (countries as Country[]).find(
          (c) => c.value === countryOfRegistration
        );
        const countryName = selectedCountryObj?.label;

        if (!countryName) {
          setStates([]);
          return;
        }

        const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: countryName })
        });
        const result = await response.json();
        if (result.data && result.data.states) {
          setStates(result.data.states);
        } else {
          setStates([]);
        }
      } catch (error) {
        console.error("Failed to fetch states:", error);
        setStates([]);
      } finally {
        setStatesLoading(false);
      }
    };

    fetchStates();
  }, [countryOfRegistration]);

  return (
    <div className="min-h-screen bg-[#EBE3D6] flex flex-col items-center px-4 py-8 text-black">
      <div className="w-full max-w-[1200px]">
        {/* Progress Bar */}
        <OnboardingProgressBar currentStep={1} />

        {/* Heading Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold uppercase font-orbitron">
            COMPANY INFORMATION
          </h2>
          <span className="text-xl cursor-pointer">⌃</span>
        </div>

        {/* Form Container */}
        <div className="bg-[#F3EDE3] p-8 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* COMPANY DETAILS SECTION */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                  {/* Registered Company Name */}
                  <FormField
                    control={form.control}
                    name="registeredCompanyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Registered Company Name <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                              placeholder="eg: Blue Web Trading"
                              {...field}
                            />
                            {isProfileLoading && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Spinner size="sm" className="text-gray-400" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Trade/Brand Name */}
                  <FormField
                    control={form.control}
                    name="tradeBrandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Trade/Brand Name (if different)
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Year of Establishment */}
                  <FormField
                    control={form.control}
                    name="yearOfEstablishment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Year of Establishment <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Legal Entity ID / CR No */}
                  <FormField
                    control={form.control}
                    name="legalEntityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Legal Entity ID / CR No <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Your Trade License Number"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Issue Date */}
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Issue Date <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <DateSelector
                            value={field.value}
                            onChange={field.onChange}
                            selectClassName="bg-transparent border border-[#C7B88A] h-[42px] focus:outline-none rounded-none text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Expiry Date */}
                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Expiry Date
                        </FormLabel>
                        <FormControl>
                          <DateSelector
                            value={field.value}
                            onChange={field.onChange}
                            selectClassName="bg-transparent border border-[#C7B88A] h-[42px] focus:outline-none rounded-none text-sm"
                            includeFutureYears={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Entity Type */}
                  <FormField
                    control={form.control}
                    name="entityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Entity Type <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <select
                              {...field}
                              className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none appearance-none h-[42px]"
                            >
                              <option value="" className="bg-[#F3EDE3]">Select Entity Type</option>
                              {entityTypesLoading ? (
                                <option disabled className="bg-[#F3EDE3]">Loading...</option>
                              ) : (
                                entityTypes.map((type) => (
                                  <option key={type.id} value={String(type.id)} className="bg-[#F3EDE3]">
                                    {type.name}
                                  </option>
                                ))
                              )}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C7B88A] pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* DUNS Number */}
                  <FormField
                    control={form.control}
                    name="dunsNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          DUNS Number (if applicable)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="eg: 65-432-1987"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Official Website */}
                  <FormField
                    control={form.control}
                    name="officialWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Official Website
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="eg: www.domain-name.com"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ADDRESS DETAILS SECTION */}
              <div className="space-y-5 pt-5 border-t border-[#BDAA91]">
                <h3 className="text-lg font-bold uppercase font-orbitron mb-2">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  {/* Row 1: Country | State */}
                  {/* Country of Registration */}
                  <FormField
                    control={form.control}
                    name="countryOfRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Country of Registration <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <select
                              {...field}
                              disabled={isCountriesLoading}
                              className={`w-full border border-[#C7B88A] bg-transparent ${selectedCountry ? "pl-10" : "px-3"
                                } py-2 text-sm focus:outline-none appearance-none disabled:opacity-50 h-[42px]`}
                            >
                              {isCountriesLoading ? (
                                <option value="">Loading countries...</option>
                              ) : (
                                (countries as Country[]).map((country) => (
                                  <option key={country.value} value={country.value} className="bg-[#F3EDE3]">
                                    {country.label}
                                  </option>
                                ))
                              )}
                            </select>
                            {selectedCountry && !isCountriesLoading && (
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none z-10">
                                {selectedCountry.flag}
                              </span>
                            )}
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C7B88A] pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          {states.length > 0 ? "State / Province" : "State or Province Code"} <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          {states.length > 0 ? (
                            <div className="relative">
                              <select
                                {...field}
                                disabled={!countryValue || statesLoading}
                                className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none appearance-none disabled:opacity-50 h-[42px]"
                              >
                                <option value="" className="bg-[#F3EDE3]">Select State</option>
                                {states.map((s: any) => (
                                  <option key={s.name} value={s.name} className="bg-[#F3EDE3]">
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C7B88A] pointer-events-none" />
                            </div>
                          ) : (
                            <Input
                              {...field}
                              placeholder="Enter State / Province"
                              disabled={!countryValue || statesLoading}
                              className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Row 2: Address Line 1 | City */}
                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Address Line 1 <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Building No, Street Name"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          City <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="eg: Dubai"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Row 3: Address Line 2 | Postal Code */}
                  <FormField
                    control={form.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Address Line 2
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Area / Landmark"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Postal / Zip Code <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000"
                            className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* TAX INFORMATION SECTION */}
              <div className="space-y-6 pt-5 border-t border-[#BDAA91]">
                <h3 className="text-[20px] font-bold uppercase font-orbitron mb-4">
                  TAX INFORMATION
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="taxVatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold mb-1 block text-sm">
                            Tax / VAT Number <span className="text-red-600">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="eg: 100123456700003"
                              className="w-full border border-[#C7B88A] bg-transparent px-3 py-2 text-sm focus:outline-none h-[42px] rounded-none shadow-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxIssueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold mb-1 block text-sm">
                            Issuing Date <span className="text-red-600">*</span>
                          </FormLabel>
                          <FormControl>
                            <DateSelector
                              value={field.value || {}}
                              onChange={field.onChange}
                              selectClassName="bg-transparent border border-[#C7B88A] h-[42px] focus:outline-none rounded-none text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold mb-1 block text-sm">
                            Expiry Date
                          </FormLabel>
                          <FormControl>
                            <DateSelector
                              value={field.value || {}}
                              onChange={field.onChange}
                              selectClassName="bg-transparent border border-[#C7B88A] h-[42px] focus:outline-none rounded-none text-sm"
                              includeFutureYears={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* VAT Certificate Upload */}
                  <FormField
                    control={form.control}
                    name="vatCertificate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold mb-1 block text-sm">
                          Upload VAT Registration Certificate <span className="text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,application/pdf"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            {imagePreview ? (
                              <div className="relative border border-[#C7B88A] overflow-hidden bg-[#EFE8DC] p-2">
                                {fileType === 'image' ? (
                                  <img
                                    src={imagePreview}
                                    alt="VAT Certificate Preview"
                                    className="w-full h-64 object-contain"
                                  />
                                ) : fileType === 'pdf' ? (
                                  <PDFViewer file={imagePreview} />
                                ) : null}
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="absolute top-2 right-2 p-2 bg-[#D35400] text-white rounded-full hover:bg-[#39482C] transition-colors z-10"
                                  aria-label="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border border-dashed border-[#C7B88A] py-16 bg-[#EFE8DC] flex flex-col items-center justify-center cursor-pointer hover:bg-[#E5DDD1] transition-colors text-center"
                              >
                                <Upload className="w-8 h-8 text-[#C7B88A] mb-3" />
                                <p className="text-sm font-semibold text-black mb-1 px-4">
                                  Choose a File or Drag & Drop It Here.
                                </p>
                                <p className="text-xs text-gray-500">
                                  JPEG, PNG and PDF formats up to 10 MB.
                                </p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SAVING / NEXT ACTION */}
              <div className="flex justify-center pt-10">
                <button
                  type="submit"
                  disabled={step1Mutation.isPending}
                  className="w-full sm:w-[300px] h-[48px] bg-[#D35400] text-white font-black font-orbitron clip-path-supplier uppercase text-sm hover:bg-[#39482C] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {step1Mutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" className="text-white" />
                      SAVING...
                    </span>
                  ) : (
                    "NEXT"
                  )}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
