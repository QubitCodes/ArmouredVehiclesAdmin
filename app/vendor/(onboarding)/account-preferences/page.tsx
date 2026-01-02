"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, X } from "lucide-react";
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

const accountPreferencesSchema = z
  .object({
    categories: z
      .array(z.string())
      .min(1, "Please select at least one category"),
    registerAs: z.string().min(1, "Please select registration type"),
    preferredCurrency: z.string().min(1, "Please select a currency"),
    sponsorContent: z.enum(["yes", "no"]),
    platformPassword: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.platformPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AccountPreferencesFormValues = z.infer<typeof accountPreferencesSchema>;

const categoryOptions = [
  "Engine Systems",
  "Braking Systems",
  "Runflat & Tire Systems",
  "Turrets & Mounts (Controlled item MOD/EOCN)",
  "Transmission & Drivetrain",
  "Chassis & Suspension",
  "Electrical Systems (Controlled if Mil Standard)",
  "Surveillance & Monitoring",
  "Lighting Systems (Controlled if Mil Standard)",
  "HVAC & Thermal Management",
  "Ballistic Protection (Controlled item MOD/EOCN)",
  "Body & Structure Reinforcements",
  "Gunports, Hinges & Weapon-Mount Interfaces (Controlled item MOD/EOCN)",
  "Countermeasures",
  "Fuel & Water Systems",
  "Communication Equipment (Controlled items)",
  "Interior Kits",
  "Fabrication & Integration (Controlled item MOD/ITAR-Design Control)",
  "Drive-Side Conversion Components (LHD ↔ RHD)",
  "Exterior Accessories",
  "OEM Components",
  "Value-Oriented OEM Chassis",
  "Military & Tactical Chassis Suppliers (Controlled- End User declaration)",
  "Recovery & Mobility",
];

const currencyOptions = [
  { value: "aed", label: "AED" },
  { value: "usd", label: "USD" },
  { value: "eur", label: "EUR" },
  { value: "other", label: "Other" },
];

export default function AccountPreferencesPage() {
  const router = useRouter();

  const form = useForm<AccountPreferencesFormValues>({
    resolver: zodResolver(accountPreferencesSchema),
    defaultValues: {
      categories: [
        "Engine Systems",
        "Braking Systems",
        "Runflat & Tire Systems",
        "Turrets & Mounts (Controlled item MOD/EOCN)",
      ],
      registerAs: "verified-supplier",
      preferredCurrency: "aed",
      sponsorContent: "no",
      platformPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: AccountPreferencesFormValues) => {
    try {
      console.log("Account preferences data:", data);
      toast.success("Account preferences saved successfully");
      // TODO: Implement API call to save account preferences
      // Navigate to next step (Verification)
      router.push("/vendor/verification");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to save account preferences. Please try again.";
      toast.error(errorMessage);
    }
  };

  const selectedCategories = form.watch("categories");

  const handleRemoveCategory = (category: string) => {
    const current = form.getValues("categories");
    form.setValue(
      "categories",
      current.filter((c) => c !== category)
    );
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
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
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

        {/* ACCOUNT PREFERENCES Heading - Outside Form */}
        <h2 className="text-2xl font-bold text-black mb-8">
          ACCOUNT PREFERENCES
        </h2>

        {/* Form Container */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-bg-light px-4 py-8 shadow-lg">
              {/* Select Categories */}
              <div className="space-y-4 mb-8">
                <FormLabel className="text-sm font-bold text-black">
                  Select Categories You Want to Sell In:
                </FormLabel>

                {/* Input Field with Tags and Count */}
                <div className="relative">
                  <div className="min-h-[44px] bg-bg-medium border border-border p-2 pr-12 flex flex-wrap items-center gap-2">
                    {/* Selected Tags */}
                    {selectedCategories.length > 0 && (
                      <>
                        {selectedCategories.map((category) => (
                          <div
                            key={category}
                            className="flex items-center gap-1.5 bg-bg-light border border-border px-3 py-1.5"
                          >
                            <span className="text-sm text-black">
                              {category}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(category)}
                              className="hover:opacity-70 transition-opacity p-0.5 shrink-0"
                            >
                              <X className="w-3.5 h-3.5 text-border" />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                  {/* Count Badge */}
                  {selectedCategories.length > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-light border border-border w-8 h-8 flex items-center justify-center">
                      <span className="text-sm font-medium text-black">
                        {selectedCategories.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Checkboxes Grid */}
                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-4 gap-3">
                        {categoryOptions.map((option) => (
                          <FormField
                            key={option}
                            control={form.control}
                            name="categories"
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

            {/* Request to Register As and Preferred Currency - Separate Containers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Request to Register As */}
              <div className="bg-bg-light px-4 py-8 shadow-lg">
                <FormField
                  control={form.control}
                  name="registerAs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black">
                        Request to Register As:
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <label
                              htmlFor="registerAs-verified-supplier"
                              className="relative flex items-center cursor-pointer"
                            >
                              <input
                                type="radio"
                                id="registerAs-verified-supplier"
                                name="registerAs"
                                value="verified-supplier"
                                checked={field.value === "verified-supplier"}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange("verified-supplier");
                                  }
                                }}
                                className="sr-only"
                              />
                              <span
                                className={`h-4 w-4 rounded-full border border-border bg-bg-light flex items-center justify-center ${
                                  field.value === "verified-supplier"
                                    ? "border-border"
                                    : ""
                                }`}
                              >
                                {field.value === "verified-supplier" && (
                                  <span className="h-2 w-2 rounded-full bg-border"></span>
                                )}
                              </span>
                            </label>
                            <label
                              htmlFor="registerAs-verified-supplier"
                              className={`text-sm font-medium leading-none cursor-pointer ${
                                field.value === "verified-supplier"
                                  ? "text-black"
                                  : "text-gray-500"
                              }`}
                            >
                              Verified Supplier
                            </label>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column - Preferred Currency */}
              <div className="bg-bg-light px-4 py-8 shadow-lg">
                <FormField
                  control={form.control}
                  name="preferredCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black">
                        Preferred Currency:
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-6">
                          {currencyOptions.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center space-x-2"
                            >
                              <label
                                htmlFor={`currency-${option.value}`}
                                className="relative flex items-center cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  id={`currency-${option.value}`}
                                  name="preferredCurrency"
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
                                htmlFor={`currency-${option.value}`}
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

            {/* Sponsor Content - Separate Light Container */}
            <div className="bg-bg-light px-4 py-8 shadow-lg">
              <FormField
                control={form.control}
                name="sponsorContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-black">
                      Do you wish to sponsor content/listings?
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
                              htmlFor={`sponsor-${option.value}`}
                              className="relative flex items-center cursor-pointer"
                            >
                              <input
                                type="radio"
                                id={`sponsor-${option.value}`}
                                name="sponsorContent"
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
                              htmlFor={`sponsor-${option.value}`}
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

            {/* Set Platform Password and Confirm Password - Single Container */}
            <div className="bg-bg-light px-4 py-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Set Platform Password */}
                <div>
                  <FormField
                    control={form.control}
                    name="platformPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-black">
                          Set Platform Password:
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter Your New Password"
                            className="bg-bg-medium border border-border h-11 focus:border-border focus:ring-1 focus:ring-border rounded-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column - Confirm Password */}
                <div>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-black">
                          Confirm Password:
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Re-enter Your Password"
                            className="bg-bg-medium border border-border h-11 focus:border-border focus:ring-1 focus:ring-border rounded-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8 pb-8">
              <Button
                type="button"
                variant="secondary"
                className="bg-bg-light text-black hover:bg-bg-medium font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/declaration")}
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
