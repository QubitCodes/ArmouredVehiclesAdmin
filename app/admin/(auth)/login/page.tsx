"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";


import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { authService } from "@/services/admin/auth.service";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [stage, setStage] = useState<"start" | "verify" | "magic_link_sent">("start");

  // OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Firebase Hook
  const { sendPhoneOtp, verifyPhoneOtp, sendMagicLink, verifyMagicLink, isMagicLink } = useFirebaseAuth();
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEmail = (value: string) => value.includes("@");

  // Magic Link Check on Load
  useEffect(() => {
    const checkMagicLink = async () => {
      if (isMagicLink(window.location.href)) {
        setIsLoading(true);
        try {
          // Try to get email from storage
          let email = window.localStorage.getItem('emailForSignIn');
          if (!email) {
            email = window.prompt('Please confirm your email for verification');
          }
          if (!email) {
            setIsLoading(false);
            return;
          }

          const credential = await verifyMagicLink(email);
          const idToken = await credential.user.getIdToken();
          await completeLogin(idToken);
        } catch (err: any) {
          console.error("Magic Link Error", err);
          toast.error(err.message || "Failed to verify magic link");
          setIsLoading(false);
        }
      }
    };
    checkMagicLink();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completeLogin = async (idToken: string) => {
    try {
      const res = await authService.verifyFirebase(idToken);
      toast.success(`Welcome back, ${res.user.name || 'Admin'}!`);

      // Redirect
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl && !returnUrl.includes('/login')) {
        router.replace(returnUrl);
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      console.error("Backend Login Error", err);
      toast.error(err.message || "Login failed on server");
      setIsLoading(false);
    }
  };

  const handleContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const input = identifier.trim();
    if (!input) {
      toast.error("Please enter your Email or Phone");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check if user exists in our DB
      const { exists, data } = await authService.checkUser(input);

      if (!exists) {
        toast.error("User not found. Please contact support if you are an admin.");
        setIsLoading(false);
        return;
      }

      // 2. Trigger Firebase Auth
      if (isEmail(input)) {
        await sendMagicLink(input);
        setStage("magic_link_sent");
        toast.success(`Magic link sent to ${input}`);
      } else {
        // Phone Logic
        // Use the standardized phone from backend if available, or clean input
        const phoneToUse = data?.phone
          ? (data.phone.startsWith('+') ? data.phone : `+${data.phone}`) // Ensure + if pulling raw from DB, but usually DB has country code separate or full. 
          // Actually AdminController updateAdmin ensures `phoneNumber` in firebase is E.164.
          // Step 2514: `formatPhoneForFirebase` combines country code.
          // Let's rely on input if data.phone is complex, but generally users type local.
          // Ideally we use the phone stored in DB to ensure it matches Firebase.
          // data from checkUser might be minimal. 
          // Let's trust the input or formatted input.
          : (input.startsWith('+') ? input : `+${input.replace(/\D/g, '')}`);

        // Note: If user types "050...", we need country code. 
        // Currently assuming input includes country code OR we might need strict E.164 input.
        // PROD: We should probably enforce strict format or provide country picker.
        // For now, assuming Admin knows to enter full phone or we use what's in DB if returned.
        // Let's use the DB phone if available as it's likely the correct Firebase identifier.
        const targetPhone = data?.identifier || phoneToUse;

        const res = await sendPhoneOtp(targetPhone, 'recaptcha-container');
        setConfirmationResult(res);
        setStage("verify");
        // Focus first input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }

    } catch (err: any) {
      console.error("Login Start Error", err);
      toast.error(err.message || "Failed to start login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    if (!confirmationResult) {
      toast.error("Session expired. Please try again.");
      setStage("start");
      return;
    }

    setIsLoading(true);
    try {
      const credential = await verifyPhoneOtp(confirmationResult, code);
      const idToken = await credential.user.getIdToken();
      await completeLogin(idToken);
    } catch (err: any) {
      console.error("Verify Error", err);
      toast.error("Invalid Code. Please try again.");
      setIsLoading(false);
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (index: number, value: string) => {
    const val = value.replace(/[^0-9]/g, "").slice(0, 1);
    const updated = [...otp];
    updated[index] = val;
    setOtp(updated);
    if (val && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const updated = [...otp];
        updated[index] = "";
        setOtp(updated);
        return;
      }
      if (index > 0) inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData("text");
    const digits = paste.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length > 0) {
      e.preventDefault();
      const filled = [...otp];
      digits.forEach((d, i) => { if (i < 6) filled[i] = d; });
      setOtp(filled);
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-start relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/army.jpg')" }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0 bg-black/40" />

      {/* Recaptcha Container (Hidden) */}
      <div id="recaptcha-container"></div>

      <div className="relative z-10 w-full max-w-md p-4 md:ml-8 lg:ml-16">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl overflow-hidden px-2">
          <CardHeader className="py-8 gap-1 text-center">
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-widest font-heading">
              Admin Login
            </h1>
            <p className="text-gray-500 text-sm">
              Secure Access Portal
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-8">

            {stage === 'start' && (
              <form onSubmit={handleContinue} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Email or Phone (e.g. +971...)"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-12 text-lg"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-bold bg-[#D35400] hover:bg-[#A04000] text-white uppercase tracking-widest transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking...</>
                  ) : (
                    <>Continue <ArrowRight className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </form>
            )}

            {stage === 'magic_link_sent' && (
              <div className="text-center py-4 space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                  <h3 className="font-bold text-green-800">Check your Inbox</h3>
                  <p className="text-green-700 text-sm mt-1">
                    We verified your account. A Magic Link has been sent to <strong>{identifier}</strong>.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStage('start')}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            )}

            {stage === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Enter the 6-digit code sent to your phone</p>
                </div>

                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { if (el) inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-bold border rounded-md border-gray-300 focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400] outline-none transition-all"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-bold bg-[#D35400] hover:bg-[#A04000] text-white uppercase tracking-widest transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStage('start')}
                  className="text-sm text-gray-500 hover:text-gray-800 w-full text-center underline decoration-dotted"
                >
                  Change Phone Number
                </button>
              </form>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Admin Portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
