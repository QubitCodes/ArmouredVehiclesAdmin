"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Link from "next/link";

import { useLoginStart } from "@/hooks/admin/(auth)/use-login";
import { useVerifyOtp } from "@/hooks/admin/(auth)/use-verify-otp";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Support both 'identifier' and 'email' (legacy) params
  const identifier = searchParams.get("email") || searchParams.get("identifier") || "user";
  const redirect = searchParams.get("redirect") || "/admin";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyMutation = useVerifyOtp();
  const resendMutation = useLoginStart();

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
      const response = await verifyMutation.mutateAsync({
        identifier,
        code: otpCode,
      });
      // Store User Details in Local Storage
      if (response && response.user) {
        // Dynamic import to avoid circular dependency or client side issues, though imports are fine in client component
        // But better to use the imported service instance
        // Assuming we import it at top level
        // Actually, let's just make sure we imported authService
      }
      
      // Need to import authService at top
      // Doing it via replace_file_content requires importing it. 
      // I will add import first.
      
      const { authService } = await import("@/services/admin/auth.service");
      authService.setUserDetails(response.user);

      toast.success(
        response.message || "Verified successfully"
      );

      // Redirect to intended destination or dashboard after successful verification
      setTimeout(() => {
        router.push(redirect);
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
    router.push("/admin/login");
  };

  const handleResend = async () => {
    try {
      const response = await resendMutation.mutateAsync({
        identifier,
      });

      toast.success(
        response.message || "OTP resent successfully! Please check your email/phone."
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
      <Card className="w-full max-w-md md:max-w-xl p-0 bg-bg-light border-none shadow-lg">
        <CardContent className="p-6 sm:p-8 md:p-10 space-y-8">
          {/* Heading Section */}
          <div className="text-center space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide wrap-break-word">
              VERIFY YOUR IDENTITY
            </h1>

            {/* Identifier text */}
            <div className="space-y-1.5">
              <p className="text-sm sm:text-base text-black/80">
                We&apos;ve sent a security code to
              </p>
              <p className="text-sm sm:text-base font-semibold text-black break-all">
                {identifier}
              </p>
            </div>

            {/* Spam folder text and wrong identifier link */}
            <p className="text-xs sm:text-sm text-black/70">
              If you can&apos;t find it, check your spam/messages.{" "}
              <Link
                href="/admin/login"
                className="text-secondary underline-offset-2 hover:text-secondary/80 hover:underline transition-colors font-medium"
              >
                Wrong details?
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
