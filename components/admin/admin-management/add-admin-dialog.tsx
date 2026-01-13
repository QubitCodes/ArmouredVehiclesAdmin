"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCreateAdmin } from "@/hooks/admin/admin-management/use-admins";

const addAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

const phoneCountryCodes = [
  { value: "971", code: "+971", flag: "🇦🇪", label: "United Arab Emirates" },
  { value: "1", code: "+1", flag: "🇺🇸", label: "United States" },
  { value: "44", code: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { value: "91", code: "+91", flag: "🇮🇳", label: "India" },
  { value: "966", code: "+966", flag: "🇸🇦", label: "Saudi Arabia" },
];

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAdminDialog({ open, onOpenChange }: AddAdminDialogProps) {
  const form = useForm<AddAdminFormValues>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneCountryCode: "971",
      phoneNumber: "",
    },
  });

  const createAdminMutation = useCreateAdmin();

  const onSubmit = async (data: AddAdminFormValues) => {
    try {
      // Find the country code object to get the code with "+"
      const selectedPhoneCode = phoneCountryCodes.find(
        (code) => code.value === data.phoneCountryCode
      );

      await createAdminMutation.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phoneNumber,
        country_code: selectedPhoneCode?.code || `+${data.phoneCountryCode}`,
      });

      toast.success("Admin created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);

      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      
      let errorMessage = "Failed to create admin. Please try again.";
      
      if (axiosError?.response?.status === 403) {
        errorMessage = "You don't have permission to create admins.";
      } else if (axiosError?.response?.status === 401) {
        errorMessage = "Unauthorized. Please log in again.";
      } else {
        errorMessage =
          axiosError?.response?.data?.error ||
          axiosError?.response?.data?.message ||
          axiosError?.message ||
          errorMessage;
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground uppercase tracking-wide">
            Add New Admin
          </DialogTitle>
          <DialogDescription>
            Enter the details to create a new admin user
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter admin name"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm transition-all"
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
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

             <div className="space-y-1.5">
                <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Phone Number
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
                                    className="w-full bg-input border border-border h-11 pl-10 pr-8 text-sm outline-none appearance-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 cursor-pointer text-foreground"
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
                                {/* Using a simple arrow if icon import is missing, but ChevronDown was imported earlier in snippet. 
                                    Looking at context, I need to make sure ChevronDown is imported. 
                                    I will reuse the import from Lucide if it exists or add it.
                                    The original file had 'Loader2' imported. I should check imports. 
                                */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                                >
                                    <path d="m6 9 6 6 6-6"/>
                                </svg>
                                </div>
                            </FormControl>
                            <FormMessage className="text-red-600 text-xs" />
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
                            placeholder="Enter phone number"
                            className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm transition-all"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage className="text-red-600 text-xs" />
                        </FormItem>
                    )}
                />
                </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={createAdminMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={createAdminMutation.isPending}
                className="font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createAdminMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

