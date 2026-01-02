"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Info, X, Cloud } from "lucide-react";
import { useState } from "react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const declarationSchema = z.object({
  natureOfBusiness: z
    .array(z.string())
    .min(1, "Please select at least one nature of business"),
  controlledDualUseItems: z.string().optional(),
  endUseMarket: z
    .array(z.string())
    .min(1, "Please select at least one end-use market"),
  licenses: z.string().min(1, "Please select a license type"),
  operatingCountries: z
    .array(z.string())
    .min(1, "Please select at least one country"),
  countryInput: z.string().optional(),
  onSanctionsList: z.enum(["yes", "no"]),
  businessLicense: z.any().optional(),
  defenseApproval: z.any().optional(),
  companyProfile: z.any().optional(),
  agreeToCompliance: z.boolean().refine((val) => val === true, {
    message: "You must agree to the compliance terms",
  }),
});

type DeclarationFormValues = z.infer<typeof declarationSchema>;

const natureOfBusinessOptions = [
  "Manufacturer",
  "OEM Dealer",
  "Retailer",
  "Defense Supplier",
  "Vehicle Armoring",
  "Wholesaler / Distributor",
  "E-commerce Seller",
  "Importer / Exporter",
  "Trading Company",
  "Service Provider",
  "Government Agency",
  "Contractor / Subcontractor",
  "Logistics / Freight Services",
  "Construction / Engineering",
  "Technology / IT Solutions Provider",
  "Healthcare / Medical Supplier",
  "Education / Training Provider",
  "Financial / Consulting Services",
  "Nonprofit / NGO",
  "Other",
];

const endUseMarketOptions = [
  "Civilian",
  "Military",
  "Law Enforcement",
  "Government",
  "Export",
];

const licenseOptions = [
  { value: "mod", label: "MOD License" },
  { value: "eocn", label: "EOCN Approval" },
  { value: "itar", label: "ITAR Registration" },
  { value: "local", label: "Local approval from authorities" },
  { value: "none", label: "None" },
];

const countryOptions = [
  { value: "ae", label: "United Arab Emirates (UAE)", flag: "🇦🇪" },
  { value: "sa", label: "Saudi Arabia (KSA)", flag: "🇸🇦" },
  { value: "qa", label: "Qatar", flag: "🇶🇦" },
  { value: "om", label: "Oman", flag: "🇴🇲" },
  { value: "in", label: "India", flag: "🇮🇳" },
  { value: "id", label: "Indonesia", flag: "🇮🇩" },
  { value: "ir", label: "Iran", flag: "🇮🇷" },
  { value: "iq", label: "Iraq", flag: "🇮🇶" },
  { value: "ie", label: "Ireland", flag: "🇮🇪" },
];

export default function DeclarationPage() {
  const router = useRouter();
  const [countrySearch, setCountrySearch] = useState("");

  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      natureOfBusiness: [
        "Manufacturer",
        "OEM Dealer",
        "Retailer",
        "Defense Supplier",
        "Vehicle Armoring",
      ],
      controlledDualUseItems: "",
      endUseMarket: ["Civilian", "Military"],
      licenses: "eocn",
      operatingCountries: ["ae", "sa", "qa", "om"],
      countryInput: "",
      onSanctionsList: "no",
      businessLicense: undefined,
      defenseApproval: undefined,
      companyProfile: undefined,
      agreeToCompliance: false,
    },
  });

  const onSubmit = async (data: DeclarationFormValues) => {
    try {
      console.log("Declaration data:", data);
      toast.success("Declaration information saved successfully");
      // TODO: Implement API call to save declaration information
      // Navigate to next step (Account Preferences)
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

  const handleRemoveCountry = (countryValue: string) => {
    const current = form.getValues("operatingCountries");
    form.setValue(
      "operatingCountries",
      current.filter((c) => c !== countryValue)
    );
  };

  const filteredCountries = countryOptions.filter((country) =>
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

        {/* Form Container */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-bg-light px-4 py-8 shadow-lg">
              <h2 className="text-2xl font-bold text-black mb-8">
                COMPLIANCE & ACTIVITY DECLARATION
              </h2>

              {/* Nature of Business */}
              <div className="space-y-4 mb-8">
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
                      <div className="grid grid-cols-4 gap-3">
                        {natureOfBusinessOptions.map((option) => (
                          <FormField
                            key={option}
                            control={form.control}
                            name="natureOfBusiness"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              option,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== option
                                              )
                                            );
                                      }}
                                      className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal text-black cursor-pointer">
                                    {option}
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

            {/* Controlled/Dual Use Items, End-Use Market, Licenses - Separate Light Container */}
            <div className="bg-bg-light px-4 py-8 shadow-lg">
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
                          <div className="flex flex-wrap gap-4">
                            {endUseMarketOptions.map((option) => (
                              <FormField
                                key={option}
                                control={form.control}
                                name="endUseMarket"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={option}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            option
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  option,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== option
                                                  )
                                                );
                                          }}
                                          className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal text-black cursor-pointer">
                                        {option}
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

                {/* Right Column - Licenses */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="licenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-black">
                          Do you hold any of the following licenses?
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {licenseOptions.map((option) => (
                              <div
                                key={option.value}
                                className="flex items-center space-x-2"
                              >
                                <label
                                  htmlFor={`licenses-${option.value}`}
                                  className="relative flex items-center cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    id={`licenses-${option.value}`}
                                    name="licenses"
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
                                  htmlFor={`licenses-${option.value}`}
                                  className={`text-sm font-medium leading-none cursor-pointer ${
                                    field.value === option.value
                                      ? "text-black"
                                      : "text-gray-500"
                                  }`}
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
              </div>
            </div>

            {/* Countries Section - Separate Light Container */}
            <div className="bg-bg-light px-4 py-8 shadow-lg">
              <div className="space-y-4">
                <FormLabel className="text-sm font-bold text-black">
                  Countries:
                </FormLabel>

                {/* Input Field with Tags and Count */}
                <div className="relative">
                  <div className="min-h-[44px] bg-bg-medium border border-border p-2 pr-12 flex flex-wrap items-center gap-2">
                    {/* Selected Tags */}
                    {selectedCountries.length > 0 ? (
                      <>
                        {selectedCountries.map((countryValue) => {
                          const country = countryOptions.find(
                            (c) => c.value === countryValue
                          );
                          if (!country) return null;
                          return (
                            <div
                              key={countryValue}
                              className="flex items-center gap-1.5 bg-bg-light border border-border px-3 py-1.5"
                            >
                              <span className="text-lg">{country.flag}</span>
                              <span className="text-sm text-black">
                                {country.label}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveCountry(countryValue)
                                }
                                className="hover:opacity-70 transition-opacity p-0.5 flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5 text-border" />
                              </button>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <input
                        type="text"
                        placeholder="In"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="bg-transparent border-0 outline-none text-sm text-gray-400 placeholder:text-gray-400 flex-1 min-w-[100px]"
                      />
                    )}
                  </div>
                  {/* Count Badge */}
                  {selectedCountries.length > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-light border border-border w-8 h-8 flex items-center justify-center">
                      <span className="text-sm font-medium text-black">
                        {selectedCountries.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Country Checkboxes Grid */}
                <FormField
                  control={form.control}
                  name="operatingCountries"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-4 gap-3">
                        {(countrySearch
                          ? filteredCountries
                          : countryOptions
                        ).map((country) => (
                          <div
                            key={country.value}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={selectedCountries.includes(
                                country.value
                              )}
                              onCheckedChange={(checked) =>
                                handleCountryCheckboxChange(
                                  country.value,
                                  checked as boolean
                                )
                              }
                              className="bg-bg-light border-border data-[state=checked]:bg-border data-[state=checked]:border-border rounded-none"
                            />
                            <span className="text-lg">{country.flag}</span>
                            <label className="text-sm font-medium text-black cursor-pointer">
                              {country.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Continue in original container */}
            <div className="bg-bg-light px-4 py-8 shadow-lg">
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
                {/* Two Column Layout for Business License and Defense Approval */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business License */}
                  <FormField
                    control={form.control}
                    name="businessLicense"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-black">
                          Upload Business License*
                        </FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-border p-8 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity rounded-none">
                            <Cloud className="w-10 h-10 text-border mb-3" />
                            <p className="text-sm font-medium text-black mb-1">
                              Choose a File or Drag & Drop It Here
                            </p>
                            <p className="text-xs text-gray-500 text-center max-w-md">
                              JPEG, PNG, PDF, and MP4 formats, up to 10 MB.
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Defense Approval */}
                  <FormField
                    control={form.control}
                    name="defenseApproval"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-black">
                          Upload Any Defense-Related Approval
                        </FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-border p-8 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity rounded-none">
                            <Cloud className="w-10 h-10 text-border mb-3" />
                            <p className="text-sm font-medium text-black mb-1">
                              Choose a File or Drag & Drop It Here
                            </p>
                            <p className="text-xs text-gray-500 text-center max-w-md">
                              JPEG, PNG, PDF, and MP4 formats, up to 10 MB.
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Company Profile - Full Width */}
                <FormField
                  control={form.control}
                  name="companyProfile"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black">
                        Upload Company Profile / Product Catalog (Recommended)
                      </FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-border p-8 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity rounded-none">
                          <Cloud className="w-10 h-10 text-border mb-3" />
                          <p className="text-sm font-medium text-black mb-1">
                            Choose a File or Drag & Drop It Here
                          </p>
                          <p className="text-xs text-gray-500 text-center max-w-md">
                            JPEG, PNG, PDF, and MP4 formats, up to 10 MB.
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Compliance Terms - Separate Light Container */}
            <div className="bg-bg-light px-4 py-8 shadow-lg">
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
                          reported in accordance with ArmoredMart's regulatory
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
                className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
              >
                NEXT
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
