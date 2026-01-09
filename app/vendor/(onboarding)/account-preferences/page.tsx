"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useVendorCategories } from "@/hooks/vendor/dashboard/use-vendor-categories";
import { useOnboardingStep4 } from "@/hooks/vendor/dashboard/use-onboarding-step4";
import { OnboardingProgressBar } from "@/components/vendor/onboarding-progress-bar";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const accountPreferencesSchema = z.object({
  categories: z
    .array(z.string())
    .min(1, "Please select at least one category"),
  registerAs: z
    .string()
    .min(1, "Please select registration type"),
  preferredCurrency: z
    .string()
    .min(1, "Please select a currency"),
  sponsorContent: z.enum(["yes", "no"], {
    message: "Please select whether you wish to sponsor content/listings",
  }),
  captcha: turnstileSiteKey
    ? z.string().min(1, "Please complete the CAPTCHA verification")
    : z.string().optional(),
});

type AccountPreferencesFormValues = z.infer<typeof accountPreferencesSchema>;

const currencyOptions = [
  { value: "AED", label: "AED" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "other", label: "Other" },
];

export default function AccountPreferencesPage() {
  const router = useRouter();
  const { data: categoryOptions = [], isLoading: isCategoriesLoading } = useVendorCategories();
  const step4Mutation = useOnboardingStep4();

  const form = useForm<AccountPreferencesFormValues>({
    resolver: zodResolver(accountPreferencesSchema),
    defaultValues: {
      categories: [],
      registerAs: "verified-supplier",
      preferredCurrency: "AED",
      sponsorContent: "no",
      captcha: "",
    },
  });

  const onSubmit = async (data: AccountPreferencesFormValues) => {
    try {
      // Transform form data to match API schema
      const apiPayload = {
        sellingCategories: data.categories,
        registerAs: data.registerAs === "verified-supplier" ? "Verified Supplier" : data.registerAs,
        preferredCurrency: data.preferredCurrency.toUpperCase(),
        sponsorContent: data.sponsorContent === "yes",
        isDraft: false,
        password: "demo-demo",
      };

      await step4Mutation.mutateAsync(apiPayload);
      toast.success("Account preferences saved successfully");
      router.push("/vendor/bank-account");
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
        <OnboardingProgressBar currentStep={4} />

        {/* ACCOUNT PREFERENCES Heading - Outside Form */}
        <h2 className="text-2xl pb-3 font-bold text-black uppercase">
          ACCOUNT PREFERENCES
        </h2>

        {/* Form Container */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-bg-light p-6">
              {/* Select Categories */}
              <div className="space-y-4 mb-8">
                <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                  Select Categories You Want to Sell In:
                  <span className="text-red-500">*</span>
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
                      {isCategoriesLoading ? (
                        <div className="text-sm text-gray-500">Loading categories...</div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3">
                          {categoryOptions.map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="categories"
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
            </div>

            {/* Request to Register As and Preferred Currency - Separate Containers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Request to Register As */}
              <div className="bg-bg-light p-6">
                <FormField
                  control={form.control}
                  name="registerAs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                        Request to Register As:
                        <span className="text-red-500">*</span>
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
              <div className="bg-bg-light p-6">
                <FormField
                  control={form.control}
                  name="preferredCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                        Preferred Currency:
                        <span className="text-red-500">*</span>
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
            <div className="bg-bg-light p-6">
              <FormField
                control={form.control}
                name="sponsorContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                      Do you wish to sponsor content/listings?
                      <span className="text-red-500">*</span>
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

            {/* CAPTCHA Verification - Separate Light Container */}
            <div className="bg-bg-light p-6">
              <FormField
                control={form.control}
                name="captcha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-black mb-4 flex items-center gap-1">
                      CAPTCHA Verification
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      {turnstileSiteKey ? (
                        <Turnstile
                          siteKey={turnstileSiteKey}
                          onSuccess={(token: string) => {
                            field.onChange(token || "");
                          }}
                          onError={() => {
                            field.onChange("");
                          }}
                          onExpire={() => {
                            field.onChange("");
                          }}
                          options={{
                            theme: "light",
                            size: "normal",
                          }}
                        />
                      ) : (
                        <div className="p-4 border border-border bg-bg-medium">
                          <p className="text-sm text-gray-600">
                            CAPTCHA is not configured. Please set NEXT_PUBLIC_TURNSTILE_SITE_KEY in your environment variables.
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            For development, CAPTCHA validation is disabled. The form can be submitted without CAPTCHA.
                          </p>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8 pb-8">
              <Button
                type="button"
                variant="secondary"
                className="bg-bg-light text-black hover:bg-primary/70 hover:text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/declaration")}
              >
                Previous
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={step4Mutation.isPending}
                className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step4Mutation.isPending ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    SAVING...
                  </>
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
