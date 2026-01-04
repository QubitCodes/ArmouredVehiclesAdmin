"use client";

import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerificationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-medium flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="relative">
            {/* Horizontal connecting line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border"></div>

            {/* Steps Container */}
            <div className="relative flex items-start justify-between w-full">
              {/* Step 1: Company Information */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Company Information
                </span>
              </div>

              {/* Step 2: Contact Person */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Contact Person
                </span>
              </div>

              {/* Step 3: Declaration */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Declaration
                </span>
              </div>

              {/* Step 4: Account Preferences */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Account Preferences
                </span>
              </div>

              {/* Step 5: Add Bank account */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Add Bank account
                </span>
              </div>

              {/* Step 6: Verification */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Verification
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Content */}
        <div className="bg-bg-light p-12 rounded-lg shadow-lg">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold text-black uppercase">
              Verification Complete
            </h2>

            {/* Message */}
            <div className="max-w-2xl space-y-4">
              <p className="text-lg text-gray-700">
                Thank you for completing the onboarding process!
              </p>
              <p className="text-base text-gray-600">
                Your account is now being reviewed by our team. You will receive
                a notification once your account has been verified and activated.
              </p>
              <p className="text-base text-gray-600">
                In the meantime, you can access your dashboard to view your
                account status.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8">
              <Button
                type="button"
                variant="secondary"
                className="bg-bg-medium text-black hover:bg-bg-light font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/bank-account")}
              >
                BACK
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor")}
              >
                GO TO DASHBOARD
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

