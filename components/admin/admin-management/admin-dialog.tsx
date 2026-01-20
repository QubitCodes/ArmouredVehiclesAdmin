"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { toast } from "sonner";
import * as z from "zod";
import { Loader2, ChevronDown, Search } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

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
import { useCreateAdmin, useUpdateAdmin } from "@/hooks/admin/admin-management/use-admins";
import { COUNTRY_LIST } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Admin, adminService } from "@/services/admin/admin.service";
import { authService } from "@/services/admin/auth.service";
import { PermissionSelector } from "./permission-selector";

const adminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type AdminFormValues = z.infer<typeof adminSchema>;

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin?: Admin | null;
}

export function AdminDialog({ open, onOpenChange, admin }: AdminDialogProps) {
  const isEdit = !!admin;

  // State for permissions
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // State for searchable country dropdown
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneCountryCode: "+971",
      phoneNumber: "",
    },
  });

  const createAdminMutation = useCreateAdmin();
  const updateAdminMutation = useUpdateAdmin();

  const isPending = createAdminMutation.isPending || updateAdminMutation.isPending;

  // Initialize form with admin data (and permissions) when editing
  useEffect(() => {
    if (admin) {
      form.reset({
        name: admin.name || "",
        email: admin.email || "",
        phoneCountryCode: admin.country_code || "+971",
        phoneNumber: admin.phone || "",
      });

      // Fetch user's permissions
      const loadPermissions = async () => {
        try {
          const perms: any = await adminService.getAdminPermissions(admin.id);
          // Backend should return list of objects with name, or list of strings if just names
          // PermissionService.getUserPermissions returns full object with name
          if (perms.status) {
            // If nested in response object
            setSelectedPermissions(perms.data.map((p: any) => p.name));
          } else if (Array.isArray(perms)) {
            setSelectedPermissions(perms.map((p: any) => p.name));
          }
        } catch (e) {
          console.error("Failed to load admin permissions", e);
        }
      };
      loadPermissions();

    } else {
      form.reset({
        name: "",
        email: "",
        phoneCountryCode: "+971",
        phoneNumber: "",
      });
      // Set defaults for new admin
      const setDefaults = async () => {
        try {
          const res: any = await adminService.getPermissions();
          if (res.status) {
            const defaults = res.data
              .filter((p: any) => ['vendor.view', 'product.view', 'order.view'].includes(p.name))
              .map((p: any) => p.name);
            setSelectedPermissions(defaults);
          }
        } catch (e) {/* ignore */ }
      };
      setDefaults();
    }
  }, [admin, form, open]);

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

  // Reset dropdown state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsCountryOpen(false);
      setCountrySearch("");
    }
  }, [open]);

  // Handle country selection
  const handleCountrySelect = (country: (typeof COUNTRY_LIST)[0]) => {
    form.setValue("phoneCountryCode", country.value);
    form.trigger("phoneCountryCode");
    setIsCountryOpen(false);
    setCountrySearch("");
  };

  const onSubmit = async (data: AdminFormValues) => {
    try {
      let adminId = admin?.id;

      if (isEdit && adminId) {
        await updateAdminMutation.mutateAsync({
          id: admin!.id,
          data: {
            name: data.name,
            email: data.email,
            phone: data.phoneNumber,
            country_code: data.phoneCountryCode,
          },
        });
        toast.success("Admin updated successfully!");
      } else {
        const newAdmin: any = await createAdminMutation.mutateAsync({
          name: data.name,
          email: data.email,
          phone: data.phoneNumber,
          country_code: data.phoneCountryCode,
        });
        // Adjusted to handle response structure
        adminId = newAdmin?.data?.user?.id || newAdmin?.user?.id || newAdmin?.data?.id;
        toast.success("Admin created successfully!");
      }

      // Update Permissions
      if (adminId) {
        try {
          await adminService.assignPermissions(adminId, selectedPermissions);
          if (!isEdit) toast.success("Permissions assigned.");
        } catch (permError) {
          console.error("Permission assignment failed", permError);
          toast.error("Admin created but failed to assign permissions.");
        }
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);

      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      let errorMessage = `Failed to ${isEdit ? "update" : "create"} admin. Please try again.`;

      if (axiosError?.response?.status === 403) {
        errorMessage = `You don't have permission to ${isEdit ? "update" : "create"} admins.`;
      } else if (axiosError?.response?.status === 409) {
        errorMessage = "An admin with this email or phone number already exists.";
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
      <DialogContent className="sm:max-w-[1000px] h-[85vh] flex flex-col p-0 gap-0 bg-background">
        <div className="p-6 pb-4 shrink-0 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground uppercase tracking-wide">
              {isEdit ? "Edit Admin" : "Add New Admin"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update admin details and permissions"
                : "Enter details and assign permissions for the new admin"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-0">
                {/* Left Column: Details */}
                <div className="space-y-4 overflow-y-auto p-6 border-r border-border/50">
                  {/* Name */}
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

                  {/* Email */}
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

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field }) => {
                      const selectedCountry = COUNTRY_LIST.find(
                        (c) => c.value === field.value
                      );
                      return (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-foreground font-semibold text-xs uppercase tracking-wide">
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center border border-border focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all bg-input">
                              {/* Country Code Selector */}
                              <div
                                ref={countryDropdownRef}
                                className="relative flex items-center border-r border-border"
                              >
                                <button
                                  type="button"
                                  onClick={() => setIsCountryOpen(!isCountryOpen)}
                                  className="flex items-center gap-1 px-3 py-3 text-sm text-foreground focus:outline-none cursor-pointer h-11 min-w-[110px]"
                                >
                                  <span className="text-lg">{selectedCountry?.flag}</span>
                                  <span>{selectedCountry?.value}</span>
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 text-muted-foreground transition-transform ml-auto",
                                      isCountryOpen && "rotate-180"
                                    )}
                                  />
                                </button>

                                {/* Searchable Dropdown */}
                                {isCountryOpen && (
                                  <div className="absolute top-[calc(100%+4px)] left-0 z-[100] w-72 rounded-md border border-border bg-background shadow-lg">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-border">
                                      <div className="relative">
                                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                          ref={countrySearchInputRef}
                                          type="text"
                                          value={countrySearch}
                                          onChange={(e) =>
                                            setCountrySearch(e.target.value)
                                          }
                                          placeholder="Search countries..."
                                          className="w-full h-9 pl-8 pr-2 text-sm border border-border rounded bg-background focus:outline-none focus:border-secondary text-foreground placeholder:text-muted-foreground"
                                        />
                                      </div>
                                    </div>
                                    {/* Country List */}
                                    <div className="max-h-60 overflow-y-auto">
                                      {filteredCountries.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                                          No countries found
                                        </div>
                                      ) : (
                                        filteredCountries.map((country) => (
                                          <button
                                            key={country.countryCode}
                                            type="button"
                                            onClick={() => handleCountrySelect(country)}
                                            className={cn(
                                              "w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 transition-colors text-foreground",
                                              selectedCountry?.countryCode ===
                                              country.countryCode && "bg-accent"
                                            )}
                                          >
                                            <span>{country.flag}</span>
                                            <span className="flex-1 truncate">
                                              {country.name}
                                            </span>
                                            <span className="text-muted-foreground">
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
                                    placeholder="Enter phone number"
                                    className={cn(
                                      "border-0 focus:outline-none focus:ring-0 focus:border-0",
                                      "focus-visible:outline-none focus-visible:ring-0",
                                      "text-foreground placeholder:text-muted-foreground h-11 text-sm flex-1"
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
                          <FormMessage className="text-red-600 text-xs" />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Right Column: Permissions */}
                <div className="overflow-y-auto h-full p-6">
                  <PermissionSelector
                    selectedPermissions={selectedPermissions}
                    onChange={setSelectedPermissions}
                    disabled={!authService.hasPermission("admin.permissions")}
                  />
                </div>
              </div>

              <DialogFooter className="p-6 border-t shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    onOpenChange(false);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isPending}
                  className="font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEdit ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEdit ? "Update Admin" : "Create Admin"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
