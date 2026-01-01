"use client";

import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ChevronDown, ArrowRight, Loader2 } from "lucide-react";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSetPhone } from "@/hooks/vendor/(auth)/use-set-phone";
import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";

// Country code to ISO country code mapping
const countryCodeMap: Record<string, CountryCode> = {
  "+971": "AE",
  "+1": "US",
  "+44": "GB",
  "+91": "IN",
  "+966": "SA",
};

// Country code to expected phone number length mapping
const countryPhoneLengthMap: Record<string, number> = {
  "+971": 9,  // UAE: 9 digits
  "+1": 10,   // US: 10 digits
  "+44": 10,  // UK: 10 digits
  "+91": 10,  // India: 10 digits
  "+966": 9,  // Saudi Arabia: 9 digits
};

const phoneSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d+$/, "Phone number must contain only numbers"),
}).superRefine((data, ctx) => {
  if (!data.phoneNumber || !data.countryCode) {
    return;
  }

  const country = countryCodeMap[data.countryCode];
  if (!country) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid country code selected",
      path: ["countryCode"],
    });
    return;
  }

  // Get expected length for the country
  const expectedLength = countryPhoneLengthMap[data.countryCode];
  if (expectedLength && data.phoneNumber.length !== expectedLength) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Phone number must be exactly ${expectedLength} digits for this country`,
      path: ["phoneNumber"],
    });
    return;
  }

  const fullNumber = data.countryCode + data.phoneNumber;
  if (!isValidPhoneNumber(fullNumber, country)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter a valid phone number for the selected country",
      path: ["phoneNumber"],
    });
  }
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

function AddPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    mode: "onChange",
    defaultValues: {
      countryCode: "+971",
      phoneNumber: "",
    },
  });

  const setPhoneMutation = useSetPhone();
  
  // Watch country code to update maxLength dynamically
  const selectedCountryCode = useWatch({
    control: form.control,
    name: "countryCode",
  });
  const maxLength = countryPhoneLengthMap[selectedCountryCode] || 10;

  const onSubmit = async (data: PhoneFormValues) => {
    if (!userId) {
      toast.error("User ID is missing. Please try again.");
      return;
    }

    try {
      const response = await setPhoneMutation.mutateAsync({
        userId,
        phone: data.phoneNumber,
        countryCode: data.countryCode,
      });

      toast.success(
        response.message || "Phone number added successfully!"
      );

      // Navigate to next step (e.g., verify phone or dashboard)
      router.push(`/vendor/verify-phone?userId=${encodeURIComponent(userId)}&phone=${encodeURIComponent(data.countryCode + data.phoneNumber)}`);
    } catch (error) {
      console.log(error);

      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to add phone number. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-medium px-8 py-8">
      <Card className="bg-bg-light border-0 gap-3 shadow-lg overflow-hidden px-10 py-8 w-full max-w-lg">
        <CardHeader className="pb-2 pt-0 px-0">
          <h1 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide text-center font-heading">
            ADD YOUR PHONE NUMBER
          </h1>
          <p className="text-sm text-black/80 text-center mt-2">
            We&apos;ll text a security code to your mobile phone to finish setting up your account.
          </p>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <div className="flex items-center border border-black/20 overflow-hidden focus-within:border-black/40 transition-all bg-bg-light">
                        {/* Country Code Selector */}
                        <div className="relative flex items-center border-r border-black/20 bg-bg-light">
                          <FormField
                            control={form.control}
                            name="countryCode"
                            render={({ field: countryField }) => (
                              <FormControl>
                                <div className="relative">
                                  <select
                                    {...countryField}
                                    onChange={(e) => {
                                      countryField.onChange(e);
                                      // Clear phone number when country changes
                                      form.setValue("phoneNumber", "");
                                      form.trigger("phoneNumber");
                                    }}
                                    className="appearance-none bg-bg-medium pl-3 pr-8 py-3 text-sm text-black focus:outline-none cursor-pointer h-12"
                                  >
                                    <option value="+971">🇦🇪 +971</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+966">🇸🇦 +966</option>
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 pointer-events-none" />
                                </div>
                              </FormControl>
                            )}
                          />
                        </div>

                        {/* Phone Number Input */}
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          maxLength={maxLength}
                          className="border-0 focus:ring-0 focus:border-0  text-black placeholder:text-black/50 h-12 text-sm flex-1"
                          {...field}
                          onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/\D/g, "");
                            // Limit to country-specific max length
                            const limitedValue = value.slice(0, maxLength);
                            field.onChange(limitedValue);
                            // Trigger validation
                            form.trigger("phoneNumber");
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-600 text-xs" />
                  </FormItem>
                )}
              />

              {/* Disclaimer Text */}
              <p className="text-xs text-black/70 text-center mt-4">
                By selecting Continue, you agree to receive a text message with a security code. Standard rates may apply.
              </p>

              <div className="relative w-full mt-6">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={setPhoneMutation.isPending}
                  className="w-full font-bold uppercase tracking-wider py-3.5 text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 relative overflow-visible"
                  style={{
                    clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
                  }}
                >
                  {setPhoneMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="flex items-center justify-center gap-2">
                        CONTINUE
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-medium px-8 py-8">
          <Card className="bg-bg-light border-0 shadow-lg overflow-hidden px-10 py-8 w-full max-w-lg">
            <CardContent className="p-0">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin border-4 border-solid border-primary border-r-transparent" style={{ borderRadius: '50%' }}></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AddPhoneContent />
    </Suspense>
  );
}

