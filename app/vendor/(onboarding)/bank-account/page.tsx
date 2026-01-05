"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Upload, Info, ChevronDown, X } from "lucide-react";
import { useState, useRef } from "react";
import { useFinancialInstitutions } from "@/hooks/vendor/dashboard/use-financial-institutions";
import { useProofTypes } from "@/hooks/vendor/dashboard/use-proof-types";
import { useOnboardingStep5 } from "@/hooks/vendor/dashboard/use-onboarding-step5";
import { useCountries, type Country } from "@/hooks/vendor/dashboard/use-countries";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingProgressBar } from "@/components/vendor/onboarding-progress-bar";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const paymentMethodSchema = z
  .object({
    bankCountry: z.string().min(1, "Country is required"),
    financialInstitution: z.string().min(1, "Financial institution is required"),
    swiftCode: z.string().optional(),
    bankAccountNumber: z.string().min(1, "Bank account number is required"),
    confirmAccountNumber: z.string().min(1, "Please confirm account number"),
    proofType: z.string().min(1, "Proof type is required"),
    bankProofFile: z.any().refine((file) => file !== undefined && file instanceof File, {
      message: "Proof document is required",
    }),
  })
  .refine((data) => data.bankAccountNumber === data.confirmAccountNumber, {
    message: "Account numbers do not match",
    path: ["confirmAccountNumber"],
  });

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

export default function AddPaymentMethodPage() {
  const router = useRouter();
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const proofFileRef = useRef<HTMLInputElement>(null);

  // Fetch reference data from API
  const {
    data: financialInstitutionsData = [],
    isLoading: isFinancialInstitutionsLoading,
  } = useFinancialInstitutions();
  const { data: proofTypesData = [], isLoading: isProofTypesLoading } =
    useProofTypes();
  const { data: countries = [], isLoading: isCountriesLoading } = useCountries();
  
  const step5Mutation = useOnboardingStep5();

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      bankCountry: "United Arab Emirates",
      financialInstitution: "",
      swiftCode: "",
      bankAccountNumber: "",
      confirmAccountNumber: "",
      proofType: "",
      bankProofFile: undefined,
    },
  });

  const onSubmit = async (data: PaymentMethodFormValues) => {
    try {
      // Map form data to API schema format
      const payload = {
        bankCountry: data.bankCountry,
        financialInstitution: data.financialInstitution,
        swiftCode: data.swiftCode || undefined,
        bankAccountNumber: data.bankAccountNumber,
        proofType: data.proofType,
        bankProofFile: data.bankProofFile instanceof File ? data.bankProofFile : undefined,
      };

      await step5Mutation.mutateAsync(payload);
      
      toast.success("Bank account information saved successfully");
      // Navigate to verification page
      router.push("/vendor/verification");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to save bank account information. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        form.setValue("bankProofFile", file, { shouldValidate: true });
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setProofPreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setProofPreview(null);
        }
      } else {
        toast.error("Please select an image file (JPEG, PNG) or PDF");
      }
    }
  };

  const handleRemoveProof = () => {
    form.setValue("bankProofFile", undefined, { shouldValidate: true });
    setProofPreview(null);
    if (proofFileRef.current) {
      proofFileRef.current.value = "";
    }
  };


  return (
    <div className="min-h-screen bg-bg-medium flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-7xl">
        {/* Progress Bar */}
        <OnboardingProgressBar currentStep={5} />

        {/* ADD BANK ACCOUNT Heading */}
        <h2 className="text-2xl font-bold text-black uppercase">
          ADD BANK ACCOUNT
        </h2>

        {/* Form Container */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-3">
            {/* Info Message */}
            <div className="bg-[#DAD4C5] p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-800">
                You are adding your bank account for the <strong>UAE</strong>{" "}
                marketplace. You can add additional bank accounts for other
                regions you choose to sell in once registration is complete.
              </p>
            </div>

            <div className="bg-bg-light p-6 space-y-5">
              {/* Country and Financial Institution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bankCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Country
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={(countries as Country[]).map((country) => ({
                            value: country.label,
                            label: country.label,
                            flag: country.flag,
                          }))}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select Country"
                          disabled={isCountriesLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financialInstitution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Financial Institution Name
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          {isFinancialInstitutionsLoading ? (
                            <div className="w-full bg-bg-medium border border-gray-300 h-11 px-4 flex items-center">
                              <Spinner className="w-4 h-4" />
                              <span className="ml-2 text-sm text-gray-500">
                                Loading...
                              </span>
                            </div>
                          ) : (
                            <>
                              <select
                                {...field}
                                className="w-full bg-bg-medium border border-gray-300 h-11 px-4 pr-8 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
                              >
                                <option value="">Select</option>
                                {financialInstitutionsData.map(
                                  (institution) => (
                                    <option
                                      key={institution.id}
                                      value={institution.name}
                                    >
                                      {institution.name}
                                    </option>
                                  )
                                )}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Routing Code and Proof Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="swiftCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Routing or SWIFT code (depending on your region)
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your IBAN number"
                          className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proofType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                        Proof Type
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          {isProofTypesLoading ? (
                            <div className="w-full bg-bg-medium border border-gray-300 h-11 px-4 flex items-center">
                              <Spinner className="w-4 h-4" />
                              <span className="ml-2 text-sm text-gray-500">
                                Loading...
                              </span>
                            </div>
                          ) : (
                            <>
                              <select
                                {...field}
                                className="w-full bg-bg-medium border border-gray-300 h-11 px-4 pr-8 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none appearance-none"
                              >
                                <option value="">Select</option>
                                {proofTypesData.map((proofType) => (
                                  <option
                                    key={proofType.id}
                                    value={proofType.name}
                                  >
                                    {proofType.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            </>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bank Account Number and Upload Proof - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side - Bank Account Number Fields */}
                <div className="space-y-5">
                  {/* Bank Account Number */}
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Bank Account Number
                          <span className="text-red-500">*</span>
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter account number"
                            className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Re-Type Bank Account Number */}
                  <FormField
                    control={form.control}
                    name="confirmAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Re-Type Bank Account Number
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Confirm account number"
                            className="bg-bg-medium border border-gray-300 h-11 focus:border-secondary focus:ring-1 focus:ring-secondary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Side - Upload Proof */}
                <div>
                  <FormField
                    control={form.control}
                    name="bankProofFile"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                          Upload Proof
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <input
                              ref={proofFileRef}
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,application/pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            {proofPreview ? (
                              <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-bg-medium">
                                <img
                                  src={proofPreview}
                                  alt="Proof Document Preview"
                                  className="w-full h-64 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveProof}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  aria-label="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => proofFileRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 p-4 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors"
                              >
                                <Upload className="w-10 h-10 text-secondary mb-3" />
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Choose a File
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  Accepted files: JPEG, PNG, PDF (max 10 MB).
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
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8 pb-8">
              <Button
                type="button"
                variant="secondary"
                className="bg-bg-light text-black hover:bg-primary/70 hover:text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/account-preferences")}
              >
                Previous
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={step5Mutation.isPending}
                className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step5Mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" className="text-white" />
                    SUBMITTING...
                  </span>
                ) : (
                  "CONTINUE"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
