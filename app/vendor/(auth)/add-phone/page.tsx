"use client";

import { Suspense, useState, useMemo, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ChevronDown, ArrowRight, Loader2, Search } from "lucide-react";
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
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { COUNTRY_LIST } from "@/lib/countries";
import { cn } from "@/lib/utils";

const phoneSchema = z
  .object({
    countryCode: z.string().min(1, "Country code is required"),
    isoCode: z.string().min(1, "Country is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\d+$/, "Phone number must contain only numbers"),
  })
  .superRefine((data, ctx) => {
    if (!data.phoneNumber || !data.countryCode || !data.isoCode) {
      return;
    }

    const fullNumber = data.countryCode + data.phoneNumber;
    if (!isValidPhoneNumber(fullNumber, data.isoCode as CountryCode)) {
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
  const urlUserId = searchParams.get("userId") || "";

  // Determine if this is registration flow (has userId in URL) or verification flow
  const isRegistrationFlow = !!urlUserId;

  // Fetch profile for verification flow (when user is logged in but no userId in URL)
  const { data: profileData, isLoading: isLoadingProfile } =
    useOnboardingProfile(!isRegistrationFlow);
  const profileUserId = profileData?.user?.id;

  // Use userId from URL (registration flow) or profile (verification flow)
  const userId = urlUserId || profileUserId || "";

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    mode: "onChange",
    defaultValues: {
      countryCode: "+971",
      isoCode: "AE",
      phoneNumber: "",
    },
  });

  const setPhoneMutation = useSetPhone();

  // State for searchable country dropdown
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Watch ISO code for selected country
  const watchedIsoCode = useWatch({
    control: form.control,
    name: "isoCode",
  });

  // Get selected country info
  const selectedCountry = useMemo(() => {
    return COUNTRY_LIST.find((c) => c.countryCode === watchedIsoCode);
  }, [watchedIsoCode]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRY_LIST;
    const term = countrySearch.toLowerCase();
    return COUNTRY_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.value.includes(term) ||
        c.countryCode.toLowerCase().includes(term)
    );
  }, [countrySearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryOpen(false);
        setCountrySearch("");
      }
    };

    if (isCountryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryOpen]);

  // Handle country selection
  const handleCountrySelect = (country: (typeof COUNTRY_LIST)[0]) => {
    form.setValue("countryCode", country.value);
    form.setValue("isoCode", country.countryCode);
    form.setValue("phoneNumber", "");
    form.trigger("phoneNumber");
    setIsCountryOpen(false);
    setCountrySearch("");
  };

  // Show loading state while fetching profile for verification flow
  if (!urlUserId && isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
        <Card className="w-full max-w-md md:max-w-xl p-0 bg-bg-light border-none shadow-lg">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div
                className="inline-block h-8 w-8 animate-spin border-4 border-solid border-primary border-r-transparent"
                style={{ borderRadius: "50%" }}
              ></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      toast.success(response.message || "Phone number added successfully!");

      // Navigate to next step (e.g., verify phone or dashboard)
      router.push(
        `/vendor/verify-phone?userId=${encodeURIComponent(
          userId
        )}&phone=${encodeURIComponent(data.countryCode + data.phoneNumber)}`
      );
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
      <Card className="bg-bg-light border-0 gap-3 shadow-lg  px-10 py-8 w-full max-w-lg">
        <CardHeader className="pb-2 pt-0 px-0">
          <h1 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide text-center font-heading">
            ADD YOUR PHONE NUMBER
          </h1>
          <p className="text-sm text-black/80 text-center mt-2">
            We&apos;ll text a security code to your mobile phone to finish
            setting up your account.
          </p>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <div className="flex items-center border border-black/20 focus-within:border-black/40 transition-all bg-bg-light">
                        {/* Country Code Selector */}
                        <div
                          ref={dropdownRef}
                          className="relative flex items-center border-r border-black/20 bg-bg-light"
                        >
                          <button
                            type="button"
                            onClick={() => setIsCountryOpen(!isCountryOpen)}
                            className="flex items-center gap-1 bg-bg-medium pl-3 pr-2 py-3 text-sm text-black focus:outline-none cursor-pointer h-12 min-w-[100px]"
                          >
                            <span>{selectedCountry?.flag}</span>
                            <span>{selectedCountry?.value}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-black/50 transition-transform ml-1",
                                isCountryOpen && "rotate-180"
                              )}
                            />
                          </button>

                          {/* Searchable Dropdown */}
                          {isCountryOpen && (
                            <div className="absolute top-[calc(100%+4px)] left-0 z-100 w-72 rounded-md border border-black/20 bg-white shadow-lg">
                              {/* Search Input */}
                              <div className="p-2 border-b border-black/10">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                                  <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={countrySearch}
                                    onChange={(e) =>
                                      setCountrySearch(e.target.value)
                                    }
                                    placeholder="Search countries..."
                                    className="w-full h-9 pl-8 pr-2 text-sm border border-black/20 rounded bg-white focus:outline-none focus:border-black/40"
                                  />
                                </div>
                              </div>
                              {/* Country List */}
                              <div className="max-h-60 overflow-y-auto">
                                {filteredCountries.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-black/50 text-center">
                                    No countries found
                                  </div>
                                ) : (
                                  filteredCountries.map((country) => (
                                    <button
                                      key={country.countryCode}
                                      type="button"
                                      onClick={() =>
                                        handleCountrySelect(country)
                                      }
                                      className={cn(
                                        "w-full px-3 py-2 text-sm text-left hover:bg-black/5 flex items-center gap-2 transition-colors",
                                        selectedCountry?.countryCode ===
                                          country.countryCode && "bg-black/5"
                                      )}
                                    >
                                      <span>{country.flag}</span>
                                      <span className="flex-1 truncate">
                                        {country.name}
                                      </span>
                                      <span className="text-black/50">
                                        {country.value}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Phone Number Input */}
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          maxLength={15}
                          className={cn(
                            "border-0 focus:outline-none focus:ring-0 focus:border-0",
                            "focus-visible:outline-none focus-visible:ring-0",
                            "text-black placeholder:text-black/50 h-12 text-sm flex-1"
                          )}
                          {...field}
                          onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/\D/g, "");
                            // Limit to max 15 digits (ITU-T E.164 standard)
                            const limitedValue = value.slice(0, 15);
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
                By selecting Continue, you agree to receive a text message with
                a security code. Standard rates may apply.
              </p>

              <div className="relative w-full mt-6">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={setPhoneMutation.isPending}
                  className="w-full font-bold uppercase tracking-wider py-3.5 text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 relative overflow-visible"
                  style={{
                    clipPath:
                      "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
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
                <div
                  className="inline-block h-8 w-8 animate-spin border-4 border-solid border-primary border-r-transparent"
                  style={{ borderRadius: "50%" }}
                ></div>
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
