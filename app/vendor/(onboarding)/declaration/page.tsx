"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Info, X, ChevronDown, Search, Upload } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect, useRef } from "react";
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
import { useNatureOfBusiness } from "@/hooks/vendor/dashboard/use-nature-of-business";
import { useEndUseMarkets } from "@/hooks/vendor/dashboard/use-end-use-markets";
import { useCountries, type Country } from "@/hooks/vendor/dashboard/use-countries";
import { useOnboardingStep3 } from "@/hooks/vendor/dashboard/use-onboarding-step3";
import { OnboardingProgressBar } from "@/components/vendor/onboarding-progress-bar";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select } from "@/components/ui/select";

// Update Schema
const declarationSchema = z.object({
  natureOfBusiness: z
    .array(z.string())
    .min(1, "Please select at least one nature of business"),
  controlledItems: z.enum(["yes", "no"]),
  manufacturingSourceName: z.string().optional(),
  endUseMarket: z.array(z.string()).optional(),
  licenses: z.array(z.string()).optional(),
  operatingCountries: z
    .array(z.string())
    .min(1, "Please select at least one country"),
  countryInput: z.string().optional(),
  onSanctionsList: z.enum(["yes", "no"]),
  businessLicenseFile: z.any().refine((file) => file !== undefined && file instanceof File, {
    message: "Business License is required",
  }),
  companyProfileFile: z.any().optional(),
  modLicenseFile: z.any().optional(),
  eocnApprovalFile: z.any().optional(),
  itarRegistrationFile: z.any().optional(),
  localAuthorityApprovalFile: z.any().optional(),
  agreeToCompliance: z.boolean().refine((val) => val === true, {
    message: "You must agree to the compliance terms",
  }),
}).refine(
  (data) => {
    if (data.controlledItems === "yes") {
      return data.endUseMarket && data.endUseMarket.length > 0;
    }
    return true;
  },
  {
    message: "Please select at least one end-use market",
    path: ["endUseMarket"],
  }
).refine(
  (data) => {
    // If authority_license is selected, modLicenseFile is required
    if (data.licenses?.includes("authority_license")) {
      return data.modLicenseFile !== undefined && data.modLicenseFile instanceof File;
    }
    return true;
  },
  {
    message: "Please upload Authority License file. License files are mandatory.",
    path: ["modLicenseFile"],
  }
).refine(
  (data) => {
    // If eocn is selected, eocnApprovalFile is required
    if (data.licenses?.includes("eocn")) {
      return data.eocnApprovalFile !== undefined && data.eocnApprovalFile instanceof File;
    }
    return true;
  },
  {
    message: "Please upload EOCN Approval file. License files are mandatory.",
    path: ["eocnApprovalFile"],
  }
).refine(
  (data) => {
    // If itar is selected, itarRegistrationFile is required
    if (data.licenses?.includes("itar")) {
      return data.itarRegistrationFile !== undefined && data.itarRegistrationFile instanceof File;
    }
    return true;
  },
  {
    message: "Please upload ITAR Registration file. License files are mandatory.",
    path: ["itarRegistrationFile"],
  }
).refine(
  (data) => {
    // If local is selected, localAuthorityApprovalFile is required
    if (data.licenses?.includes("local")) {
      return data.localAuthorityApprovalFile !== undefined && data.localAuthorityApprovalFile instanceof File;
    }
    return true;
  },
  {
    message: "Please upload Local approval from authorities file. License files are mandatory.",
    path: ["localAuthorityApprovalFile"],
  }
);

type DeclarationFormValues = z.infer<typeof declarationSchema>;



const licenseOptions = [
  { value: "authority_license", label: "Authority License" },
  { value: "eocn", label: "EOCN Approval" },
  { value: "itar", label: "ITAR Registration" },
  { value: "local", label: "Local approval from authorities" },
];

// License type to file field mapping
const LICENSE_TO_FILE_FIELD: Record<string, string> = {
  "authority_license": "modLicenseFile",
  "eocn": "eocnApprovalFile",
  "itar": "itarRegistrationFile",
  "local": "localAuthorityApprovalFile",
};


export default function DeclarationPage() {
  const router = useRouter();
  const step3Mutation = useOnboardingStep3();

  // Fetch all data - single loading state
  const { data: natureOfBusinessOptions = [], isLoading: isNatureOfBusinessLoading } = useNatureOfBusiness();
  const { data: endUseMarketOptions = [], isLoading: isEndUseMarketsLoading } = useEndUseMarkets();
  const { data: countryOptions = [], isLoading: isCountriesLoading } = useCountries();
  const { data: profileData, isLoading: isProfileLoading } = useOnboardingProfile();

  // Single combined loading state
  const isLoading = isNatureOfBusinessLoading || isEndUseMarketsLoading || isCountriesLoading;

  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      natureOfBusiness: [],
      controlledItems: "no",
      manufacturingSourceName: "",
      endUseMarket: [],
      licenses: [],
      operatingCountries: [],
      countryInput: "",
      onSanctionsList: "no",
      businessLicenseFile: undefined,
      companyProfileFile: undefined,
      modLicenseFile: undefined,
      eocnApprovalFile: undefined,
      itarRegistrationFile: undefined,
      localAuthorityApprovalFile: undefined,
      agreeToCompliance: false,
    },
  });

  // Auto-fill form when profile data is available
  useEffect(() => {
    if (profileData?.profile && !isProfileLoading) {
      const p = profileData.profile;

      // Ensure natureOfBusiness is parsed correctly (handle PG array string format if needed)
      let natureOfBusiness: string[] = [];
      const rawNob = p.nature_of_business;

      if (Array.isArray(rawNob)) {
        natureOfBusiness = rawNob;
      } else if (typeof rawNob === 'string') {
        // Handle Postgres array string format: {"Item 1","Item 2"}
        if (rawNob.startsWith('{') && rawNob.endsWith('}')) {
          natureOfBusiness = rawNob
            .slice(1, -1) // Remove { }
            .split(',') // Split by comma
            // Process each item: remove wrapping quotes if present
            .map((s: string) => {
              const trimmed = s.trim();
              if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                return trimmed.slice(1, -1);
              }
              return trimmed;
            })
            // Filter empty
            .filter((s: string) => s.length > 0);
        } else {
          // Single string item
          natureOfBusiness = [rawNob];
        }
      }

      // Ensure arrays are arrays for other fields (using safer fallback)
      const endUseMarkets = Array.isArray(p.end_use_markets) ? p.end_use_markets : [];
      const licenseTypes = Array.isArray(p.license_types) ? p.license_types : [];
      const operatingCountries = Array.isArray(p.operating_countries) ? p.operating_countries : [];

      console.log("Pre-filling Nature of Business:", natureOfBusiness);

      form.reset({
        natureOfBusiness: natureOfBusiness,
        controlledItems: p.controlled_items ? "yes" : "no",
        manufacturingSourceName: p.manufacturing_source_name || "",
        endUseMarket: endUseMarkets,
        licenses: licenseTypes,
        operatingCountries: operatingCountries,
        countryInput: "",
        onSanctionsList: p.is_on_sanctions_list ? "yes" : "no",
        agreeToCompliance: p.compliance_terms_accepted || false,
      });

      // Handle file previews if URLs exist (rest of Logic same as before)
      if (p.business_license_url) {
        setBusinessLicensePreview(p.business_license_url);
        const isPdf = p.business_license_url.toLowerCase().endsWith('.pdf');
        setBusinessLicenseFileType(isPdf ? 'pdf' : 'image');
        // Dummy file
        form.setValue("businessLicenseFile", new File([""], "existing_file", { type: isPdf ? "application/pdf" : "image/jpeg" }));
      }

      if (p.company_profile_url) {
        setCompanyProfilePreview(p.company_profile_url);
        const isPdf = p.company_profile_url.toLowerCase().endsWith('.pdf');
        setCompanyProfileFileType(isPdf ? 'pdf' : 'image');
        // Dummy file
        form.setValue("companyProfileFile", new File([""], "existing_file", { type: isPdf ? "application/pdf" : "image/jpeg" }));
      }

      // Handle license files
      const licenseUrlMap: Record<string, string | undefined> = {
        "authority_license": p.defense_approval_url,
        "eocn": p.eocn_approval_url,
        "itar": p.itar_registration_url,
        "local": p.local_authority_approval_url
      };

      Object.entries(licenseUrlMap).forEach(([licenseType, url]) => {
        if (url && p.license_types?.includes(licenseType)) {
          setLicensePreviews(prev => ({ ...prev, [licenseType]: url }));
          const isPdf = url.toLowerCase().endsWith('.pdf');
          setLicenseFileTypes(prev => ({ ...prev, [licenseType]: isPdf ? 'pdf' : 'image' }));

          const fileFieldName = LICENSE_TO_FILE_FIELD[licenseType] as keyof DeclarationFormValues;
          if (fileFieldName) {
            form.setValue(fileFieldName, new File([""], "existing_file", { type: isPdf ? "application/pdf" : "image/jpeg" }));
          }
        }
      });

    }
  }, [profileData, isProfileLoading, form]);

  const onSubmit = async (data: DeclarationFormValues) => {
    try {
      // Helper to upload file (Same logic)
      const uploadFile = async (file: File | undefined, previewUrl: string | null, label: string): Promise<string | undefined> => {
        if (!file) return undefined;
        // If it's a dummy existing file, return the preview URL (which is the actual URL)
        if (file.name === "existing_file" && previewUrl) {
          return previewUrl;
        }
        // New upload
        const uploadData = new FormData();
        uploadData.append("files", file);
        uploadData.append("label", label); // Generic label or specific?

        // Use centralized API instance to ensure proper token handling (401 fix)
        const uploadRes = await api.post('/upload/files', uploadData);
        if (uploadRes.status !== 200 && uploadRes.status !== 201) throw new Error("File upload failed");

        const uploadJson = uploadRes.data;

        if (uploadJson.status && uploadJson.data && uploadJson.data.length > 0) {
          return uploadJson.data[0];
        }
        return undefined;
      };

      // Upload all files concurrently
      const [
        businessLicenseUrl,
        companyProfileUrl,
        modLicenseUrl,
        eocnApprovalUrl,
        itarRegistrationUrl,
        localAuthorityApprovalUrl
      ] = await Promise.all([
        uploadFile(data.businessLicenseFile, businessLicensePreview, "CUSTOMER_BUSINESS_LICENSE"),
        uploadFile(data.companyProfileFile, companyProfilePreview, "COMPANY_PROFILE"),
        uploadFile(data.modLicenseFile, licensePreviews['authority_license'] || null, "MOD_LICENSE"),
        uploadFile(data.eocnApprovalFile, licensePreviews['eocn'] || null, "EOCN_APPROVAL"),
        uploadFile(data.itarRegistrationFile, licensePreviews['itar'] || null, "ITAR_REGISTRATION"),
        uploadFile(data.localAuthorityApprovalFile, licensePreviews['local'] || null, "LOCAL_AUTHORITY_APPROVAL"),
      ]);

      // Map form data to API schema
      const payload = {
        natureOfBusiness: data.natureOfBusiness,
        controlledItems: data.controlledItems === "yes", // Map to boolean
        manufacturingSourceName: data.manufacturingSourceName || undefined,
        licenseTypes: data.licenses || [],
        endUseMarkets: data.endUseMarket || [],
        operatingCountries: data.operatingCountries,
        isOnSanctionsList: data.onSanctionsList === "yes",
        complianceTermsAccepted: data.agreeToCompliance === true,

        businessLicenseUrl,
        companyProfileUrl,
        modLicenseUrl,
        eocnApprovalUrl,
        itarRegistrationUrl,
        localAuthorityApprovalUrl
      };

      await step3Mutation.mutateAsync(payload);

      toast.success("Declaration information saved successfully");
      router.push("/vendor/account-preferences");
    } catch (error) {
      console.error(error);
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to save declaration information. Please try again.";
      toast.error(errorMessage);
    }
  };

  const selectedNatureOfBusiness = form.watch("natureOfBusiness");
  const selectedEndUseMarket = form.watch("endUseMarket") || [];
  const selectedLicenses = form.watch("licenses") || [];
  const selectedCountries = form.watch("operatingCountries");

  // Handlers and helper functions (kept same)
  const handleRemoveNatureOfBusiness = (item: string) => {
    const current = form.getValues("natureOfBusiness");
    form.setValue(
      "natureOfBusiness",
      current.filter((i) => i !== item)
    );
  };

  const handleRemoveEndUseMarket = (item: string) => {
    const current = form.getValues("endUseMarket") || [];
    form.setValue(
      "endUseMarket",
      current.filter((i) => i !== item)
    );
  };

  const handleRemoveLicense = (item: string) => {
    const current = form.getValues("licenses") || [];
    form.setValue(
      "licenses",
      current.filter((i) => i !== item)
    );
  };

  const handleRemoveCountry = (countryName: string) => {
    const current = form.getValues("operatingCountries");
    form.setValue(
      "operatingCountries",
      current.filter((c) => c !== countryName)
    );
  };

  const filteredCountries = countryOptions.filter((country: Country) =>
    country.label.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleCountryCheckboxChange = (
    countryName: string,
    checked: boolean
  ) => {
    const current = form.getValues("operatingCountries");
    if (checked) {
      if (!current.includes(countryName)) {
        form.setValue("operatingCountries", [...current, countryName]);
      }
    } else {
      form.setValue(
        "operatingCountries",
        current.filter((c) => c !== countryName)
      );
    }
  };

  // ... (Other handlers like file upload kept same, will be available in full file) ...
  // File upload refs and previews code...
  const businessLicenseRef = useRef<HTMLInputElement>(null);
  const companyProfileRef = useRef<HTMLInputElement>(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null);
  const [companyProfilePreview, setCompanyProfilePreview] = useState<string | null>(null);
  const [businessLicenseFileType, setBusinessLicenseFileType] = useState<'image' | 'pdf' | null>(null);
  const [companyProfileFileType, setCompanyProfileFileType] = useState<'image' | 'pdf' | null>(null);
  const licenseFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [licensePreviews, setLicensePreviews] = useState<Record<string, string | null>>({});
  const [licenseFileTypes, setLicenseFileTypes] = useState<Record<string, 'image' | 'pdf' | null>>({});

  // Handle file selection for business license
  const handleBusinessLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        form.setValue("businessLicenseFile", file, { shouldValidate: true });
        setBusinessLicenseFileType('image');
        const reader = new FileReader();
        reader.onload = (e) => {
          setBusinessLicensePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        form.setValue("businessLicenseFile", file, { shouldValidate: true });
        setBusinessLicenseFileType('pdf');
        const reader = new FileReader();
        reader.onload = (e) => {
          setBusinessLicensePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove business license
  const handleRemoveBusinessLicense = () => {
    form.setValue("businessLicenseFile", undefined, { shouldValidate: true });
    setBusinessLicensePreview(null);
    setBusinessLicenseFileType(null);
    if (businessLicenseRef.current) {
      businessLicenseRef.current.value = "";
    }
  };

  // Handle file selection for company profile
  const handleCompanyProfileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        form.setValue("companyProfileFile", file, { shouldValidate: true });
        setCompanyProfileFileType('image');
        const reader = new FileReader();
        reader.onload = (e) => {
          setCompanyProfilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        form.setValue("companyProfileFile", file, { shouldValidate: true });
        setCompanyProfileFileType('pdf');
        const reader = new FileReader();
        reader.onload = (e) => {
          setCompanyProfilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove company profile
  const handleRemoveCompanyProfile = () => {
    form.setValue("companyProfileFile", undefined, { shouldValidate: true });
    setCompanyProfilePreview(null);
    setCompanyProfileFileType(null);
    if (companyProfileRef.current) {
      companyProfileRef.current.value = "";
    }
  };

  // Handle license file selection
  const handleLicenseFileSelect = (licenseValue: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileFieldName = LICENSE_TO_FILE_FIELD[licenseValue] as keyof DeclarationFormValues;
      if (file.type.startsWith("image/")) {
        if (fileFieldName) {
          form.setValue(fileFieldName, file, { shouldValidate: true });
          setLicenseFileTypes(prev => ({ ...prev, [licenseValue]: 'image' }));
          const reader = new FileReader();
          reader.onload = (e) => {
            setLicensePreviews(prev => ({ ...prev, [licenseValue]: e.target?.result as string }));
          };
          reader.readAsDataURL(file);
        }
      } else if (file.type === "application/pdf") {
        if (fileFieldName) {
          form.setValue(fileFieldName, file, { shouldValidate: true });
          setLicenseFileTypes(prev => ({ ...prev, [licenseValue]: 'pdf' }));
          const reader = new FileReader();
          reader.onload = (e) => {
            setLicensePreviews(prev => ({ ...prev, [licenseValue]: e.target?.result as string }));
          };
          reader.readAsDataURL(file);
        }
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove license file
  const handleRemoveLicenseFile = (licenseValue: string) => {
    const fileFieldName = LICENSE_TO_FILE_FIELD[licenseValue] as keyof DeclarationFormValues;
    if (fileFieldName) {
      form.setValue(fileFieldName, undefined, { shouldValidate: true });
      setLicensePreviews(prev => {
        const { [licenseValue]: removed, ...rest } = prev;
        return rest;
      });
      setLicenseFileTypes(prev => {
        const { [licenseValue]: removed, ...rest } = prev;
        return rest;
      });
      if (licenseFileRefs.current[licenseValue]) {
        licenseFileRefs.current[licenseValue]!.value = "";
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.country-dropdown-container')) {
        setIsCountryDropdownOpen(false);
      }
    };

    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isCountryDropdownOpen]);

  return (
    <div className="min-h-screen bg-bg-medium flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl">
        {/* Progress Bar */}
        <OnboardingProgressBar currentStep={3} />

        {/* COMPLIANCE & ACTIVITY DECLARATION Heading */}
        <div>
          <h2 className="text-2xl pb-3 font-bold text-black uppercase font-heading">
            COMPLIANCE & ACTIVITY DECLARATION
          </h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Nature of Business - Separate Container */}
            <div className="space-y-3 bg-bg-light p-6">
              <FormLabel className="text-sm font-bold text-black">
                Nature of Business:
              </FormLabel>

              {/* Input Field with Tags and Count */}
              <div className="relative">
                <div className="min-h-[44px] bg-bg-medium border border-gray-300 p-2 pr-12 flex flex-wrap items-center gap-2">
                  {/* Selected Tags */}
                  {selectedNatureOfBusiness.length > 0 && (
                    <>
                      {selectedNatureOfBusiness.map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-1.5 bg-bg-light border border-border px-3 py-1.5"
                        >
                          <span className="text-sm text-black">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNatureOfBusiness(item)}
                            className="hover:opacity-70 transition-opacity p-0.5 flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5 text-border" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {/* Count Badge */}
                {selectedNatureOfBusiness.length > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-light border border-border w-8 h-8 flex items-center justify-center">
                    <span className="text-sm font-medium text-black">
                      {selectedNatureOfBusiness.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Checkboxes Grid */}
              <FormField
                control={form.control}
                name="natureOfBusiness"
                render={() => (
                  <FormItem>
                    {isLoading ? (
                      <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {natureOfBusinessOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name="natureOfBusiness"
                            render={({ field }) => {
                              // Ensure explicit checkbox handling
                              const isChecked = field.value?.includes(option.name);
                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option.name])
                                          : field.onChange(field.value?.filter((value) => value !== option.name));
                                      }}
                                      className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal text-black cursor-pointer">
                                    {option.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Controlled Items, End-Use Market, Licenses - Separate Light Container */}
            <div className="bg-bg-light p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-28">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Controlled Items */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="controlledItems"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-black">
                            Do you plan to sell any controlled products?
                          </FormLabel>
                          <FormControl>
                            <Select
                              placeholder="Select Yes / No"
                              {...field}
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Licenses - Moved from Right Column */}
                  {form.watch("controlledItems") === "yes" && (
                    <div className="space-y-4">
                      <FormLabel className="text-sm font-bold text-black">
                        Do you hold any of the following licenses?
                      </FormLabel>

                      {/* Input Field with Tags and Count */}
                      <div className="relative">
                        <div className="min-h-[44px] bg-bg-medium border border-border p-2 pr-12 flex flex-wrap items-center gap-2">
                          {/* Selected Tags */}
                          {selectedLicenses.length > 0 && (
                            <>
                              {selectedLicenses.map((licenseValue) => {
                                const license = licenseOptions.find(
                                  (l) => l.value === licenseValue
                                );
                                if (!license) return null;
                                return (
                                  <div
                                    key={licenseValue}
                                    className="flex items-center gap-1.5 bg-bg-light border border-border px-3 py-1.5"
                                  >
                                    <span className="text-sm text-black">
                                      {license.label}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLicense(licenseValue)}
                                      className="hover:opacity-70 transition-opacity p-0.5 flex-shrink-0"
                                    >
                                      <X className="w-3.5 h-3.5 text-border" />
                                    </button>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                        {/* Count Badge */}
                        {selectedLicenses.length > 0 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-light border border-border w-8 h-8 flex items-center justify-center">
                            <span className="text-sm font-medium text-black">
                              {selectedLicenses.length}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Checkboxes Grid */}
                      <FormField
                        control={form.control}
                        name="licenses"
                        render={() => (
                          <FormItem>
                            <div className="flex flex-wrap gap-4">
                              {licenseOptions.map((option) => (
                                <FormField
                                  key={option.value}
                                  control={form.control}
                                  name="licenses"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={option.value}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(option.value)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([
                                                  ...(field.value || []),
                                                  option.value,
                                                ])
                                                : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== option.value
                                                  )
                                                );
                                            }}
                                            className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal text-black cursor-pointer">
                                          {option.label}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Name of Manufacturing Source (Moved to top) */}
                  {form.watch("controlledItems") === "yes" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="manufacturingSourceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-black">
                              Name of Manufacturing Source (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Blueweb Auto Industries LLC"
                                className="bg-bg-medium border border-border h-11 focus:border-border focus:ring-1 focus:ring-border rounded-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* End-Use Market - Moved from Left Column */}
                  {form.watch("controlledItems") === "yes" && (
                    <div className="space-y-4">
                      <FormLabel className="text-sm font-bold text-black">
                        End-Use Market:
                      </FormLabel>

                      {/* Input Field with Tags and Count */}
                      <div className="relative">
                        <div className="min-h-[44px] bg-bg-medium border border-border p-2 pr-12 flex flex-wrap items-center gap-2">
                          {/* Selected Tags */}
                          {selectedEndUseMarket.length > 0 && (
                            <>
                              {selectedEndUseMarket.map((item) => (
                                <div
                                  key={item}
                                  className="flex items-center gap-1.5 bg-bg-light border border-border px-3 py-1.5"
                                >
                                  <span className="text-sm text-black">
                                    {item}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEndUseMarket(item)}
                                    className="hover:opacity-70 transition-opacity p-0.5 flex-shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5 text-border" />
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                        {/* Count Badge */}
                        {selectedEndUseMarket.length > 0 && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-light border border-border w-8 h-8 flex items-center justify-center">
                            <span className="text-sm font-medium text-black">
                              {selectedEndUseMarket.length}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Checkboxes */}
                      <FormField
                        control={form.control}
                        name="endUseMarket"
                        render={() => (
                          <FormItem>
                            {isLoading ? (
                              <div className="text-sm text-gray-500">Loading...</div>
                            ) : (
                              <div className="flex flex-wrap gap-4">
                                {endUseMarketOptions.map((option) => (
                                  <FormField
                                    key={option.id}
                                    control={form.control}
                                    name="endUseMarket"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={option.id}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(
                                                option.name
                                              )}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([
                                                    ...(field.value || []),
                                                    option.name,
                                                  ])
                                                  : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== option.name
                                                    )
                                                  );
                                              }}
                                              className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal text-black cursor-pointer">
                                            {option.name}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Countries Section - Separate Light Container */}
            <div className="bg-bg-light p-6">
              <div className="space-y-4">
                <FormLabel className="text-sm font-bold text-black">
                  Countries you operate in or export to:
                </FormLabel>

                <FormField
                  control={form.control}
                  name="operatingCountries"
                  render={() => (
                    <FormItem>
                      {/* Input Field with Tags and Dropdown */}
                      <div className="relative country-dropdown-container">
                        <div
                          className="min-h-[44px] bg-bg-medium border border-border p-2 pr-12 flex flex-wrap items-center gap-2 cursor-text"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        >
                          {/* Selected Tags */}
                          {selectedCountries.length > 0 ? (
                            <>
                              {selectedCountries.map((countryName) => {
                                const country = countryOptions.find(
                                  (c: Country) => c.label === countryName
                                );
                                if (!country) return null;
                                return (
                                  <div
                                    key={countryName}
                                    className="flex items-center gap-1.5 bg-bg-light border border-border px-3 py-1.5 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-lg">{country.flag}</span>
                                    <span className="text-sm text-black">
                                      {country.label}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveCountry(countryName);
                                      }}
                                      className="hover:opacity-70 transition-opacity p-0.5 shrink-0"
                                    >
                                      <X className="w-3.5 h-3.5 text-border" />
                                    </button>
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Select countries...
                            </span>
                          )}
                        </div>

                        {/* Dropdown Arrow */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {selectedCountries.length > 0 && (
                            <div className="bg-bg-light border border-border w-8 h-8 flex items-center justify-center rounded">
                              <span className="text-sm font-medium text-black">
                                {selectedCountries.length}
                              </span>
                            </div>
                          )}
                          <ChevronDown
                            className={`h-5 w-5 text-gray-400 transition-transform ${isCountryDropdownOpen ? "rotate-180" : ""
                              }`}
                          />
                        </div>

                        {/* Dropdown Menu */}
                        {isCountryDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-border shadow-lg rounded-md flex flex-col">
                            {/* Search Input */}
                            <div className="p-3 border-b border-border bg-white">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  type="text"
                                  placeholder="Search countries..."
                                  value={countrySearch}
                                  onChange={(e) => {
                                    setCountrySearch(e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="pl-9 h-9 bg-bg-medium border-border"
                                />
                              </div>
                            </div>

                            {/* Countries List - Show 5 items with scrolling */}
                            <div className="overflow-y-auto p-2" style={{ maxHeight: '200px' }}>
                              {isLoading ? (
                                <div className="text-sm text-gray-500 p-4 text-center">
                                  Loading countries...
                                </div>
                              ) : filteredCountries.length === 0 ? (
                                <div className="text-sm text-gray-500 p-4 text-center">
                                  No countries found
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {(countrySearch
                                    ? filteredCountries
                                    : countryOptions
                                  ).map((country: Country) => {
                                    const isSelected = selectedCountries.includes(
                                      country.label
                                    );
                                    return (
                                      <label
                                        key={country.value}
                                        className="flex items-center gap-3 p-2 hover:bg-bg-medium rounded cursor-pointer transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            handleCountryCheckboxChange(
                                              country.label,
                                              checked as boolean
                                            );
                                          }}
                                          className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                                        />
                                        <span className="text-lg">{country.flag}</span>
                                        <span className="text-sm font-medium text-black flex-1">
                                          {country.label}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Continue in original container */}
            <div className="bg-bg-light p-6">
              {/* Sanctions/Watchlists */}
              <div className="space-y-4 mb-8">
                <FormField
                  control={form.control}
                  name="onSanctionsList"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black">
                        Are you or your company on any international sanctions
                        or watchlists?
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-6">
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ].map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2"
                            >
                              <label
                                htmlFor={`sanctions-${option.value}`}
                                className="relative flex items-center cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  id={`sanctions-${option.value}`}
                                  name="onSanctionsList"
                                  value={option.value}
                                  checked={field.value === option.value}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange(option.value);
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <span
                                  className={`h-4 w-4 rounded-full border border-border bg-bg-light flex items-center justify-center ${field.value === option.value
                                    ? "border-border"
                                    : ""
                                    }`}
                                >
                                  {field.value === option.value && (
                                    <span className="h-2 w-2 rounded-full bg-border"></span>
                                  )}
                                </span>
                              </label>
                              <label
                                htmlFor={`sanctions-${option.value}`}
                                className="text-sm font-medium leading-none cursor-pointer text-black"
                              >
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* File Uploads */}
              <div className="space-y-6 mb-8">
                {/* Business License and Company Profile - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business License */}
                  <FormField
                    control={form.control}
                    name="businessLicenseFile"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Upload Business License{" "}
                          <span className="text-red-500">*</span>
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              ref={businessLicenseRef}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,application/pdf"
                              onChange={handleBusinessLicenseSelect}
                              className="hidden"
                            />
                            {businessLicensePreview ? (
                              <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-bg-medium">
                                {businessLicenseFileType === 'image' ? (
                                  <img
                                    src={businessLicensePreview}
                                    alt="Business License Preview"
                                    className="w-full h-64 object-contain"
                                  />
                                ) : businessLicenseFileType === 'pdf' ? (
                                  <PDFViewer file={businessLicensePreview} />
                                ) : null}
                                <button
                                  type="button"
                                  onClick={handleRemoveBusinessLicense}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                  aria-label="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => businessLicenseRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 p-6 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors"
                              >
                                <Upload className="w-10 h-10 text-secondary mb-3" />
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Choose a File
                                </p>
                                <p className="text-xs text-gray-500 text-center max-w-md">
                                  Accepted files: JPEG, PNG and PDF.
                                </p>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company Profile */}
                  <FormField
                    control={form.control}
                    name="companyProfileFile"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Upload Company Profile / Product Catalog (Recommended)
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              ref={companyProfileRef}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,application/pdf"
                              onChange={handleCompanyProfileSelect}
                              className="hidden"
                            />
                            {companyProfilePreview ? (
                              <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-bg-medium">
                                {companyProfileFileType === 'image' ? (
                                  <img
                                    src={companyProfilePreview}
                                    alt="Company Profile Preview"
                                    className="w-full h-64 object-contain"
                                  />
                                ) : companyProfileFileType === 'pdf' ? (
                                  <PDFViewer file={companyProfilePreview} />
                                ) : null}
                                <button
                                  type="button"
                                  onClick={handleRemoveCompanyProfile}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                  aria-label="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => companyProfileRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 p-6 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors"
                              >
                                <Upload className="w-10 h-10 text-secondary mb-3" />
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Choose a File
                                </p>
                                <p className="text-xs text-gray-500 text-center max-w-md">
                                  Accepted files: JPEG, PNG and PDF.
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

                {/* License Files - Show upload for each selected license in 2 columns */}
                {selectedLicenses.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {selectedLicenses.map((licenseValue) => {
                          const license = licenseOptions.find((l) => l.value === licenseValue);
                          if (!license || licenseValue === "none") return null;
                          const fileFieldName = LICENSE_TO_FILE_FIELD[licenseValue] as keyof DeclarationFormValues;
                          if (!fileFieldName) return null;
                          const preview = licensePreviews[licenseValue];
                          return (
                            <FormField
                              key={licenseValue}
                              control={form.control}
                              name={fileFieldName}
                              render={() => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                                    Upload {license.label}{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <div className="space-y-2">
                                      <input
                                        ref={(el) => {
                                          licenseFileRefs.current[licenseValue] = el;
                                        }}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                                        onChange={(e) => handleLicenseFileSelect(licenseValue, e)}
                                        className="hidden"
                                      />
                                      {preview ? (
                                        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-bg-medium">
                                          {licenseFileTypes[licenseValue] === 'image' ? (
                                            <img
                                              src={preview}
                                              alt={`${license.label} Preview`}
                                              className="w-full h-64 object-contain"
                                            />
                                          ) : licenseFileTypes[licenseValue] === 'pdf' ? (
                                            <PDFViewer file={preview} />
                                          ) : null}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveLicenseFile(licenseValue)}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                            aria-label="Remove file"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div
                                          onClick={() => licenseFileRefs.current[licenseValue]?.click()}
                                          className="border-2 border-dashed border-gray-300 p-6 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors"
                                        >
                                          <Upload className="w-10 h-10 text-secondary mb-3" />
                                          <p className="text-sm font-medium text-gray-700 mb-1">
                                            Choose a File
                                          </p>
                                          <p className="text-xs text-gray-500 text-center max-w-md">
                                            Accepted files: JPEG, PNG and PDF.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Terms - Separate Light Container */}
            <div className="bg-bg-light p-6 shadow-lg">
              <div className="space-y-4">
                <div className="text-sm font-normal text-black">
                  Agree to Compliance Terms
                </div>
                <FormField
                  control={form.control}
                  name="agreeToCompliance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal text-black cursor-pointer">
                          I acknowledge that all transactions are subject to UAE
                          and international laws and may be screened, paused, or
                          reported in accordance with ArmoredMart&apos;s regulatory
                          obligations.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8 pb-8">
              <Button
                type="button"
                variant="secondary"
                className="bg-bg-light text-black hover:bg-primary/70 hover:text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/contact-person")}
              >
                Previous
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={step3Mutation.isPending}
                className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step3Mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-white" />
                    SUBMITTING...
                  </span>
                ) : (
                  "NEXT"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
