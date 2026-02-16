"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
  const [showPdfModal, setShowPdfModal] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Firebase Hook
  const { sendPhoneOtp, verifyPhoneOtp, sendMagicLink, verifyMagicLink, isMagicLink } = useFirebaseAuth();
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

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
    if (!user.phone) {
      router.push(`/vendor/add-phone?email=${encodeURIComponent(user.email || '')}`);
      return;
    }
    if (!user.phone_verified) {
      router.push(`/vendor/verify-phone?email=${encodeURIComponent(user.email || '')}&phone=${encodeURIComponent(user.phone)}`);
      return;
    }
    const profile = user.profile;
    if (!profile) {
      router.push('/vendor/company-information');
      return;
    }
    const currentStep = profile.current_step ?? user.onboardingStep;
    if (currentStep === null || currentStep === undefined) {
      router.push('/vendor');
      return;
    }
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

        if (checkRes.data?.data?.identifier) {
          cleanIdentifier = checkRes.data.data.identifier;
        }

      } catch (e: any) {
        if (e.response?.status === 404) {
          toast.error("User not found. Please register first.");
          router.push('/vendor/create-account');
          return;
        }
        console.warn("User check failed, proceeding with raw input", e);
      }

      if (isEmail(cleanIdentifier)) {
        await sendMagicLink(cleanIdentifier, window.location.href);
        setStage("magic_link_sent");
        toast.success(`Magic link sent to ${cleanIdentifier}.`);
      } else {
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
    <>
      <section className="relative w-full min-h-[calc(100vh-64px)] xl:h-[calc(100vh-64px)] xl:overflow-hidden bg-[#F5F2EA]">

        {/* ── Radial gradient overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, rgba(245,242,234,1) 0%, rgba(224,218,204,0.8) 60%, rgba(200,194,178,0.6) 100%)',
          }}
        />

        {/* ── Diagonal olive geometric panel on LEFT (xl+ only) ── */}
        <div
          className="hidden xl:block absolute top-0 left-0 w-[45%] h-full pointer-events-none"
          style={{
            background: 'linear-gradient(225deg, #3D4A26 0%, #2E3A1A 100%)',
            clipPath: 'polygon(0 0, 75% 0, 90% 100%, 0 100%)',
          }}
        />
        {/* ── Subtle accent stripe ── */}
        <div
          className="hidden xl:block absolute top-0 left-0 w-[45%] h-full pointer-events-none opacity-10"
          style={{
            clipPath: 'polygon(72% 0, 68% 0, 86% 100%, 90% 100%)',
            background: '#D35400',
          }}
        />

        {/* ── Content container ── */}
        <div className="relative z-10 max-w-[1720px] mx-auto px-6 xl:px-[140px] flex flex-col xl:flex-row-reverse items-center justify-between gap-8 py-10 xl:py-0 h-full">

          {/* ─── Right side (xl+): Login Card ─── */}
          <div className="w-full max-w-md">
            <Card className="bg-white/70 backdrop-blur-sm border-t-[3px] border-[#D35400] shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">

              {/* Shield icon */}
              <div className="mx-auto mt-8 mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-[#3D4A26]/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3D4A26]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <CardHeader className="pb-4 pt-2 gap-0">
                <h1 className="text-2xl font-bold text-foreground uppercase tracking-wider text-center">
                  Vendor Login
                </h1>
                <p className="text-muted-foreground text-center text-sm">
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
                          className="w-12 h-12 border border-gray-400 text-center text-lg font-bold rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#D35400] focus:border-transparent transition-all"
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
                        className="text-[#D35400] font-semibold hover:text-[#D35400]/80 underline-offset-2 hover:underline transition-colors"
                      >
                        Register as Vendor
                      </Link>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Left side (xl+): Vendor Onboarding Card ─── */}
          <div className="flex items-center justify-center w-full xl:w-auto xl:mt-0">
            <div className="w-full max-w-[420px] bg-white/20 backdrop-blur-sm border border-white/40 rounded-[20px] p-10 text-center shadow-lg transition-shadow duration-300 hover:shadow-xl xl:bg-white/10 xl:border-white/20">

              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#D35400]/10 xl:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#D35400] xl:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-widest text-black xl:text-white mb-2">
                Vendor Onboarding
              </h3>
              <p className="text-xs text-gray-600 xl:text-white/70 mb-6">
                Preview and download the onboarding guide
              </p>

              {/* View Guide Button */}
              <button
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center justify-center w-full sm:w-[270px] h-[48px] mx-auto bg-white text-[#3D4A26] xl:bg-white xl:text-[#3D4A26] font-bold text-[14px] uppercase transition-all duration-300 hover:bg-[#D35400] hover:text-white hover:scale-[1.03] clip-path-supplier cursor-pointer"
              >
                View Guide
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* ── PDF Preview Modal ── */}
      {showPdfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowPdfModal(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-[16px] font-bold uppercase text-[#1a1a1a] tracking-wide">
                Vendor Onboarding Guide
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href="/api/pdf/vendor_onboarding_pack.pdf"
                  download
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#D35400] text-white text-sm font-semibold rounded hover:bg-[#39482C] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                  </svg>
                  Download
                </a>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-black cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-100">
              <object
                data="/api/pdf/vendor_onboarding_pack.pdf#toolbar=0&navpanes=0&scrollbar=0"
                type="application/pdf"
                className="w-full h-full"
              >
                <embed
                  src="/api/pdf/vendor_onboarding_pack.pdf#toolbar=0&navpanes=0&scrollbar=0"
                  type="application/pdf"
                  className="w-full h-full"
                />
              </object>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}>
      <VendorLoginContent />
    </Suspense>
  );
}
