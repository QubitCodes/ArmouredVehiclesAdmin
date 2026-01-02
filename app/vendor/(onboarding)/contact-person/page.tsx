"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Info, Upload, ArrowLeft } from "lucide-react";

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

const contactPersonSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string().optional(),
  passportOrId: z.any().optional(),
  workEmail: z.string().email("Please enter a valid email address").min(1, "Work email is required"),
  mobileWhatsappNumber: z.string().min(1, "Mobile/WhatsApp number is required"),
  confirmAccuracy: z.boolean().refine((val) => val === true, {
    message: "You must confirm the accuracy of the information",
  }),
});

type ContactPersonFormValues = z.infer<typeof contactPersonSchema>;

export default function ContactPersonPage() {
  const router = useRouter();

  const form = useForm<ContactPersonFormValues>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues: {
      fullName: "",
      jobTitle: "",
      passportOrId: undefined,
      workEmail: "",
      mobileWhatsappNumber: "",
      confirmAccuracy: false,
    },
  });

  const onSubmit = async (data: ContactPersonFormValues) => {
    try {
      // TODO: Implement API call to save contact person information
      console.log("Contact person data:", data);
      toast.success("Contact person information saved successfully");
      // Navigate to next step
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
                <div className="w-10 h-10 rounded-full bg-bg-light border-2 border-border flex items-center justify-center relative z-10">
                  <span className="text-black text-sm font-bold">3</span>
                </div>
                <span className="text-sm font-medium text-black mt-2 text-center leading-tight">
                  Declaration
                </span>
              </div>

              {/* Step 4: Account Preferences */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-bg-light border-2 border-border flex items-center justify-center relative z-10">
                  <span className="text-black text-sm font-bold">4</span>
                </div>
                <span className="text-sm font-medium text-black mt-2 text-center leading-tight">
                  Account Preferences
                </span>
              </div>

              {/* Step 5: Verification */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-bg-light border-2 border-border flex items-center justify-center relative z-10">
                  <span className="text-black text-sm font-bold">5</span>
                </div>
                <span className="text-sm font-medium text-black mt-2 text-center leading-tight">
                  Verification
                </span>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form Container */}
            <div className="bg-bg-light px-4 py-8 shadow-lg">
              {/* AUTHORIZED CONTACT PERSON Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black mb-6">
                  AUTHORIZED CONTACT PERSON
                </h2>

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
                      name="passportOrId"
                      render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Upload Passport Copy or Emirates ID{" "}
                            <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 p-8 bg-bg-medium flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors">
                              <Upload className="w-10 h-10 text-secondary mb-3" />
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Choose a File or Drag & Drop It Here
                              </p>
                              <p className="text-xs text-gray-500 text-center max-w-md">
                                JPEG, PNG, PDF, and MP4 formats, up to 10 MB.
                              </p>
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

                    {/* Mobile / WhatsApp Number */}
                    <FormField
                      control={form.control}
                      name="mobileWhatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-black">
                            Mobile / WhatsApp Number <span className="text-red-500">*</span>
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Type Your Mobile Number."
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

            {/* Confirmation Checkbox - Outside Form Container */}
            <div className="mt-6 bg-bg-light px-4 py-4">
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

        {/* Navigation Buttons */}
        <div className="flex justify-center items-center gap-6 mt-8 pb-8">
          <Button
            type="button"
            variant="secondary"
            className="bg-bg-light text-black hover:bg-bg-medium font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
            onClick={() => router.push("/vendor/company-information")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            PREVIOUS
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
            onClick={() => {
              form.handleSubmit(onSubmit)();
            }}
          >
            NEXT
          </Button>
        </div>
      </div>
    </div>
  );
}

