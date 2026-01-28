"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { authService } from "@/services/admin/auth.service";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Mail, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QuickLoginBox } from "@/components/debug/QuickLoginBox";

// Schema for initial step
const identifierSchema = z.object({
  identifier: z.string().min(1, "Email or Phone number is required"),
});

type IdentifierFormValues = z.infer<typeof identifierSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'IDENTIFIER' | 'OTP' | 'EMAIL_SENT'>('IDENTIFIER');
  const [loading, setLoading] = useState(false);
  const [identifierDetails, setIdentifierDetails] = useState<{ type: 'email' | 'phone'; value: string } | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form setup
  const form = useForm<IdentifierFormValues>({
    resolver: zodResolver(identifierSchema),
    defaultValues: { identifier: "" },
  });

  // Check for Magic Link on Mount
  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      handleMagicLinkVerification();
    }
  }, []);

  const handleMagicLinkVerification = async () => {
    setLoading(true);
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }

    if (!email) {
      setLoading(false);
      toast.error("Email is required to verify login.");
      return;
    }

    try {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      const token = await result.user.getIdToken();
      await completeLogin(token);
      window.localStorage.removeItem('emailForSignIn');
    } catch (error: any) {
      console.error("Magic Link Error", error);
      toast.error(error.message || "Failed to sign in with link");
      setLoading(false);
    }
  };


  const completeLogin = async (idToken: string) => {
    try {
      await authService.loginWithFirebase(idToken);
      toast.success("Login successful");
      router.push("/admin"); // Dashboard
    } catch (error: any) {
      console.error("Backend Login Error", error);
      toast.error(error.message || "Failed to authenticate with server");
      setLoading(false);
      setStep('IDENTIFIER'); // Reset
    }
  };

  // Setup Recaptcha
  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Response expired
          toast.error("Recaptcha expired, please try again.");
        }
      });
    }
  };

  const onSubmit = async (data: IdentifierFormValues) => {
    setLoading(true);
    try {
      // 1. Check User Exists
      const check = await authService.checkUserExists(data.identifier);

      const type = check.data.identifier_type;
      const validIdentifier = check.data.identifier; // Formatted E.164 if phone

      setIdentifierDetails({ type, value: validIdentifier });

      if (type === 'phone') {
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmation = await signInWithPhoneNumber(auth, validIdentifier, appVerifier);
        setConfirmationResult(confirmation);
        setStep('OTP');
        toast.success("OTP sent to your phone");
      } else {
        // Email Magic Link
        const actionCodeSettings = {
          url: window.location.href, // Redirect back here
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, validIdentifier, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', validIdentifier);
        setStep('EMAIL_SENT');
        toast.success("Magic link sent to your email");
      }

    } catch (error: any) {
      console.error("Login Start Error", error);
      toast.error(error.message || "Failed to start login");
    } finally {
      setLoading(false);
    }
  };

  // OTP Handling
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6 || !confirmationResult) return;
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(code);
      const token = await result.user.getIdToken();
      await completeLogin(token);
    } catch (error: any) {
      console.error("OTP Verify Error", error);
      toast.error("Invalid OTP code");
      setLoading(false);
    }
  };

  if (step === 'EMAIL_SENT') {
    return (
      <CenteredLayout>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-xl font-bold uppercase">Check your Inbox</h2>
          <p className="text-muted-foreground">
            We sent a magic login link to <br />
            <span className="font-bold text-foreground">{identifierDetails?.value}</span>
          </p>
          <Button variant="outline" onClick={() => setStep('IDENTIFIER')} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Different Method
          </Button>
        </div>
      </CenteredLayout>
    );
  }

  if (step === 'OTP') {
    return (
      <CenteredLayout>
        <div className="text-center space-y-4 mb-6">
          <h2 className="text-xl font-bold uppercase">Verify OTP</h2>
          <p className="text-muted-foreground text-sm">
            Enter the code sent to {identifierDetails?.value}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl font-bold border rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary bg-background"
              value={digit}
              maxLength={1}
              onChange={(e) => handleOtpChange(i, e.target.value)}
            />
          ))}
        </div>

        <div className="space-y-3">
          <Button
            className="w-full font-bold uppercase"
            variant="secondary"
            onClick={verifyOtp}
            disabled={otp.join("").length !== 6 || loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Verify Code"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setStep('IDENTIFIER')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout>
      <div id="recaptcha-container"></div>
      <CardHeader className="py-8 gap-0 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          Admin Login
        </h1>
        <p className="text-muted-foreground">
          Secure Access
        </p>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Email or Phone Number"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="secondary"
              disabled={loading}
              className="w-full font-bold uppercase py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="mt-8"><QuickLoginBox /></div>
    </CenteredLayout>
  );
}

// Reusable Layout Component
function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-start relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/army.jpg')" }}
    >
      <div className="absolute inset-0 z-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-md p-4 md:ml-16">
        <Card className="bg-card/95 border-border/50 shadow-2xl backdrop-blur-sm">
          {children}
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <CenteredLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </CenteredLayout>
    }>
      <LoginContent />
    </Suspense>
  );
}
