"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";

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

const createStoreSchema = z.object({
  country: z.string().min(1, "Country is required"),
  companyName: z.string().min(1, "Company name is required"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(1, "Store phone number is required"),
});

type CreateStoreFormValues = z.infer<typeof createStoreSchema>;

const countries = [
  { value: "ae", label: "United Arab Emirates", flag: "🇦🇪" },
  { value: "us", label: "United States", flag: "🇺🇸" },
  { value: "gb", label: "United Kingdom", flag: "🇬🇧" },
  { value: "in", label: "India", flag: "🇮🇳" },
  { value: "sa", label: "Saudi Arabia", flag: "🇸🇦" },
];

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
      country: "ae",
      companyName: "",
      email: "",
      phoneCountryCode: "971",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: CreateStoreFormValues) => {
    try {
      // TODO: Implement API call to create store
      // const response = await createStoreMutation.mutateAsync(data);

      console.log("Store data to be sent:", data);
      toast.success("Store created successfully!");

      // Redirect to company information page
      setTimeout(() => {
        router.push("/vendor/company-information");
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
        "Failed to create store. Please try again.";
      toast.error(errorMessage);
    }
  };

  const selectedCountry = countries.find(
    (c) => c.value === form.watch("country")
  );
  const selectedPhoneCode = phoneCountryCodes.find(
    (c) => c.value === form.watch("phoneCountryCode")
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 bg-bg-medium flex items-center justify-center px-6 py-12 relative">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors z-10"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>

        <div className="w-full max-w-md space-y-8 bg-bg-light rounded-lg p-6">
          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Country Field */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                      Country <span className="text-red-500">*</span>
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

              {/* Email Field */}
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
                        className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Store Phone Number Field */}
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
                              className="w-full bg-bg-medium border border-gray-300 h-11 pl-10 pr-6 rounded-md text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
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

              {/* Create Button */}
              <Button
                type="submit"
                variant="secondary"
                className="w-full text-white font-bold uppercase tracking-wide py-2 text-base shadow-lg hover:shadow-xl transition-all relative rounded-r-md"
                style={{
                  clipPath:
                    "polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%, 0% 50%)",
                }}
              >
                CREATE
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Right Column - Promotional Content */}
      <div className="hidden lg:flex flex-1 bg-secondary flex-col items-center justify-center px-12 py-16 text-white">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Create Your Store on
            <br />
            <span className="font-bold">Armored Mart</span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed opacity-95">
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
