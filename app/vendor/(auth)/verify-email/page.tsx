"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Link from "next/link";

import { useVendorRegistration } from "@/hooks/vendor/(auth)/use-vendor-registration";
import { useVerifyEmail } from "@/hooks/vendor/(auth)/use-verify-email";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email");
  const userId = searchParams.get("userId") || "";
  const username = searchParams.get("username") || "";
  
  // Determine if this is registration flow (has userId in URL)
  const isRegistrationFlow = !!userId;
  
  // Fetch profile for post-login verification flow (only if not registration flow)
  // We disable the query for registration flow to avoid unnecessary API calls
  const { data: profileData, isLoading: isLoadingProfile } = useOnboardingProfile(!isRegistrationFlow);
  const profileEmail = profileData?.user?.email;
  const profileUserId = profileData?.user?.id;
  
  // Determine if this is verification flow (no userId in URL but has profile data)
  const isVerificationFlow = !userId && !!profileData?.user;
  
  // Use email from URL (registration) or profile (verification), fallback to placeholder only for registration
  const email = urlEmail || profileEmail || (isRegistrationFlow ? "verify@gmail.com" : "");
  const finalUserId = userId || profileUserId || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasAutoSentRef = useRef(false);
  const verifyMutation = useVerifyEmail();
  const resendMutation = useVendorRegistration();
  const autoSendMutation = useVendorRegistration(); // Separate mutation for auto-send

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      pastedData.split("").forEach((char, idx) => {
        if (idx < 6) {
          newOtp[idx] = char;
        }
      });
      setOtp(newOtp);
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    try {
      if (!finalUserId) {
        toast.error("User ID is missing. Please try again.");
        return;
      }

      if (!email) {
        toast.error("Email is missing. Please try again.");
        return;
      }

      console.log("otpCode", otpCode, "email", email, "userId", finalUserId);
      const response = await verifyMutation.mutateAsync({
        userId: finalUserId,
        email,
        code: otpCode,
      });

      toast.success(
        response.message || "Email verified successfully"
      );

      // Get userId from response if available, otherwise use finalUserId
      const verifiedUserId = response.userId || finalUserId;

      // Redirect to phone verification step for both flows
      setTimeout(() => {
        if (verifiedUserId) {
          // Check if user already has a phone number
          const hasPhone = profileData?.user?.phone;
          if (hasPhone) {
            // User has phone, redirect to verify phone
            router.push(`/vendor/verify-phone?userId=${encodeURIComponent(verifiedUserId)}&email=${encodeURIComponent(email)}`);
          } else {
            // User doesn't have phone, redirect to add phone
            router.push(`/vendor/add-phone?userId=${encodeURIComponent(verifiedUserId)}&email=${encodeURIComponent(email)}`);
          }
        } else {
          // Fallback: redirect to add-phone (API might handle userId)
          router.push(`/vendor/add-phone?email=${encodeURIComponent(email)}`);
        }
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
        "Invalid OTP. Please try again.";
      toast.error(errorMessage);

      // Clear OTP inputs on error
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleCancel = () => {
    if (isRegistrationFlow) {
    router.push("/vendor/create-account");
    } else {
      router.push("/vendor");
    }
  };

  const handleResend = async () => {
    try {
      if (!email) {
        toast.error("Email is missing. Please try again.");
        return;
      }

      // For both registration and verification flows, we use vendor registration endpoint
      // This sends the verification email that works with the verify-email endpoint
      const resendUsername = username || profileData?.user?.name || email.split("@")[0];
      const name = resendUsername;
      
      const response = await resendMutation.mutateAsync({
        email,
        username: resendUsername,
        name,
        userType: "vendor",
      });

      toast.success(
        response.message || "OTP resent successfully! Please check your email."
      );

      // Clear OTP inputs
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to resend OTP. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Auto-send OTP on page load for verification flow (when user is logged in but email not verified)
  useEffect(() => {
    if (isVerificationFlow && email && !isLoadingProfile && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true;
      
      // Auto-send verification OTP email using vendor registration endpoint
      // This endpoint sends the OTP that works with the verify-email endpoint
      const resendUsername = profileData?.user?.name || email.split("@")[0];
      const name = resendUsername;
      
      autoSendMutation.mutate(
        {
          email,
          username: resendUsername,
          name,
          userType: "vendor",
        },
        {
          onSuccess: () => {
            // OTP sent successfully, user will see it in their email
          },
          onError: (error) => {
            // Reset ref on error so user can try again via "Get another one"
            console.error("Auto-send OTP error:", error);
            hasAutoSentRef.current = false;
          },
        }
      );
    }
  }, [isVerificationFlow, email, isLoadingProfile, profileData?.user?.name, autoSendMutation]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Show loading state while fetching profile for verification flow
  if (isVerificationFlow && isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
        <Card className="w-full max-w-md md:max-w-xl p-0 bg-bg-light border-none shadow-lg">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if we don't have an email
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
        <Card className="w-full max-w-md md:max-w-xl p-0 bg-bg-light border-none shadow-lg">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Unable to load email. Please try again.</p>
              <Button onClick={() => router.push(isRegistrationFlow ? "/vendor/create-account" : "/vendor")}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
      <Card className="w-full max-w-md md:max-w-xl p-0 bg-bg-light border-none shadow-lg">
        <CardContent className="p-6 sm:p-8 md:p-10 space-y-8">
          {/* Heading Section */}
          <div className="text-center space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide wrap-break-word">
              VERIFY YOUR EMAIL ADDRESS
            </h1>

            {/* Email text */}
            <div className="space-y-1.5">
              <p className="text-sm sm:text-base text-black/80">
                We&apos;ve emailed a security code to
              </p>
              <p className="text-sm sm:text-base font-semibold text-black break-all">
                {email}
              </p>
            </div>

            {/* Spam folder text and wrong email link */}
            <p className="text-xs sm:text-sm text-black/70">
              If you can&apos;t find it, check your spam folder.{" "}
              <Link
                href="/vendor/create-account"
                className="text-secondary underline-offset-2 hover:text-secondary/80 hover:underline transition-colors font-medium"
              >
                Wrong email?
              </Link>
            </p>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <div className="flex justify-center gap-2.5 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  aria-label={`OTP digit ${index + 1}`}
                  className="w-11 h-11 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold bg-bg-medium border border-border focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-0 focus:border-secondary transition-all shadow-sm hover:border-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ))}
            </div>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCancel}
                type="button"
                variant="secondary"
                className="w-full sm:flex-1 h-11 sm:h-12 font-bold uppercase tracking-wide font-heading text-sm sm:text-base bg-bg-medium text-black hover:bg-bg-light border-0"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleVerify}
                type="button"
                variant="secondary"
                disabled={otp.join("").length !== 6 || verifyMutation.isPending}
                className="w-full sm:flex-1 h-11 sm:h-12 font-bold uppercase tracking-wide font-heading text-sm sm:text-base"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    VERIFYING...
                  </>
                ) : (
                  "VERIFY"
                )}
              </Button>
            </div>
          </div>

          {/* Resend code link */}
          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm text-black/70">
              Still no code?{" "}
              <button
                onClick={handleResend}
                type="button"
                disabled={resendMutation.isPending}
                className="text-secondary underline-offset-2 hover:text-secondary/80 hover:underline transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendMutation.isPending ? "Sending..." : "Get another one."}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
          <Card className="w-full max-w-md md:max-w-xl p-0 bg-bg-light border-none shadow-lg">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin border-4 border-solid border-primary border-r-transparent" style={{ borderRadius: '50%' }}></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

