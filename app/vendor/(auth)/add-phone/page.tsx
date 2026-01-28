"use client";

import { vendorAuthService } from "@/services/vendor/auth.service";

import { Suspense, useState, useMemo, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ChevronDown, ArrowRight, Loader2, Search, ChevronLeft } from "lucide-react";
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
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { COUNTRY_LIST } from "@/lib/countries";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

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
  const urlEmail = searchParams.get("email"); // Get email passed from verify-email

  // Hook
  const { linkPhone, verifyPhoneLink, loading: firebaseLoading } = useFirebaseAuth();

  // State
  const [stage, setStage] = useState<"input" | "verify">("input");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaContainerId] = useState("recaptcha-container");

  // OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Recovery Data
  const [savedData, setSavedData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vendor_reg_form');
    if (saved) {
      try { setSavedData(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    mode: "onChange",
    defaultValues: {
      countryCode: "+971",
      isoCode: "AE",
      phoneNumber: "",
    },
  });

  // Country Dropdown State
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ... (Country Logic Same as Before)
  const watchedIsoCode = useWatch({ control: form.control, name: "isoCode" });
  const selectedCountry = useMemo(() => COUNTRY_LIST.find((c) => c.countryCode === watchedIsoCode), [watchedIsoCode]);
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRY_LIST;
    const term = countrySearch.toLowerCase();
    return COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(term) || c.value.includes(term) || c.countryCode.toLowerCase().includes(term));
  }, [countrySearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
        setCountrySearch("");
      }
    };
    if (isCountryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCountryOpen]);

  // Handlers
  const handleCountrySelect = (country: (typeof COUNTRY_LIST)[0]) => {
    form.setValue("countryCode", country.value);
    form.setValue("isoCode", country.countryCode);
    form.setValue("phoneNumber", "");
    form.trigger("phoneNumber");
    setIsCountryOpen(false);
    setCountrySearch("");
  };

  // 1. Send OTP
  const onSubmit = async (data: PhoneFormValues) => {
    try {
      const dialCode = data.countryCode.replace('+', '');
      const phoneDigits = data.phoneNumber.replace(/^0+/, '');
      const phoneToUse = `+${dialCode}${phoneDigits}`;

      // Check if phone exists (Backend check if possible, optional?) 
      // Admin usually allows checking. Since we use Firebase, collision might happen if phone already linked.

      const result = await linkPhone(phoneToUse, recaptchaContainerId);
      setConfirmationResult(result);
      setStage("verify");
      toast.success("Security code sent!");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to send code");
    }
  };



  // 2. Verify OTP & Finalize Registration
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter full code");
      return;
    }

    if (!confirmationResult) return;

    try {
      // A. Verify with Firebase
      const userCred = await verifyPhoneLink(confirmationResult, code);
      const idToken = await userCred.user.getIdToken();

      let payload: any = {};

      if (savedData) {
        // Registration
        payload = {
          idToken,
          name: savedData.name,
          username: savedData.username,
          email: savedData.email,
          userType: 'vendor',
          phone: form.getValues().phoneNumber,
          countryCode: form.getValues().countryCode
        };
      } else {
        // Probably just adding phone
        payload = {
          idToken,
          phone: form.getValues().phoneNumber,
          countryCode: form.getValues().countryCode,
        };
      }

      const response = await api.post("/auth/firebase/register", payload);
      const { status, data, message } = response.data;

      if (status && data) {
        // Store Tokens
        if (data.accessToken && data.refreshToken) {
          vendorAuthService.setTokens(data.accessToken, data.refreshToken);
        }
        if (data.user) {
          vendorAuthService.setUserDetails(data.user);
        }

        // Cleanup
        localStorage.removeItem('vendor_reg_form');
        toast.success("Account created successfully!");

        // Redirect to Onboarding (Company Info)
        router.push("/vendor/company-information");
      } else {
        throw new Error(message || "Registration failed");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || "Verification failed");
    }
  };

  // OTP Helpers
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "Enter") handleVerifyOtp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-medium px-8 py-8">
      <Card className="bg-bg-light border-0 gap-3 shadow-lg  px-10 py-8 w-full max-w-lg">
        <CardHeader className="pb-2 pt-0 px-0">
          <h1 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide text-center font-heading">
            {stage === 'input' ? 'ADD YOUR PHONE NUMBER' : 'ENTER SECURITY CODE'}
          </h1>
          <p className="text-sm text-black/80 text-center mt-2">
            {stage === 'input'
              ? "We'll text a security code to your mobile phone to finish setting up your account."
              : "We sent a security code to your phone."
            }
          </p>
        </CardHeader>

        <div id={recaptchaContainerId}></div>

        <CardContent className="px-0 pb-0">
          {stage === 'input' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Existing Phone Input UI Code ... */}
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
                              <div className="absolute top-[calc(100%+4px)] left-0 z-10 w-72 rounded-md border border-black/20 bg-white shadow-lg">
                                <div className="p-2 border-b border-black/10">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                                    <input
                                      ref={searchInputRef}
                                      type="text"
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      placeholder="Search countries..."
                                      className="w-full h-9 pl-8 pr-2 text-sm border border-black/20 rounded bg-white focus:outline-none focus:border-black/40"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {filteredCountries.map((country) => (
                                    <button
                                      key={country.countryCode}
                                      type="button"
                                      onClick={() => handleCountrySelect(country)}
                                      className={cn(
                                        "w-full px-3 py-2 text-sm text-left hover:bg-black/5 flex items-center gap-2 transition-colors",
                                        selectedCountry?.countryCode === country.countryCode && "bg-black/5"
                                      )}
                                    >
                                      <span>{country.flag}</span>
                                      <span className="flex-1 truncate">{country.name}</span>
                                      <span className="text-black/50">{country.value}</span>
                                    </button>
                                  ))}
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
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value.slice(0, 15));
                              form.trigger("phoneNumber");
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <p className="text-xs text-black/70 text-center mt-4">
                  By selecting Continue, you agree to receive a text message with
                  a security code. Standard rates may apply.
                </p>

                <div className="relative w-full mt-6">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={firebaseLoading}
                    className="w-full font-bold uppercase tracking-wider py-3.5 text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 relative overflow-visible"
                    style={{ clipPath: "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)" }}
                  >
                    {firebaseLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      <span className="flex items-center justify-center gap-2">CONTINUE <ArrowRight className="w-5 h-5" /></span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              {/* OTP UI */}
              <div className="flex justify-center gap-3 my-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold bg-bg-medium border border-black/20 focus:outline-none focus:border-black/50 transition-all"
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleVerifyOtp}
                  disabled={firebaseLoading}
                  className="w-full font-bold uppercase tracking-wider py-6 text-sm"
                  style={{ clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)" }}
                >
                  {firebaseLoading ? "Verifying..." : "Verify & Create Account"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStage("input")}
                  disabled={firebaseLoading}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AddPhonePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddPhoneContent />
    </Suspense>
  );
}
