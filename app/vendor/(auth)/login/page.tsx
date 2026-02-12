

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import api from "@/lib/api";
import { vendorAuthService } from "@/services/vendor/auth.service";
import { authService } from "@/services/admin/auth.service";

function VendorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detect Magic Link URL immediately
  const isMagicLinkRedirect = searchParams.get('mode') === 'signIn' && !!searchParams.get('oobCode');

  const [identifier, setIdentifier] = useState("");
  const [stage, setStage] = useState<"start" | "verify" | "magic_link_sent">("start");
  const [loading, setLoading] = useState(isMagicLinkRedirect);
  const [isVerifyingLink, setIsVerifyingLink] = useState(isMagicLinkRedirect);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Firebase Hook
  const { sendPhoneOtp, verifyPhoneOtp, sendMagicLink, verifyMagicLink, isMagicLink } = useFirebaseAuth();
  const [confirmationResult, setConfirmationResult] = useState<any>(null); // Store Firebase confirmation result

  const isEmail = (value: string) => value.includes("@");

  // Magic Link Verification Effect
  const processingRef = useRef(false);

  useEffect(() => {
    const checkMagicLink = async () => {
      if (processingRef.current) return;

      if (isMagicLink(window.location.href)) {
        processingRef.current = true;
        setLoading(true);
        setIsVerifyingLink(true);

        try {
          // Try to get email from storage
          let email = window.localStorage.getItem('emailForSignIn');
          if (!email) {
            email = window.prompt('Please provide your email for confirmation');
          }
          if (!email) {
            setLoading(false);
            setIsVerifyingLink(false);
            processingRef.current = false;
            return;
          }

          const credential = await verifyMagicLink(email);
          const idToken = await credential.user.getIdToken();
          await completeLogin(idToken);
        } catch (err: any) {
          console.error(err);
          if (err.code !== 'auth/invalid-action-code') {
            toast.error(err.message || "Failed to verify magic link");
          }
          setLoading(false);
          setIsVerifyingLink(false);
        }
      }
    };
    checkMagicLink();
  }, [isMagicLink, verifyMagicLink]);

  // Redirect Logic
  const handleRedirect = (user: any) => {
    // 1. Phone Missing -> Add Phone
    if (!user.phone) {
      router.push(`/vendor/add-phone?email=${encodeURIComponent(user.email || '')}`);
      return;
    }

    // 2. Phone Not Verified -> Verify Phone
    if (!user.phone_verified) {
      // Pass email/phone to help verify page trigger OTP if needed
      router.push(`/vendor/verify-phone?email=${encodeURIComponent(user.email || '')}&phone=${encodeURIComponent(user.phone)}`);
      return;
    }

    // 3. Profile Check (Soft deleted or missing) -> Step 0
    const profile = user.profile;
    if (!profile) {
      router.push('/vendor/company-information'); // Step 0
      return;
    }

    // 4. Onboarding Status / Step Check
    const status = profile.onboarding_status || 'not_started';
    const currentStep = profile.current_step ?? user.onboardingStep;

    // A. If status implies completion or review (or rejection/suspension), go to dashboard
    // if (['approved', 'pending_approval', 'rejected', 'suspended'].includes(status)) {
    //   router.push("/vendor");
    //   return;
    // }

    // B. If step is missing, default to Step 0
    if (currentStep === null || currentStep === undefined) {
      router.push('/vendor');
      return;
    }

    // C. Map Steps
    // C. Map Steps
    switch (currentStep) {
      case 0:
      case 1: router.push('/vendor/company-information'); break;
      case 2: router.push('/vendor/contact-person'); break;
      case 3: router.push('/vendor/declaration'); break;
      case 4: router.push('/vendor/account-preferences'); break;
      case 5: router.push('/vendor/bank-account'); break;
      case 6: router.push('/vendor/verification'); break;
      default: router.push('/vendor');
    }
  };

  const completeLogin = async (idToken: string) => {
    try {
      const response = await api.post("/auth/firebase/verify", { idToken });
      const { status, data, message } = response.data;

      if (status && data) {
        if (data.accessToken && data.refreshToken) {
          // Clear any conflicting admin sessions
          authService.clearTokens();
          vendorAuthService.setTokens(data.accessToken, data.refreshToken);
        } else if (data.token) {
          authService.clearTokens();
          vendorAuthService.setAccessToken(data.token);
        }

        if (data.user) {
          vendorAuthService.setUserDetails(data.user);
          toast.success("Login Successful!");
          handleRedirect(data.user);
        } else {
          // Fallback
          toast.success("Login Successful!");
          router.push("/vendor");
        }
      } else {
        throw new Error(message || "Login failed");
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Login failed on server");
      setIsVerifyingLink(false);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    let input = identifier.trim();
    if (!input) {
      toast.error("Please enter your email or phone number.");
      return;
    }

    try {
      setLoading(true);

      // 1. Check if user exists & get formatted identifier
      let cleanIdentifier = input;
      try {
        const checkRes = await api.post("/auth/user-exists", { identifier: input, userType: 'vendor' });

        // DEV BACKDOOR
        if (checkRes.data?.data?.bypass) {
          const { user, accessToken, refreshToken } = checkRes.data.data;
          console.log('[DEV-AUTH] Backdoor triggered for:', user.email);

          vendorAuthService.setTokens(accessToken, refreshToken);
          vendorAuthService.setUserDetails(user);
          toast.success("Dev Login Successful!");
          handleRedirect(user);
          return;
        }

        // Response structure: { status: true, data: { exists: true, identifier: "+971..." } }
        // Or if 404, axios throws error (handled below) or returns status 404 depending on interceptor?
        // Standard axios throws on 4xx.

        if (checkRes.data?.data?.identifier) {
          cleanIdentifier = checkRes.data.data.identifier;
        }

      } catch (e: any) {
        if (e.response?.status === 404) {
          toast.error("User not found. Please register first.");
          router.push('/vendor/create-account');
          return;
        }
        // If other error, proceed with input as is (maybe backend is down, let firebase try)
        console.warn("User check failed, proceeding with raw input", e);
      }

      // 2. Trigger Firebase Auth
      if (isEmail(cleanIdentifier)) {
        await sendMagicLink(cleanIdentifier, window.location.href);
        setStage("magic_link_sent");
        toast.success(`Magic link sent to ${cleanIdentifier}.`);
      } else {
        // Phone: Use the clean, standardized identifier from backend
        // This prevents format mismatch errors (e.g. 050 vs +97150)
        const phoneToUse = cleanIdentifier.startsWith('+') ? cleanIdentifier : `+${cleanIdentifier.replace(/\D/g, '')}`;

        const res = await sendPhoneOtp(phoneToUse, 'recaptcha-container');
        setConfirmationResult(res);
        setStage("verify");
        toast.success("OTP Sent!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start login");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    if (!confirmationResult) {
      toast.error("Session expired.");
      setStage('start');
      return;
    }

    try {
      setLoading(true);
      const credential = await verifyPhoneOtp(confirmationResult, code);
      const idToken = await credential.user.getIdToken();
      await completeLogin(idToken);
    } catch (err: any) {
      toast.error(err.message || "Invalid Code");
      setLoading(false);
    }
  };

  // OTP Helpers
  const handleOtpChange = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, "").slice(0, 1);
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };


  return (
    <div
      className="min-h-screen flex items-center justify-start relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/army.jpg')",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-md p-4 md:ml-8 lg:ml-16">
        <Card className="bg-card border-2 border-border shadow-2xl overflow-hidden px-2">
          <CardHeader className="pb-4 pt-6 gap-0">
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide text-center">
              Vendor Login
            </h1>
            <p className=" text-muted-foreground text-center">
              {isVerifyingLink ? "Authenticating..." :
                stage === 'start' ? "Enter your details to get started" :
                  stage === 'verify' ? "Enter the security code sent to your phone" :
                    "Check your inbox"}
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">

            {/* Hidden Recaptcha */}
            <div id="recaptcha-container"></div>

            {isVerifyingLink ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="font-medium text-lg">Verifying Access</p>
                  <p className="text-sm text-muted-foreground">Please wait while we log you in...</p>
                </div>
              </div>
            ) : stage === 'magic_link_sent' ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">
                  We sent a login link to <strong>{identifier}</strong>.<br />
                  Click the link in the email to sign in.
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setStage('start')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            ) : stage === 'verify' ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 border border-gray-400 text-center text-lg font-bold rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                    />
                  ))}
                </div>
                <Button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading}
                  className="w-full font-bold uppercase py-3"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                  {loading ? "Verifying..." : "Verify"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStage('start')}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContinue} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Email or Phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11"
                  autoFocus
                />
                <Button
                  type="submit"
                  className="w-full font-bold uppercase py-3"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                  {loading ? "Checking..." : "Continue"}
                </Button>
              </form>
            )}

            {/* Registration Link */}
            {stage === 'start' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/vendor/create-account"
                    className="text-secondary font-semibold hover:text-secondary/80 underline-offset-2 hover:underline transition-colors"
                  >
                    Register as Vendor
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorLoginContent />
    </Suspense>
  );
}
