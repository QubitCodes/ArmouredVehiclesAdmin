"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { vendorAuthService } from "@/services/vendor/auth.service";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

function VerifyPhoneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const userId = searchParams.get("userId") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(60);

  // Derive canResend from resendTimer instead of using state
  const canResend = resendTimer === 0;

  const { verifyPhoneOtp, sendPhoneOtp, loading: firebaseLoading } = useFirebaseAuth();

  // Mask phone number for display (show only last 2 digits)
  const maskPhone = (phoneNumber: string) => {
    if (!phoneNumber) return "";
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length <= 2) return phoneNumber;
    const lastTwo = cleaned.slice(-2);
    const masked = "x".repeat(cleaned.length - 2);
    return `+${masked}${lastTwo}`;
  };

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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

  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Trigger initial OTP on mount if we have a phone
  useEffect(() => {
    if (phone && !confirmationResult) {
      handleResend();
    }
  }, [phone]);

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    try {
      if (!confirmationResult) {
        toast.error("Session expired. Please resend code.");
        return;
      }

      const userCred = await verifyPhoneOtp(confirmationResult, otpCode);
      const idToken = await userCred.user.getIdToken();

      const response = await api.post("/auth/firebase/verify", { idToken });
      const { status, data, message } = response.data;

      if (status && data) {
        if (data.accessToken && data.refreshToken) {
          vendorAuthService.setTokens(data.accessToken, data.refreshToken);
        }
        if (data.user) {
          vendorAuthService.setUserDetails(data.user);
        }
        toast.success("Phone verified successfully!");
        router.push("/vendor");
      } else {
        throw new Error(message || "Verification failed on server");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Invalid code. Please try again.");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!phone) return;

    try {
      const res = await sendPhoneOtp(phone, 'recaptcha-container');
      setConfirmationResult(res);
      setResendTimer(60);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      toast.success("Security code sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send code.");
    }
  };

  const handleBack = () => {
    router.push(`/vendor/add-phone?userId=${encodeURIComponent(userId)}`);
  };

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
      <Card className="bg-bg-light border-0 shadow-lg overflow-hidden px-6 py-8 w-full max-w-lg">
        <CardContent className="p-0 space-y-2">
          {/* Header with back button and title */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              type="button"
              className="flex items-center justify-center w-10 h-10 hover:bg-black/5 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide font-heading">
              ENTER SECURITY CODE
            </h1>
          </div>

          {/* Phone number text */}
          <div>
            <p className="text-sm text-center text-black/80">
              We sent a security code to:{" "}
              <span className="font-semibold">{maskPhone(phone)}</span>
            </p>
          </div>

          {/* OTP Input Fields */}
          <div className="flex justify-center gap-2.5 sm:gap-3 py-5">
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
                aria-label={`Security code digit ${index + 1}`}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold bg-bg-medium border border-black/20 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-0 focus:border-secondary transition-all shadow-sm hover:border-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            ))}
          </div>

          {/* Verify Button */}
          <div className="relative w-full">
            <Button
              onClick={handleVerify}
              variant="secondary"
              disabled={
                otp.join("").length !== 6 || verifyPhoneMutation.isPending
              }
              className="w-full font-bold uppercase tracking-wider py-3.5 text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 relative overflow-visible"
              style={{
                clipPath:
                  "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
              }}
            >
              {firebaseLoading ? "VERIFYING..." : "VERIFY"}
            </Button>
          </div>

          {/* Resend timer */}
          <div className="text-center pt-3">
            {canResend ? (
              <button
                onClick={handleResend}
                type="button"
                disabled={resendPhoneMutation.isPending}
                className="text-sm text-secondary underline-offset-2 hover:text-secondary/80 hover:underline transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendPhoneMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Resend security code"
                )}
              </button>
            ) : (
              <p className="text-xs text-black/70">
                You can resend the security code in {resendTimer} seconds.
              </p>
            )}
          </div>
          <div id="recaptcha-container"></div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg-light px-4 py-8">
          <Card className="bg-bg-light border-0 shadow-lg overflow-hidden px-6 py-8 w-full max-w-lg">
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
      <VerifyPhoneContent />
    </Suspense>
  );
}
