"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Link from "next/link";

import { useVendorRegistration } from "@/hooks/vendor/(auth)/use-vendor-registration";
import { useVerifyEmail } from "@/hooks/vendor/(auth)/use-verify-email";
import { Card, CardContent } from "@/components/ui/card";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "verify@gmail.com";
  const userId = searchParams.get("userId") || "";
  const username = searchParams.get("username") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyMutation = useVerifyEmail();
  const resendMutation = useVendorRegistration();

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
      if (!userId) {
        toast.error("User ID is missing. Please try registering again.");
        return;
      }

      console.log("otpCode", otpCode, "email", email, "userId", userId);
      const response = await verifyMutation.mutateAsync({
        userId,
        email,
        code: otpCode,
      });

      toast.success(
        response.message || "Email verified successfully"
      );

      // Get userId from response if available, otherwise use from URL params
      const finalUserId = response.userId || userId;

      // Always redirect to add phone number page after successful email verification
      setTimeout(() => {
        if (finalUserId) {
          router.push(`/vendor/add-phone?userId=${encodeURIComponent(finalUserId)}&email=${encodeURIComponent(email)}`);
        } else {
          // Fallback: if no userId, still try to go to add-phone (API might handle it)
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
    router.push("/vendor/create-account");
  };

  const handleResend = async () => {
    try {
      // Get username from search params if available, otherwise use email as fallback
      const resendUsername = username || email.split("@")[0];
      // For resend, we need name and userType - use username as name fallback
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

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
      <Card className="w-full max-w-md md:max-w-xl bg-bg-light border-none shadow-lg rounded-2xl">
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
                  className="w-11 h-11 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-0 focus:border-secondary transition-all shadow-sm hover:border-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              ))}
            </div>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancel}
                type="button"
                className="w-full sm:flex-1 h-11 sm:h-12 bg-bg-medium border border-border text-black font-bold uppercase tracking-wide hover:bg-bg-light hover:border-border/80 active:scale-[0.98] transition-all font-heading text-sm sm:text-base rounded-lg shadow-sm"
              >
                CANCEL
              </button>
              <button
                onClick={handleVerify}
                type="button"
                disabled={otp.join("").length !== 6 || verifyMutation.isPending}
                className="w-full sm:flex-1 h-11 sm:h-12 bg-secondary text-secondary-foreground font-bold uppercase tracking-wide hover:bg-secondary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-secondary font-heading text-sm sm:text-base rounded-lg shadow-md hover:shadow-lg"
              >
                {verifyMutation.isPending ? "VERIFYING..." : "VERIFY"}
              </button>
            </div>
          </div>

          {/* Resend code link */}
          <div className="text-center pt-2">
            <p className="text-xs sm:text-sm text-black/70">
              Still no code?{" "}
              <button
                onClick={handleResend}
                type="button"
                className="text-sm text-secondary underline-offset-2 hover:text-secondary/80 hover:underline transition-colors font-medium"
              >
                Get another one.
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
          <Card className="w-full max-w-md md:max-w-xl bg-bg-light border-none shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
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

