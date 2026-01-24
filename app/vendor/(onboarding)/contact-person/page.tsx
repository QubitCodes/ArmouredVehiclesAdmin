"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Info, Upload, X, ChevronDown, Search } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";

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
import { COUNTRY_LIST } from "@/lib/countries";
import { cn } from "@/lib/utils";

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

type ContactPersonFormValues = z.infer<typeof contactPersonSchema>;

export default function ContactPersonPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);

  // State for searchable country dropdown
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);

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
      phoneCountryCode: "+971",
      phoneNumber: "",
      confirmAccuracy: false,
    },
  });

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRY_LIST;
    const term = countrySearch.toLowerCase();
    return COUNTRY_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.value.includes(term) ||
        c.countryCode.toLowerCase().includes(term)
    );
  }, [countrySearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryOpen(false);
        setCountrySearch("");
      }
    };

    if (isCountryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => countrySearchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCountryOpen]);

  // Handle country selection
  const handleCountrySelect = (country: (typeof COUNTRY_LIST)[0]) => {
    form.setValue("phoneCountryCode", country.value);
    form.trigger("phoneCountryCode");
    setIsCountryOpen(false);
    setCountrySearch("");
  };

  // Auto-fill form when profile data is available
  useEffect(() => {
    if (profileData?.profile && !isProfileLoading) {
      const p = profileData.profile;
      form.reset({
        fullName: p.contact_full_name || "",
        jobTitle: p.contact_job_title || "",
        workEmail: p.contact_work_email || "",
        phoneCountryCode: p.contact_mobile_country_code ? (p.contact_mobile_country_code.startsWith('+') ? p.contact_mobile_country_code : `+${p.contact_mobile_country_code}`) : "+971",
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
      let contactIdDocumentUrl = undefined;

      // Determine file to upload or existing URL
      if (data.passport instanceof File) {
        // Check if it's the dummy "existing_file"
        if (data.passport.name === "existing_file" && imagePreview) {
          contactIdDocumentUrl = imagePreview;
        } else {
          // Real upload
          const uploadData = new FormData();
          uploadData.append("files", data.passport);
          uploadData.append("label", "CONTACT_ID_DOCUMENT");
          uploadData.append("data", JSON.stringify({}));

          // Use centralized API instance to ensure proper token handling (401 fix)
          const uploadRes = await api.post('/upload/files', uploadData);
          if (uploadRes.status !== 200 && uploadRes.status !== 201) throw new Error("File upload failed");

          const uploadJson = uploadRes.data;
          if (uploadJson.status && uploadJson.data && uploadJson.data.length > 0) {
            contactIdDocumentUrl = uploadJson.data[0];
          }
        }
      }

      // Prepare API payload
      const payload = {
        contactFullName: data.fullName,
        contactJobTitle: data.jobTitle || undefined,
        contactWorkEmail: data.workEmail,
        contactIdDocumentUrl: contactIdDocumentUrl, // Send URL
        contactMobile: data.phoneNumber,
        contactMobileCountryCode: data.phoneCountryCode,
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
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field }) => {
                      const phoneCountryCode = field.value;
                      const selectedCountry = COUNTRY_LIST.find(
                        (c) => c.value === phoneCountryCode
                      );
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Phone Number <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center border border-gray-300 focus-within:border-secondary transition-all bg-bg-medium">
                              {/* Country Code Selector */}
                              <div
                                ref={countryDropdownRef}
                                className="relative flex items-center border-r border-gray-300 bg-bg-medium"
                              >
                                <button
                                  type="button"
                                  onClick={() => setIsCountryOpen(!isCountryOpen)}
                                  className="flex items-center gap-1 bg-bg-medium pl-3 pr-2 py-3 text-sm text-black focus:outline-none cursor-pointer h-11 min-w-[100px]"
                                >
                                  <span>{selectedCountry?.flag}</span>
                                  <span>{selectedCountry?.value}</span>
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 text-gray-400 transition-transform ml-1",
                                      isCountryOpen && "rotate-180"
                                    )}
                                  />
                                </button>

                                {/* Searchable Dropdown */}
                                {isCountryOpen && (
                                  <div className="absolute top-[calc(100%+4px)] left-0 z-[100] w-72 rounded-md border border-gray-300 bg-white shadow-lg">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-gray-200">
                                      <div className="relative">
                                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                          ref={countrySearchInputRef}
                                          type="text"
                                          value={countrySearch}
                                          onChange={(e) =>
                                            setCountrySearch(e.target.value)
                                          }
                                          placeholder="Search countries..."
                                          className="w-full h-9 pl-8 pr-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-secondary"
                                        />
                                      </div>
                                    </div>
                                    {/* Country List */}
                                    <div className="max-h-60 overflow-y-auto">
                                      {filteredCountries.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                          No countries found
                                        </div>
                                      ) : (
                                        filteredCountries.map((country) => (
                                          <button
                                            key={country.countryCode}
                                            type="button"
                                            onClick={() =>
                                              handleCountrySelect(country)
                                            }
                                            className={cn(
                                              "w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2 transition-colors",
                                              selectedCountry?.countryCode ===
                                              country.countryCode && "bg-gray-100"
                                            )}
                                          >
                                            <span>{country.flag}</span>
                                            <span className="flex-1 truncate">
                                              {country.name}
                                            </span>
                                            <span className="text-gray-500">
                                              {country.value}
                                            </span>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Phone Number Input */}
                              <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field: phoneField }) => (
                                  <Input
                                    type="tel"
                                    placeholder="Type Your Phone Number."
                                    className={cn(
                                      "border-0 focus:outline-none focus:ring-0 focus:border-0",
                                      "focus-visible:outline-none focus-visible:ring-0",
                                      "text-black placeholder:text-gray-400 h-11 text-sm flex-1"
                                    )}
                                    {...phoneField}
                                    onChange={(e) => {
                                      // Only allow digits
                                      const value = e.target.value.replace(/\D/g, "");
                                      // Limit to max 15 digits (ITU-T E.164 standard)
                                      const limitedValue = value.slice(0, 15);
                                      phoneField.onChange(limitedValue);
                                    }}
                                  />
                                )}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
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

