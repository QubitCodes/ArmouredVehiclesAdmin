"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get("email");
  const { verifyMagicLink, isMagicLink, sendMagicLink, loading } = useFirebaseAuth();

  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // 1. Recover Email
    let currentEmail = urlEmail;
    if (!currentEmail) {
      currentEmail = window.localStorage.getItem('emailForSignIn') || "";
    }
    // Fallback to local storage form
    if (!currentEmail) {
      const saved = localStorage.getItem('vendor_reg_form');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          currentEmail = parsed.email;
        } catch (e) { }
      }
    }

    if (currentEmail) setEmail(currentEmail);

    // 2. Check if this is a Magic Link return
    if (isMagicLink(window.location.href)) {
      setVerifying(true);
      if (!currentEmail) {
        // Prompt if absolutely needed, or fail
        const input = window.prompt("Please confirm your email to verify:");
        if (input) currentEmail = input;
      }

      if (currentEmail) {
        handleVerifyLink(currentEmail);
      } else {
        toast.error("Could not determine email for verification.");
        setVerifying(false);
      }
    }
  }, [urlEmail]);

  const handleVerifyLink = async (verifyEmail: string) => {
    try {
      await verifyMagicLink(verifyEmail);
      toast.success("Email Verified! Redirecting...");
      // Redirect to Add Phone
      // Pass email to help next step
      router.push(`/vendor/add-phone?email=${encodeURIComponent(verifyEmail)}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Verification failed");
      setVerifying(false); // Show UI so they can resend
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await sendMagicLink(email, `${window.location.origin}/vendor/verify-email`);
      toast.success("Link resent! Check your inbox.");
    } catch (e: any) {
      toast.error(e.message || "Failed to resend.");
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
        <Card className="w-full max-w-md p-6 bg-bg-light shadow-lg text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Verifying your email...</h2>
          <p className="text-sm text-gray-600">Please wait a moment.</p>
        </Card>
      </div>
    );
  }

  // Default "Check Inbox" View
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-medium px-4 py-8">
      <Card className="w-full max-w-md md:max-w-xl p-0 bg-bg-light border-none shadow-lg">
        <CardContent className="p-6 sm:p-8 md:p-10 space-y-8 text-center">

          <h1 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide">
            CHECK YOUR INBOX
          </h1>

          <div className="space-y-1.5">
            <p className="text-sm sm:text-base text-black/80">
              We&apos;ve sent a sign-in link to
            </p>
            <p className="text-sm sm:text-base font-semibold text-black break-all">
              {email || "your email"}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-black/70">
            Click the link in the email to sign in.
          </p>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-black/70 mb-4">
              Did not receive the link?
            </p>
            <Button
              onClick={handleResend}
              variant="outline"
              disabled={loading}
              className="w-full max-w-[200px]"
            >
              {loading ? "Sending..." : "Resend Link"}
            </Button>
          </div>

          <div className="pt-2">
            <Link href="/vendor/create-account" className="text-sm text-gray-500 hover:underline">
              Back to Registration
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// Helper spinner component since I removed the imports
function Spinner({ size, className }: { size?: "lg" | "sm", className?: string }) {
  return <Loader2 className={`animate-spin ${size === 'lg' ? 'w-8 h-8' : 'w-4 h-4'} ${className}`} />;
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

