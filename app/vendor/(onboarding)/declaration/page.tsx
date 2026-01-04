"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Info, X, ChevronDown, Search, Upload } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect, useRef } from "react";
import { useNatureOfBusiness } from "@/hooks/vendor/dashboard/use-nature-of-business";
import { useEndUseMarkets } from "@/hooks/vendor/dashboard/use-end-use-markets";
import { useCountries, type Country } from "@/hooks/vendor/dashboard/use-countries";
import { useOnboardingStep3 } from "@/hooks/vendor/dashboard/use-onboarding-step3";

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

const declarationSchema = z.object({
  natureOfBusiness: z
    .array(z.string())
    .min(1, "Please select at least one nature of business"),
  controlledDualUseItems: z.string().optional(),
  endUseMarket: z
    .array(z.string())
    .min(1, "Please select at least one end-use market"),
  licenses: z.array(z.string()).min(1, "Please select at least one license type. License files are mandatory."),
  operatingCountries: z
    .array(z.string())
    .min(1, "Please select at least one country"),
  countryInput: z.string().optional(),
  onSanctionsList: z.enum(["yes", "no"]),
  businessLicense: z.any().refine((file) => file !== undefined && file instanceof File, {
    message: "Business License is required",
  }),
  companyProfile: z.any().optional(),
  licenseFiles: z.record(z.string(), z.any()).optional(),
  agreeToCompliance: z.boolean().refine((val) => val === true, {
    message: "You must agree to the compliance terms",
  }),
}).refine(
  (data) => {
    // If licenses are selected, all must have files
    if (data.licenses && data.licenses.length > 0) {
      const licenseFiles = data.licenseFiles || {};
      return data.licenses.every(
        (license) => licenseFiles[license] && licenseFiles[license] instanceof File
      );
    }
    return true;
  },
  {
    message: "Please upload files for all selected licenses. License files are mandatory.",
    path: ["licenseFiles"], // This will show the error on the licenseFiles field
  }
);

type DeclarationFormValues = z.infer<typeof declarationSchema>;



const licenseOptions = [
  { value: "authority_license", label: "Authority License" },
  { value: "eocn", label: "EOCN Approval" },
  { value: "itar", label: "ITAR Registration" },
  { value: "local", label: "Local approval from authorities" },
  { value: "none", label: "None" },
];


export default function DeclarationPage() {
  const router = useRouter();
  const step3Mutation = useOnboardingStep3();
  
  // Fetch all data - single loading state
  const { data: natureOfBusinessOptions = [], isLoading: isNatureOfBusinessLoading } = useNatureOfBusiness();
  const { data: endUseMarketOptions = [], isLoading: isEndUseMarketsLoading } = useEndUseMarkets();
  const { data: countryOptions = [], isLoading: isCountriesLoading } = useCountries();
  
  // Single combined loading state
  const isLoading = isNatureOfBusinessLoading || isEndUseMarketsLoading || isCountriesLoading;
  
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      natureOfBusiness: [],
      controlledDualUseItems: "",
      endUseMarket: [],
      licenses: [],
      operatingCountries: [],
      countryInput: "",
      onSanctionsList: "no",
      businessLicense: undefined,
      companyProfile: undefined,
      licenseFiles: {},
      agreeToCompliance: false,
    },
  });

  const onSubmit = async (data: DeclarationFormValues) => {
    try {
      // Map form data to API schema
      const payload = {
        natureOfBusiness: data.natureOfBusiness,
        controlledDualUseItems: data.controlledDualUseItems || "",
        licenseTypes: data.licenses,
        endUseMarkets: data.endUseMarket,
        operatingCountries: data.operatingCountries,
        isOnSanctionsList: data.onSanctionsList === "yes",
        businessLicenseUrl: "demo", // Backend will handle file upload and generate URL
        defenseApprovalUrl: "demo", // This field was removed from the form
        companyProfileUrl: "demo", // Backend will handle file upload and generate URL
        complianceTermsAccepted: data.agreeToCompliance === true, // Ensure it's explicitly true
        businessLicense: data.businessLicense instanceof File ? data.businessLicense : undefined,
        companyProfile: data.companyProfile instanceof File ? data.companyProfile : undefined,
        licenseFiles: data.licenseFiles || {},
      };
      
      await step3Mutation.mutateAsync(payload);
      
      toast.success("Declaration information saved successfully");
      router.push("/vendor/account-preferences");
    } catch (error) {
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
  const selectedEndUseMarket = form.watch("endUseMarket");
  const selectedLicenses = form.watch("licenses");
  const selectedCountries = form.watch("operatingCountries");

  const handleRemoveNatureOfBusiness = (item: string) => {
    const current = form.getValues("natureOfBusiness");
    form.setValue(
      "natureOfBusiness",
      current.filter((i) => i !== item)
    );
  };

  const handleRemoveEndUseMarket = (item: string) => {
    const current = form.getValues("endUseMarket");
    form.setValue(
      "endUseMarket",
      current.filter((i) => i !== item)
    );
  };

  const handleRemoveLicense = (item: string) => {
    const current = form.getValues("licenses");
    form.setValue(
      "licenses",
      current.filter((i) => i !== item)
    );
  };

  const handleRemoveCountry = (countryValue: string) => {
    const current = form.getValues("operatingCountries");
    form.setValue(
      "operatingCountries",
      current.filter((c) => c !== countryValue)
    );
  };

  const filteredCountries = countryOptions.filter((country: Country) =>
    country.label.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleCountryCheckboxChange = (
    countryValue: string,
    checked: boolean
  ) => {
    const current = form.getValues("operatingCountries");
    if (checked) {
      if (!current.includes(countryValue)) {
        form.setValue("operatingCountries", [...current, countryValue]);
      }
    } else {
      form.setValue(
        "operatingCountries",
        current.filter((c) => c !== countryValue)
      );
    }
  };

  // File upload refs and previews
  const businessLicenseRef = useRef<HTMLInputElement>(null);
  const companyProfileRef = useRef<HTMLInputElement>(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null);
  const [companyProfilePreview, setCompanyProfilePreview] = useState<string | null>(null);
  const licenseFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [licensePreviews, setLicensePreviews] = useState<Record<string, string | null>>({});

  // Handle file selection for business license
  const handleBusinessLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        form.setValue("businessLicense", file, { shouldValidate: true });
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setBusinessLicensePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setBusinessLicensePreview(null);
        }
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove business license
  const handleRemoveBusinessLicense = () => {
    form.setValue("businessLicense", undefined, { shouldValidate: true });
    setBusinessLicensePreview(null);
    if (businessLicenseRef.current) {
      businessLicenseRef.current.value = "";
    }
  };

  // Handle file selection for company profile
  const handleCompanyProfileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        form.setValue("companyProfile", file, { shouldValidate: true });
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setCompanyProfilePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setCompanyProfilePreview(null);
        }
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove company profile
  const handleRemoveCompanyProfile = () => {
    form.setValue("companyProfile", undefined, { shouldValidate: true });
    setCompanyProfilePreview(null);
    if (companyProfileRef.current) {
      companyProfileRef.current.value = "";
    }
  };

  // Handle license file selection
  const handleLicenseFileSelect = (licenseValue: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        const currentFiles = form.getValues("licenseFiles") || {};
        form.setValue("licenseFiles", { ...currentFiles, [licenseValue]: file }, { shouldValidate: true });
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setLicensePreviews(prev => ({ ...prev, [licenseValue]: e.target?.result as string }));
          };
          reader.readAsDataURL(file);
        } else {
          setLicensePreviews(prev => ({ ...prev, [licenseValue]: null }));
        }
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove license file
  const handleRemoveLicenseFile = (licenseValue: string) => {
    const currentFiles = form.getValues("licenseFiles") || {};
    const { [licenseValue]: removed, ...rest } = currentFiles;
    form.setValue("licenseFiles", rest, { shouldValidate: true });
    setLicensePreviews(prev => {
      const { [licenseValue]: removed, ...rest } = prev;
      return rest;
    });
    if (licenseFileRefs.current[licenseValue]) {
      licenseFileRefs.current[licenseValue]!.value = "";
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
        <div className="mb-8">
          <div className="relative">
            {/* Horizontal connecting line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border"></div>

            {/* Steps Container */}
            <div className="relative flex items-start justify-between w-full">
              {/* Step 1: Company Information */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Company Information
                </span>
              </div>

              {/* Step 2: Contact Person */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Contact Person
                </span>
              </div>

              {/* Step 3: Declaration */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Declaration
                </span>
              </div>

              {/* Step 4: Account Preferences */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-bg-light border-2 border-border flex items-center justify-center relative z-10">
                  <span className="text-black text-sm font-bold">4</span>
                </div>
                <span className="text-sm font-medium text-black mt-2 text-center leading-tight">
                  Account Preferences
                </span>
              </div>

              {/* Step 5: Verification */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-bg-light border-2 border-border flex items-center justify-center relative z-10">
                  <span className="text-black text-sm font-bold">5</span>
                </div>
                <span className="text-sm font-medium text-black mt-2 text-center leading-tight">
                  Verification
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COMPLIANCE & ACTIVITY DECLARATION Heading */}
        <div>
          <h2 className="text-2xl pb-3 font-bold text-black uppercase">
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
                                return (
                                  <FormItem
                                    key={option.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option.name)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...field.value,
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

            {/* Controlled/Dual Use Items, End-Use Market, Licenses - Separate Light Container */}
            <div className="bg-bg-light p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-28">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Controlled/Dual Use Items */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="controlledDualUseItems"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-black">
                            Are you dealing with any of the following
                            controlled/ dual use items? If yes, specify:
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Type here"
                              className="bg-bg-medium border border-border h-11 focus:border-border focus:ring-1 focus:ring-border rounded-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* End-Use Market */}
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
                                                    ...field.value,
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
                </div>

                {/* Right Column - Licenses */}
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
                        <div className="grid grid-cols-1 gap-3">
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
                                                ...field.value,
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
                              {selectedCountries.map((countryValue) => {
                                const country = countryOptions.find(
                                  (c: Country) => c.value === countryValue
                                );
                                if (!country) return null;
                                return (
                                  <div
                                    key={countryValue}
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
                                        handleRemoveCountry(countryValue);
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
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              isCountryDropdownOpen ? "rotate-180" : ""
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
                                      country.value
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
                                              country.value,
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
                                  className={`h-4 w-4 rounded-full border border-border bg-bg-light flex items-center justify-center ${
                                    field.value === option.value
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
                    name="businessLicense"
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
                                <img
                                  src={businessLicensePreview}
                                  alt="Business License Preview"
                                  className="w-full h-64 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveBusinessLicense}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
                    name="companyProfile"
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
                                <img
                                  src={companyProfilePreview}
                                  alt="Company Profile Preview"
                                  className="w-full h-64 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveCompanyProfile}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
                    <FormField
                      control={form.control}
                      name="licenseFiles"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-black">
                            Do you hold any of the following licenses?
                            <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedLicenses.map((licenseValue) => {
                              const license = licenseOptions.find((l) => l.value === licenseValue);
                              if (!license) return null;
                              const preview = licensePreviews[licenseValue];
                              return (
                                <FormField
                                  key={licenseValue}
                                  control={form.control}
                                  name={`licenseFiles.${licenseValue}`}
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
                                              <img
                                                src={preview}
                                                alt={`${license.label} Preview`}
                                                className="w-full h-64 object-contain"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveLicenseFile(licenseValue)}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                className="bg-bg-light text-black hover:bg-bg-medium font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/contact-person")}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                PREVIOUS
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
