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
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

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
      password: "",
    },
  });

  const createAdminMutation = useCreateAdmin();

  const onSubmit = async (data: AddAdminFormValues) => {
    try {
      await createAdminMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
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
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
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
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      className="bg-input border border-border focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-foreground placeholder:text-muted-foreground h-11 text-sm rounded-lg transition-all"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-xs" />
                </FormItem>
              )}
            />

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

