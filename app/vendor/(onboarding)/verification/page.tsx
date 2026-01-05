"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useEffect } from "react";
import { useVerificationMethods } from "@/hooks/vendor/dashboard/use-verification-methods";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingProgressBar } from "@/components/vendor/onboarding-progress-bar";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const verificationSchema = z.object({
  verificationMethod: z.string().min(1, "Please select a verification method"),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

export default function VerificationPage() {
  const router = useRouter();
  const { data: verificationMethods = [], isLoading: isMethodsLoading } =
    useVerificationMethods();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      verificationMethod: "",
    },
  });

  // Set default to first available method when methods are loaded
  useEffect(() => {
    if (
      verificationMethods.length > 0 &&
      !form.getValues("verificationMethod")
    ) {
      const defaultMethod = verificationMethods.find(
        (method) => method.isAvailable
      );
      if (defaultMethod) {
        form.setValue("verificationMethod", defaultMethod.id.toString());
      }
    }
  }, [verificationMethods, form]);

  const onSubmit = async (data: VerificationFormValues) => {
    try {
      // TODO: Implement API call to submit verification method
      console.log("Verification method selected:", data.verificationMethod);
      toast.success("Verification preference submitted successfully!");
      // Redirect to dashboard or next step
      router.push("/vendor");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to submit verification preference. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-bg-medium px-4 py-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Progress Bar */}
        <OnboardingProgressBar currentStep={6} />

        {/* IDENTITY VERIFICATION Heading */}
        <div className="text-center pb-3">
          <h2 className="text-2xl font-bold text-black uppercase inline-block border-b border-border pb-3">
            IDENTITY VERIFICATION
          </h2>
        </div>

        {/* Instructions */}
        <div className="text-center mb-6">
          <p className="text-base text-black max-w-2xl mx-auto leading-relaxed">
            Please choose one of the available options to connect with an{" "}
            <strong className="font-bold">Armored Mart associate</strong> to
            complete your verification (note: not all options may be available
            in your area).
          </p>
        </div>

        {/* Form Container */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-3"
          >
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="verificationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-4">
                        {isMethodsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Spinner className="w-6 h-6" />
                            <span className="ml-2 text-sm text-gray-500">
                              Loading verification methods...
                            </span>
                          </div>
                        ) : (
                          verificationMethods
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((method) => {
                              const isSelected =
                                field.value === method.id.toString();
                              const isDisabled = !method.isAvailable;

                              return (
                                <div
                                  key={method.id}
                                  className={`p-6 border transition-all ${
                                    isSelected
                                      ? "border-secondary"
                                      : "border-border"
                                  } ${
                                    method.isAvailable
                                      ? "cursor-pointer hover:border-gray-400"
                                      : "opacity-60 cursor-not-allowed"
                                  }`}
                                  onClick={() => {
                                    if (method.isAvailable) {
                                      field.onChange(method.id.toString());
                                    }
                                  }}
                                >
                                  <div className="flex items-start gap-4">
                                    {/* Radio Button */}
                                    <div className="mt-1">
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                          isSelected
                                            ? "border-secondary bg-secondary"
                                            : "border-border bg-bg-light"
                                        } ${isDisabled ? "opacity-50" : ""}`}
                                      >
                                        {isSelected && (
                                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                      <h3
                                        className={`text-lg font-bold mb-2 ${
                                          isDisabled
                                            ? "text-gray-500"
                                            : "text-black"
                                        }`}
                                      >
                                        {method.name}
                                        {isDisabled && (
                                          <span className="ml-2 text-sm font-normal text-gray-400">
                                            (currently not available in your
                                            area)
                                          </span>
                                        )}
                                      </h3>
                                      <p
                                        className={`text-sm leading-relaxed ${
                                          isDisabled
                                            ? "text-gray-400"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {method.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8 pb-8">
              <Button
                type="button"
                variant="secondary"
                className="bg-bg-light text-black hover:bg-primary/70 hover:text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/bank-account")}
              >
                Previous
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[300px] h-[48px]"
              >
                Submit for Approval
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
