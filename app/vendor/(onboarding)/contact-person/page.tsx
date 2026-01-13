"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Info, Upload, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import("@/components/vendor/pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 w-full">
      <div className="text-gray-500">Loading PDF preview...</div>
    </div>
  ),
});

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useOnboardingStep2 } from "@/hooks/vendor/dashboard/use-onboarding-step2";
import { OnboardingProgressBar } from "@/components/vendor/onboarding-progress-bar";
import { useOnboardingProfile } from "@/hooks/vendor/dashboard/use-onboarding-profile";

const contactPersonSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string().optional(),
  passport: z
    .any()
    .refine((file) => file !== undefined && file instanceof File, {
      message: "Passport Copy or Emirates ID is required",
    }),
  workEmail: z.string().email("Please enter a valid email address").min(1, "Work email is required"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  confirmAccuracy: z.boolean().refine((val) => val === true, {
    message: "You must confirm the accuracy of the information",
  }),
});

const phoneCountryCodes = [
  { value: "971", code: "+971", flag: "🇦🇪", label: "United Arab Emirates" },
  { value: "1", code: "+1", flag: "🇺🇸", label: "United States" },
  { value: "44", code: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { value: "91", code: "+91", flag: "🇮🇳", label: "India" },
  { value: "966", code: "+966", flag: "🇸🇦", label: "Saudi Arabia" },
];

type ContactPersonFormValues = z.infer<typeof contactPersonSchema>;

export default function ContactPersonPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);

  // Fetch onboarding profile data
  const { data: profileData, isLoading: isProfileLoading } = useOnboardingProfile();

  const step2Mutation = useOnboardingStep2();

  const form = useForm<ContactPersonFormValues>({
    resolver: zodResolver(contactPersonSchema),
    mode: "all", // Validate on change, blur, and submit to enable/disable button
    defaultValues: {
      fullName: "",
      jobTitle: "",
      workEmail: "",
      phoneCountryCode: "971",
      phoneNumber: "",
      confirmAccuracy: false,
    },
  });

  // Auto-fill form when profile data is available
  useEffect(() => {
    if (profileData?.profile && !isProfileLoading) {
      const p = profileData.profile;
      form.reset({
        fullName: p.contact_full_name || "",
        jobTitle: p.contact_job_title || "",
        workEmail: p.contact_work_email || "",
        phoneCountryCode: p.contact_mobile_country_code ? p.contact_mobile_country_code.replace('+', '') : "971",
        phoneNumber: p.contact_mobile || "",
        confirmAccuracy: p.terms_accepted || false,
      });

      // Handle file preview if URL exists
      if (p.contact_id_document_url) {
        setImagePreview(p.contact_id_document_url);
        const isPdf = p.contact_id_document_url.toLowerCase().endsWith('.pdf');
        setFileType(isPdf ? 'pdf' : 'image');
        
        // Dummy file for validation - we create a File object 
        // Note: In a real scenario handling existing files with RHF and Zod validation requiring proper File objects is tricky.
        // We use a dummy file here to satisfy "required" validation if the user doesn't change it.
        // If the user uploads a new file, it replaces this.
        const dummyFile = new File([""], "existing_file", { type: isPdf ? "application/pdf" : "image/jpeg" });
        form.setValue("passport", dummyFile);
      }
    }
  }, [profileData, isProfileLoading, form]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image or PDF
      if (file.type.startsWith("image/")) {
        form.setValue("passport", file, { shouldValidate: true });
        setFileType('image');
        // Create preview URL for image
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        form.setValue("passport", file, { shouldValidate: true });
        setFileType('pdf');
        // Create preview URL for PDF
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    form.setValue("passport", undefined, { shouldValidate: true });
    setImagePreview(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: ContactPersonFormValues) => {
    try {
      // Find the country code object to get the code with "+"
      const selectedPhoneCode = phoneCountryCodes.find(
        (code) => code.value === data.phoneCountryCode
      );

      // Prepare API payload
      const payload = {
        contactFullName: data.fullName,
        contactJobTitle: data.jobTitle || undefined,
        contactWorkEmail: data.workEmail,
        contactIdDocumentFile: data.passport as File | undefined,
        contactMobile: data.phoneNumber,
        contactMobileCountryCode: selectedPhoneCode?.code || `+${data.phoneCountryCode}`,
        termsAccepted: data.confirmAccuracy,
      };

      // Call the API
      await step2Mutation.mutateAsync(payload);

      toast.success("Contact person information saved successfully");

      // Navigate to declaration page
      router.push("/vendor/declaration");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to save contact person information. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-bg-medium flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl">
        {/* Progress Bar */}
        <OnboardingProgressBar currentStep={2} />

        {/* AUTHORIZED CONTACT PERSON Heading */}
        <div>
          <h2 className="text-2xl pb-3 font-bold text-black uppercase">
            AUTHORIZED CONTACT PERSON
          </h2>
        </div>

        {/* Form Container */}
        <div className="bg-bg-light p-6 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Full Name - Full Width */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Full Name <span className="text-red-500">*</span>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name."
                          className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Enter your complete name as it appears on your passport or ID.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 2-Column Grid for remaining fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Job Title */}
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Job Title
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Type Your Job Title."
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Upload Passport Copy or Emirates ID */}
                    <FormField
                      control={form.control}
                      name="passport"
                      render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Upload Passport Copy or Emirates ID{" "}
                            <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,application/pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              {imagePreview ? (
                                <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-bg-medium">
                                  {fileType === 'image' ? (
                                    <img
                                      src={imagePreview}
                                      alt="Passport/ID Preview"
                                      className="w-full h-64 object-contain"
                                    />
                                  ) : fileType === 'pdf' ? (
                                    <PDFViewer file={imagePreview} />
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                                    aria-label="Remove file"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => fileInputRef.current?.click()}
                                  className="border-2 border-dashed border-gray-300 p-6 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors"
                                >
                                  <Upload className="w-10 h-10 text-secondary mb-3" />
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Choose a File
                                  </p>
                                  <p className="text-xs text-gray-500 text-center max-w-md">
                                    Accepted files: JPEG, PNG and PDF.
                                  </p>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Work Email Address */}
                    <FormField
                      control={form.control}
                      name="workEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Work Email Address <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Type Your Work Email Address."
                              className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Phone Number <span className="text-red-500">*</span>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="phoneCountryCode"
                          render={({ field }) => {
                            const selectedPhoneCode = phoneCountryCodes.find(
                              (c) => c.value === field.value
                            );
                            return (
                              <FormItem className="w-[120px]">
                                <FormControl>
                                  <div className="relative">
                                    <select
                                      {...field}
                                      className="w-full bg-bg-medium border border-gray-300 h-11 pl-10 pr-8 text-sm outline-none appearance-none focus:border-secondary focus:ring-1 focus:ring-secondary cursor-pointer"
                                    >
                                      {phoneCountryCodes.map((code) => (
                                        <option key={code.value} value={code.value}>
                                          {code.code}
                                        </option>
                                      ))}
                                    </select>
                                    {selectedPhoneCode && (
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-2xl pointer-events-none z-10">
                                        {selectedPhoneCode.flag}
                                      </span>
                                    )}
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="Type Your Phone Number."
                                  className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              {/* Confirmation Checkbox */}
              <div className="pt-6 border-t border-gray-300">
              <FormField
                control={form.control}
                name="confirmAccuracy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="bg-bg-light border-border data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-black cursor-pointer">
                        I confirm the accuracy of the information provided and that I am authorized to act on behalf of this company.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              </div>
            </form>
          </Form>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center items-center gap-6 mt-8 pb-8">
          <Button
            type="button"
            variant="secondary"
            className="bg-bg-light text-black hover:bg-primary/70 hover:text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
            onClick={() => router.push("/vendor/company-information")}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!form.formState.isValid || step2Mutation.isPending}
            className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              form.handleSubmit(onSubmit)();
            }}
          >
            {step2Mutation.isPending ? "SUBMITTING..." : "NEXT"}
          </Button>
        </div>
      </div>
    </div>
  );
}

