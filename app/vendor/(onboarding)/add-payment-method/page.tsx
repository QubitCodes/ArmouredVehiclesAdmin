"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

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

const paymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .regex(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, "Please enter a valid card number"),
  cardHolderName: z.string().min(1, "Card holder name is required"),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .regex(/^\d{2}\/\d{2}$/, "Please enter a valid expiry date (MM/YY)"),
  cvv: z
    .string()
    .min(1, "CVV is required")
    .regex(/^\d{3,4}$/, "Please enter a valid CVV"),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

export default function AddPaymentMethodPage() {
  const router = useRouter();

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: "",
      cardHolderName: "",
      expiryDate: "",
      cvv: "",
    },
  });

  const onSubmit = async (data: PaymentMethodFormValues) => {
    try {
      console.log("Payment method data:", data);
      toast.success("Payment method added successfully");
      // TODO: Implement API call to save payment method
      // Navigate to next step
      // router.push("/vendor/verification");
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to add payment method. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(" ") : cleaned;
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
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

              {/* Step 5: Add Payment Method */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative z-10">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
                <span className="text-sm font-bold text-black mt-2 text-center leading-tight">
                  Add Payment Method
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ADD PAYMENT METHOD Heading */}
        <h2 className="text-2xl pb-3 font-bold text-black uppercase">
          ADD PAYMENT METHOD
        </h2>

        {/* Form Container */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Payment Details - Separate Light Container */}
            <div className="bg-bg-light p-6 space-y-6">
              {/* Card Number */}
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                      Card Number:
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="bg-bg-medium border-border h-[44px]"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Card Holder Name */}
              <FormField
                control={form.control}
                name="cardHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                      Card Holder Name:
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        className="bg-bg-medium border-border h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiry Date and CVV - Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expiry Date */}
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                        Expiry Date:
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          className="bg-bg-medium border-border h-[44px]"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatExpiryDate(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CVV */}
                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-black flex items-center gap-1">
                        CVV:
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          className="bg-bg-medium border-border h-[44px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-6 mt-8 pb-8">
              <Button
                type="button"
                variant="secondary"
                className="bg-bg-light text-black hover:bg-bg-medium font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
                onClick={() => router.push("/vendor/account-preferences")}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                PREVIOUS
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className="text-white font-bold uppercase tracking-wide px-16 py-3 text-base shadow-lg hover:shadow-xl transition-all w-[280px] h-[48px]"
              >
                NEXT
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

