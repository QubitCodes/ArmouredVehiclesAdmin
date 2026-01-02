"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Link from "next/link";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVendorRegistration } from "@/hooks/vendor/(auth)/use-vendor-registration";
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
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function CreateSupplierAccountPage() {
  const router = useRouter();
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
    },
  });

  const registrationMutation = useVendorRegistration();

  const onSubmit = async (data: RegistrationFormValues) => {
    try {
      const response = await registrationMutation.mutateAsync({
        name: data.name,
        email: data.email,
        username: data.username,
        userType: "vendor",
      });

      toast.success(
        response.message || "OTP sent successfully! Please check your email."
      );

      // Navigate to OTP verification page with email, username, and userId parameters
      const userId = response.userId || "";
      router.push(
        `/vendor/verify-email?email=${encodeURIComponent(data.email)}&username=${encodeURIComponent(data.username)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`
      );
    } catch (error) {
      console.log(error);

      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
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
      className="min-h-screen flex items-center justify-start relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/army.jpg')",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0 bg-black/30" />

      <div className="relative z-10 w-full max-w-lg p-4 md:ml-8 lg:ml-16">
        <Card className="bg-bg-light border border-blue-500/30 shadow-2xl overflow-hidden px-6 py-8 w-full">
          <CardHeader className="pb-3 pt-0 px-0">
            <h1 className="text-xl sm:text-3xl font-bold text-black uppercase tracking-wide text-center font-heading">
              CREATE YOUR SUPPLIER ACCOUNT
            </h1>
            <p className="text-md text-black/80 text-center">
              Enter your details to get started
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-0">
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
                            className="border border-black/20 focus:border-blue-500/50 focus:ring-0 text-black placeholder:text-black/50 h-12 text-sm transition-all"
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
                            className="border border-black/20 focus:border-blue-500/50 focus:ring-0 text-black placeholder:text-black/50 h-12 text-sm transition-all"
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
                          className="border border-black/20 focus:border-blue-500/50 focus:ring-0 text-black placeholder:text-black/50 h-12 text-sm transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="relative w-full mt-6">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={registrationMutation.isPending}
                    className="w-full font-bold uppercase tracking-wider py-3.5 text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 relative overflow-visible"
                    style={{
                      clipPath: "polygon(0 0, 0 20%, 12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 80%, 0 100%)",
                    }}
                  >
                    {registrationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <span className="flex items-center justify-center gap-2">
                          CONTINUE
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-black/80">
                Already have an account?{" "}
                <Link
                  href="/vendor/login"
                  className="text-secondary underline underline-offset-2 hover:text-secondary/80 transition-colors font-medium"
                >
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

