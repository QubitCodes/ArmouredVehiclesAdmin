"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";
import { useEffect } from "react";

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
import { Spinner } from "@/components/ui/spinner";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { useOnboardingStep0 } from "@/hooks/vendor/dashboard/use-onboarding-step0";

const createStoreSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(1, "Store phone number is required"),
});

type CreateStoreFormValues = z.infer<typeof createStoreSchema>;

const phoneCountryCodes = [
  { value: "971", code: "+971", flag: "🇦🇪", label: "United Arab Emirates" },
  { value: "1", code: "+1", flag: "🇺🇸", label: "United States" },
  { value: "44", code: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { value: "91", code: "+91", flag: "🇮🇳", label: "India" },
  { value: "966", code: "+966", flag: "🇸🇦", label: "Saudi Arabia" },
];

export default function CreateStorePage() {
  const router = useRouter();

  const form = useForm<CreateStoreFormValues>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      companyName: "",
      email: "",
      phoneCountryCode: "971",
      phoneNumber: "",
    },
  });

  // Fetch onboarding profile to auto-fill form
  const { data: profileData, isLoading: isProfileLoading } =
    useOnboardingProfile();

  // Mutation for step0 API
  const step0Mutation = useOnboardingStep0();

  // Auto-fill form fields when profile data is available
  useEffect(() => {
    if (profileData && !isProfileLoading) {
      const updates: Partial<CreateStoreFormValues> = {};

      // Auto-fill email from user
      if (profileData.user?.email && !form.getValues("email")) {
        updates.email = profileData.user.email;
      }

      // Auto-fill company name from user name
      if (profileData.user?.name && !form.getValues("companyName")) {
        updates.companyName = profileData.user.name;
      }

      // Auto-fill phone number from user
      if (profileData.user?.phone) {
        const phone = profileData.user.phone.trim();
        
        // Check if phone includes country code (starts with +)
        if (phone.startsWith("+")) {
          // Remove + and any spaces, then try to match country codes
          const phoneWithoutPlus = phone.replace(/^\+/, "").replace(/\s/g, "");
          
          // Try to match country codes (try longer codes first)
          const sortedCodes = [...phoneCountryCodes].sort(
            (a, b) => b.value.length - a.value.length
          );
          
          for (const codeOption of sortedCodes) {
            if (phoneWithoutPlus.startsWith(codeOption.value)) {
              const phoneNumber = phoneWithoutPlus.slice(
                codeOption.value.length
              );
              
              if (phoneNumber && !form.getValues("phoneCountryCode")) {
                updates.phoneCountryCode = codeOption.value;
              }
              
              if (phoneNumber && !form.getValues("phoneNumber")) {
                updates.phoneNumber = phoneNumber;
              }
              break;
            }
          }
        } else {
          // Phone number without country code - just set the number
          const phoneNumber = phone.replace(/\s/g, "");
          if (phoneNumber && !form.getValues("phoneNumber")) {
            updates.phoneNumber = phoneNumber;
          }
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        Object.entries(updates).forEach(([key, value]) => {
          form.setValue(key as keyof CreateStoreFormValues, value as string);
        });
      }
    }
  }, [profileData, isProfileLoading, form]);

  const onSubmit = async (data: CreateStoreFormValues) => {
    try {
      // Find the country code object to get the code with "+"
      const selectedPhoneCode = phoneCountryCodes.find(
        (code) => code.value === data.phoneCountryCode
      );

      // Prepare API payload
      const payload = {
        companyName: data.companyName,
        companyEmail: data.email,
        companyPhone: data.phoneNumber,
        companyPhoneCountryCode: selectedPhoneCode?.code || `+${data.phoneCountryCode}`,
      };

      // Call the API
      await step0Mutation.mutateAsync(payload);

      toast.success("Store created successfully!");

      // Redirect to company information page
      router.push("/vendor/company-information");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to create store. Please try again.";
      toast.error(errorMessage);
    }
  };

  const phoneCountryCode = useWatch({
    control: form.control,
    name: "phoneCountryCode",
  });
  const selectedPhoneCode = phoneCountryCodes.find(
    (c) => c.value === phoneCountryCode
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 bg-bg-medium flex items-center justify-center px-6 py-12 relative">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 flex items-center justify-center w-10 h-10 bg-gray-200 hover:bg-gray-300 transition-colors z-10"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>

        <div className="w-full max-w-md space-y-8 bg-bg-light p-6 relative">
          {/* Loading Overlay */}
          {isProfileLoading && (
            <div className="absolute inset-0 bg-bg-light/95 backdrop-blur-md flex items-center justify-center z-50 rounded-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping" />
                  <div className="relative bg-secondary/10 rounded-full p-4">
                    <Spinner size="xl" className="text-secondary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-gray-800">
                    Loading profile data
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please wait...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className={`space-y-5 transition-opacity duration-200 ${
                isProfileLoading ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {/* Company Name Field */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                      Company Name <span className="text-red-500">*</span>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Blueweb"
                        className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field - Read Only */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                      Email <span className="text-red-500">*</span>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="info@blueweb2.com"
                        className="bg-gray-100 border border-gray-300 h-11 cursor-not-allowed"
                        readOnly
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Store Phone Number Field - Read Only */}
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                  Store Phone Number <span className="text-red-500">*</span>
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field }) => (
                      <FormItem className="w-[120px]">
                        <FormControl>
                          <div className="relative">
                            <select
                              {...field}
                              className="w-full bg-gray-100 border border-gray-300 h-11 pl-10 pr-6 text-sm cursor-not-allowed outline-none appearance-none"
                              disabled
                            >
                              {phoneCountryCodes.map((code) => (
                                <option key={code.value} value={code.value}>
                                  {code.code}
                                </option>
                              ))}
                            </select>
                            {selectedPhoneCode && (
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-2xl pointer-events-none z-10">
                                {selectedPhoneCode.flag}
                              </span>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="9072725777"
                            className="bg-gray-100 border border-gray-300 h-11 cursor-not-allowed"
                            readOnly
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Create Button */}
              <Button
                type="submit"
                variant="secondary"
                disabled={step0Mutation.isPending}
                className="w-full text-white font-bold uppercase tracking-wide py-2 text-base shadow-lg hover:shadow-xl transition-all relative disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  clipPath:
                    "polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%, 0% 50%)",
                }}
              >
                {step0Mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-white" />
                    CREATING...
                  </span>
                ) : (
                  "CREATE"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Right Column - Promotional Content */}
      <div className="hidden lg:flex flex-1 bg-secondary flex-col items-center justify-center px-12 py-16 text-white">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl md:text-5xl leading-tight font-sans">
            Create Your Store on
            {/* <br /> */}
            <span className="font-bold"> Armored Mart</span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed opacity-95 pt-3">
            Reach thousands of verified buyers in the defense and automotive
            industries. Setting up your Armored Mart store is the first step
            toward growing your business online.
          </p>
          <p className="text-base md:text-lg font-semibold mt-8">
            Join 10,000+ trusted sellers today.
          </p>
        </div>
      </div>
    </div>
  );
}
