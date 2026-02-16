"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Link from "next/link";
import * as z from "zod";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import api from "@/lib/api";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const registrationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters"),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "You must accept the Terms of Sale"),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function CreateSupplierAccountPage() {
  const router = useRouter();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      termsAccepted: false,
    },
  });

  const { sendMagicLink, loading: firebaseLoading } = useFirebaseAuth();

  const onSubmit = async (data: RegistrationFormValues) => {
    try {
      // 1. Check if user exists
      try {
        const checkRes = await api.post("/auth/user-exists", { identifier: data.email });
        if (checkRes.status === 200) {
          toast.error("User with this email already exists. Please login.");
          return;
        }
      } catch (e: any) {
        if (e.response?.status !== 404) {
          throw e;
        }
      }

      // 2. Save form data for later recovery
      const formData = {
        name: data.name,
        email: data.email,
        username: data.username,
        userType: "vendor",
        termsAccepted: data.termsAccepted
      };
      localStorage.setItem('vendor_reg_form', JSON.stringify(formData));

      // 3. Send Magic Link
      await sendMagicLink(data.email, `${window.location.origin}/vendor/verify-email`);

      toast.success("Magic Link sent! Please check your email.");

      // 4. Redirect to verify-email
      router.push(`/vendor/verify-email?email=${encodeURIComponent(data.email)}`);

    } catch (error) {
      console.error(error);
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to start registration.";
      toast.error(errorMessage);
    }
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

          {/* ─── Right side (xl+): Registration Card ─── */}
          <div className="w-full max-w-lg">
            <Card className="bg-white/70 backdrop-blur-sm border-t-[3px] border-[#D35400] shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">

              {/* Shield icon */}
              <div className="mx-auto mt-8 mb-2 w-12 h-12 flex items-center justify-center rounded-full bg-[#3D4A26]/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3D4A26]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <CardHeader className="pb-3 pt-2 gap-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground uppercase tracking-wider text-center">
                  Create Your Supplier Account
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                  Enter your details to get started
                </p>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-0 relative"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter Your Name"
                              className="border border-gray-300 focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]/30 h-12 text-sm transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-0 mt-4">
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Email Address"
                              className="border border-gray-300 focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]/30 h-12 text-sm transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="space-y-0 mt-4">
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Enter Your Username"
                              className="border border-gray-300 focus:border-[#D35400] focus:ring-1 focus:ring-[#D35400]/30 h-12 text-sm transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-600 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 mt-1 accent-[#D35400] cursor-pointer"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <label className="text-sm text-muted-foreground font-medium cursor-pointer">
                              I have read and agree to the <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/terms-of-sale`} target="_blank" className="text-[#D35400] font-bold hover:underline">Terms of Sale</Link>
                            </label>
                            <FormMessage className="text-red-600 text-xs" />
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="relative w-full mt-6">
                      <Button
                        type="submit"
                        disabled={firebaseLoading}
                        className="w-full font-bold uppercase tracking-wider py-3.5 text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 relative overflow-visible clip-path-supplier"
                      >
                        {firebaseLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            CONTINUE
                            <ArrowRight className="w-5 h-5" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/vendor/login"
                      className="text-[#D35400] font-semibold underline underline-offset-2 hover:text-[#D35400]/80 transition-colors"
                    >
                      Login
                    </Link>
                  </p>
                </div>
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
