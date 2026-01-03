"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Info, Upload, ChevronDown, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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
  cityOfficeAddress: z.string().min(1, "City & Office Address is required"),
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

const entityTypes = [
  { value: "manufacturer", label: "Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "trader", label: "Trader" },
  { value: "government_entity", label: "Government Entity" },
  { value: "oem_dealer", label: "OEM Dealer" },
  { value: "integrator", label: "Integrator" },
  { value: "service_provider", label: "Service Provider" },
  { value: "other", label: "Other" },
];

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
      cityOfficeAddress: "",
      officialWebsite: "",
      entityType: "",
      dunsNumber: "",
      taxVatNumber: "",
      taxIssueDate: {},
      taxExpiryDate: {},
    },
  });

  // Auto-fill company name when profile data is available
  useEffect(() => {
    if (profileData && !isProfileLoading) {
      // Auto-fill registered company name from user name
      if (
        profileData.user?.name &&
        !form.getValues("registeredCompanyName")
      ) {
        form.setValue("registeredCompanyName", profileData.user.name);
      }
    }
  }, [profileData, isProfileLoading, form]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (file.type.startsWith("image/")) {
        form.setValue("vatCertificate", file);
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file (JPEG, PNG)");
      }
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    form.setValue("vatCertificate", undefined);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: CompanyInformationFormValues) => {
    try {
      // Transform form data to API schema format
      const payload = {
        countryOfRegistration: data.countryOfRegistration,
        registeredCompanyName: data.registeredCompanyName,
        tradeBrandName: data.tradeBrandName || undefined,
        yearOfEstablishment: parseInt(data.yearOfEstablishment, 10),
        legalEntityId: data.legalEntityId,
        legalEntityIssueDate: dateObjectToISOString(data.issueDate) || "",
        legalEntityExpiryDate: dateObjectToISOString(data.expiryDate) || "",
        cityOfficeAddress: data.cityOfficeAddress,
        officialWebsite: data.officialWebsite || undefined,
        entityType: data.entityType,
        dunsNumber: data.dunsNumber || undefined,
        vatCertificate: data.vatCertificate as File | undefined,
        taxVatNumber: data.taxVatNumber || undefined,
        taxIssuingDate: data.taxIssueDate ? dateObjectToISOString(data.taxIssueDate) : undefined,
        taxExpiryDate: data.taxExpiryDate ? dateObjectToISOString(data.taxExpiryDate) : undefined,
      };

      console.log("Payload:", payload);
      console.log("File:", data.vatCertificate);

      await step1Mutation.mutateAsync(payload);
      toast.success("Company information saved successfully!");
      // Redirect to contact-person page
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

  const selectedCountry = (countries as Country[]).find(
    (c) => c.value === form.watch("countryOfRegistration")
  );

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
                <div className="w-10 h-10 rounded-full bg-bg-light border-2 border-border flex items-center justify-center relative z-10">
                  <span className="text-black text-sm font-bold">2</span>
                </div>
                <span className="text-sm font-medium text-black mt-2 text-center leading-tight">
                  Contact Person
                </span>
              </div>

              {/* Step 3: Declaration */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-bg-light border-2 border-border flex items-center justify-center relative z-10">
                  <span className="text-black text-sm font-bold">3</span>
                </div>
                <span className="text-sm font-medium text-black mt-2 text-center leading-tight">
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

        {/* COMPANY INFORMATION Heading */}
          <h2 className="text-2xl pb-3 font-bold text-black uppercase">
            COMPANY INFORMATION
          </h2>

        {/* Form Container */}
        <div className="bg-bg-light p-6 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Country of Registration - Full Width */}
                <FormField
                  control={form.control}
                  name="countryOfRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Country of Registration{" "}
                        <span className="text-red-500">*</span>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <select
                            {...field}
                            disabled={isCountriesLoading}
                            className="w-full bg-bg-medium border border-gray-300 h-11 pl-12 pr-8 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isCountriesLoading ? (
                              <option value="">Loading countries...</option>
                            ) : (
                              (countries as Country[]).map((country) => (
                                <option key={country.value} value={country.value}>
                                  {country.label}
                                </option>
                              ))
                            )}
                          </select>
                          {selectedCountry && !isCountriesLoading && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl pointer-events-none z-10">
                              {selectedCountry.flag}
                            </span>
                          )}
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Registered Company Name */}
                    <FormField
                      control={form.control}
                      name="registeredCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Registered Company Name{" "}
                            <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary pr-10"
                                {...field}
                                disabled={isProfileLoading}
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

                    {/* Year of Establishment */}
                    <FormField
                      control={form.control}
                      name="yearOfEstablishment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Year of Establishment{" "}
                            <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="eg : 1985"
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Issue Date <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <DateSelector
                              value={field.value}
                              onChange={field.onChange}
                              selectClassName="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* City & Office Address */}
                    <FormField
                      control={form.control}
                      name="cityOfficeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            City & Office Address{" "}
                            <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Office Address / Address Line"
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              {...field}
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Entity Type <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <select
                                {...field}
                                className="w-full bg-bg-medium border border-gray-300 h-11 px-4 pr-8 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
                              >
                                <option value="">Select Entity Type</option>
                                {entityTypes.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Trade/Brand Name */}
                    <FormField
                      control={form.control}
                      name="tradeBrandName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Trade/Brand Name (if different)
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Legal Entity ID / CR No{" "}
                            <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Your Trade License Number"
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              {...field}
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Expiry Date
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <DateSelector
                              value={field.value}
                              onChange={field.onChange}
                              selectClassName="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              includeFutureYears={true}
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Official Website
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="eg: www.blueweb2.com"
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              {...field}
                            />
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            DUNS Number (if applicable)
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="eg: 65-432-1987"
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

              {/* TAX INFORMATION Section */}
              <div className="space-y-6 pt-6 border-t border-gray-300">
                <h2 className="text-2xl font-bold text-black mb-6">
                  TAX INFORMATION
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - VAT Registration Certificate */}
                  <FormField
                    control={form.control}
                    name="vatCertificate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Upload VAT Registration Certificate{" "}
                          <span className="text-red-500">*</span>
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            {imagePreview ? (
                              <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-bg-medium">
                                <img
                                  src={imagePreview}
                                  alt="VAT Certificate Preview"
                                  className="w-full h-64 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  aria-label="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRef.current?.click()}
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

                  {/* Right Column - Tax/VAT Number and Dates */}
                  <div className="space-y-6">
                    {/* Tax / VAT Number */}
                    <FormField
                      control={form.control}
                      name="taxVatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Tax / VAT Number{" "}
                            <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="eg: 100123456700003"
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dates Row - Issuing Date and Expiry Date */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Issuing Date */}
                      <FormField
                        control={form.control}
                        name="taxIssueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                              Issuing Date <span className="text-red-500">*</span>
                              <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            </FormLabel>
                            <FormControl>
                            <DateSelector
                              value={field.value || {}}
                              onChange={field.onChange}
                              selectClassName="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              includeFutureYears={true}
                            />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Expiry Date */}
                      <FormField
                        control={form.control}
                        name="taxExpiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                              Expiry Date
                              <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            </FormLabel>
                            <FormControl>
                            <DateSelector
                              value={field.value || {}}
                              onChange={field.onChange}
                              selectClassName="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              includeFutureYears={true}
                            />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* NEXT Button */}
        <div className="flex justify-center mt-8 pb-8">
          <Button
            type="submit"
            variant="secondary"
            disabled={step1Mutation.isPending}
            className="text-white font-bold uppercase tracking-wide px-24 py-3 text-base shadow-lg hover:shadow-xl transition-all min-w-[300px] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              form.handleSubmit(onSubmit)();
            }}
          >
            {step1Mutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="text-white" />
                SAVING...
              </span>
            ) : (
              "NEXT"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
