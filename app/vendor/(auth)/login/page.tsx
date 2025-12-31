"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import Image from "next/image";
import { toast } from "sonner";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginStart } from "@/hooks/admin/(auth)/use-login";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function VendorLoginPage() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const loginMutation = useLoginStart();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await loginMutation.mutateAsync({
        email: data.email,
      });

      toast.success(
        response.message || "OTP sent successfully! Please check your email."
      );

      // Navigate to OTP verification page with email parameter
      router.push(`/vendor/login/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.log(error);
      
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage =
        axiosError?.response?.data?.error ||
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to send OTP. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/army.jpg')",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="bg-card border-2 border-border shadow-2xl rounded-xl overflow-hidden px-5">
          <CardHeader className="pb-4 pt-6">
            <div className="flex justify-center">
              <div className="relative">
                <Image
                  src="/images/logo.png"
                  alt="ArmoredMart Logo"
                  width={180}
                  height={180}
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide text-center">
              Vendor Login
            </h1>
            <p className="text-xs text-muted-foreground text-center">
              Enter your details to get started
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email Address"
                          className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={loginMutation.isPending}
                  className="w-full font-bold uppercase tracking-wider py-3.5 text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
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
        </Card>
      </div>
    </div>
  );
}


