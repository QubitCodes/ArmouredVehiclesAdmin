"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Info, Upload } from "lucide-react";

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
import { Select } from "@/components/ui/select";
import { DateSelector } from "@/components/ui/date-selector";

const companyInformationSchema = z.object({
  countryOfRegistration: z.string().min(1, "Country of registration is required"),
  registeredCompanyName: z.string().min(1, "Registered company name is required"),
  yearOfEstablishment: z.string().min(1, "Year of establishment is required"),
  tradeBrandName: z.string().min(1, "Trade/Brand name is required"),
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
  officialWebsite: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  entityType: z.string().min(1, "Entity Type is required"),
  dunsNumber: z.string().optional(),
  taxVatNumber: z.string().optional(),
  taxIssueDate: z.object({
    day: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
  }).optional(),
  taxExpiryDate: z.object({
    day: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
  }).optional(),
});

type CompanyInformationFormValues = z.infer<typeof companyInformationSchema>;

const countries = [
  { value: "ae", label: "United Arab Emirates", flag: "🇦🇪" },
  { value: "us", label: "United States", flag: "🇺🇸" },
  { value: "gb", label: "United Kingdom", flag: "🇬🇧" },
  { value: "in", label: "India", flag: "🇮🇳" },
  { value: "sa", label: "Saudi Arabia", flag: "🇸🇦" },
];

const entityTypes = [
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "sole-proprietorship", label: "Sole Proprietorship" },
  { value: "other", label: "Other" },
];

export default function CompanyInformationPage() {
  const router = useRouter();

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

  const onSubmit = async (data: CompanyInformationFormValues) => {
    try {
      console.log("Company information data:", data);
      toast.success("Company information saved successfully!");

      // TODO: Implement API call to save company information
      // Redirect to next step
      setTimeout(() => {
        router.push("/vendor/company-information/step-2");
      }, 1500);
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

  const selectedCountry = countries.find(
    (c) => c.value === form.watch("countryOfRegistration")
  );

  return (
    <div className="min-h-screen bg-bg-medium flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step 1 of 5</span>
            <span className="text-sm font-medium text-gray-700">20%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-secondary h-2 rounded-full" style={{ width: "20%" }}></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-bg-light rounded-lg p-8 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* COMPANY INFORMATION Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black mb-6">COMPANY INFORMATION</h2>

                {/* Country of Registration */}
                <FormField
                  control={form.control}
                  name="countryOfRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Country of Registration <span className="text-red-500">*</span>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <select
                            {...field}
                            className="w-full bg-bg-medium border border-gray-300 h-11 pl-12 pr-8 rounded-md text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
                          >
                            {countries.map((country) => (
                              <option key={country.value} value={country.value}>
                                {country.label}
                              </option>
                            ))}
                          </select>
                          {selectedCountry && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl pointer-events-none z-10">
                              {selectedCountry.flag}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Registered Company Name */}
                <FormField
                  control={form.control}
                  name="registeredCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Registered Company Name <span className="text-red-500">*</span>
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

                {/* Year of Establishment */}
                <FormField
                  control={form.control}
                  name="yearOfEstablishment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Year of Establishment <span className="text-red-500">*</span>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                          {...field}
                        />
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
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Trade/Brand Name <span className="text-red-500">*</span>
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
                        Legal Entity ID / CR No <span className="text-red-500">*</span>
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

                {/* Issue Date and Expiry Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Expiry Date <span className="text-red-500">*</span>
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
                </div>

                {/* City & Office Address */}
                <FormField
                  control={form.control}
                  name="cityOfficeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        City & Office Address <span className="text-red-500">*</span>
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
                          placeholder="https://example.com"
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
                        <select
                          {...field}
                          className="w-full bg-bg-medium border border-gray-300 h-11 px-4 pr-8 rounded-md text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
                        >
                          <option value="">Select Entity Type</option>
                          {entityTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
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
                        DUNS Number
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
              </div>

              {/* TAX INFORMATION Section */}
              <div className="space-y-6 pt-6 border-t border-gray-300">
                <h2 className="text-2xl font-bold text-black mb-6">TAX INFORMATION</h2>

                {/* VAT Registration Certificate */}
                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                    VAT Registration Certificate
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-8 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG (MAX. 10MB)</p>
                  </div>
                </div>

                {/* Tax / VAT Number */}
                <FormField
                  control={form.control}
                  name="taxVatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Tax / VAT Number
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

                {/* Tax Issue Date and Expiry Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxIssueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Issuing Date
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </FormLabel>
                        <FormControl>
                          <DateSelector
                            value={field.value || {}}
                            onChange={field.onChange}
                            className="bg-bg-medium"
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
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Expiry Date
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </FormLabel>
                        <FormControl>
                          <DateSelector
                            value={field.value || {}}
                            onChange={field.onChange}
                            className="bg-bg-medium"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* NEXT Button */}
              <Button
                type="submit"
                variant="secondary"
                className="w-full text-white font-bold uppercase tracking-wide py-4 text-base shadow-lg hover:shadow-xl transition-all relative rounded-r-md mt-8"
                style={{
                  clipPath:
                    "polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%, 0% 50%)",
                }}
              >
                NEXT
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

