"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Calendar,
  Shield,
  FileText,
  CreditCard,
  BarChart3,
  ExternalLink,
  FileCheck,
  Phone,
  Globe,
  Briefcase,
  MapPin,
  Hash,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useVendor } from "@/hooks/admin/vendor-management/use-vendor";
import { useVendorActions } from "@/hooks/admin/vendor-management/use-vendor-actions";
import { cn } from "@/lib/utils";
import { vendorService } from "@/services/admin/vendor.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Helper function to format field names (camelCase to Title Case)
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// Helper function to map onboarding step to step name
const getOnboardingStepName = (step: number | null | undefined): string => {
  if (step === null) {
    return "Completed";
  }

  const stepMap: Record<number, string> = {
    0: "Create Store",
    1: "Company Information",
    2: "Contact Person",
    3: "Declaration",
    4: "Account Preferences",
    5: "Bank Details",
    6: "Verification",
  };

  return stepMap[step as number] || "—";
};

// Helper function to robustly parse and format field values
const formatValue = (value: unknown, fieldName: string): string | string[] => {
  if (value === undefined || value === null || value === "" || value === "—") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return value.toString();
  }

  // Fields that should always be displayed as arrays (tags)
  const listFields = [
    "selling_categories",
    "nature_of_business",
    "license_types",
    "end_use_markets",
    "operating_countries",
  ];
  const isListField = listFields.includes(fieldName);

  // Deep parse function for JSON strings
  const deepParse = (
    val: string
  ): string | string[] | Record<string, unknown> => {
    const trimmed = val.trim();
    if (!trimmed) return "—";

    // Try normal JSON parse
    try {
      const parsed = JSON.parse(trimmed);

      // If parsed result is a string, recursively parse it
      if (typeof parsed === "string") {
        return deepParse(parsed);
      }

      // Handle case: {"[\"Manufacturer\",\"Distributor\"]"} or {"key": "[\"Manufacturer\",\"Distributor\"]"}
      // Where we get an object with a single property that contains or is a JSON array string
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        const entries = Object.entries(parsed);

        // If object has a single property
        if (entries.length === 1) {
          const [key, value] = entries[0];
          const keyTrimmed = key.trim();
          const valueTrimmed = typeof value === "string" ? value.trim() : "";

          // Check if the KEY looks like a JSON array/object
          if (
            (keyTrimmed.startsWith("[") && keyTrimmed.endsWith("]")) ||
            (keyTrimmed.startsWith("{") && keyTrimmed.endsWith("}"))
          ) {
            try {
              return deepParse(keyTrimmed);
            } catch {
              // If parsing the key fails, continue to check value
            }
          }

          // Check if the VALUE looks like a JSON array/object
          if (
            valueTrimmed &&
            ((valueTrimmed.startsWith("[") && valueTrimmed.endsWith("]")) ||
              (valueTrimmed.startsWith("{") && valueTrimmed.endsWith("}")))
          ) {
            try {
              return deepParse(valueTrimmed);
            } catch {
              // If parsing the value fails, return the original parsed object
            }
          }
        }
      }

      return parsed;
    } catch {
      // If failed, try to handle escaped quotes or wrapped strings
      try {
        // Handle case like {"[\"Manufacturer\"]"} or "[\"Manufacturer\"]"
        let cleaned = trimmed.replace(/\\"/g, '"');
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        if (
          (cleaned.startsWith("[") && cleaned.endsWith("]")) ||
          (cleaned.startsWith("{") && cleaned.endsWith("}"))
        ) {
          const parsed = JSON.parse(cleaned);
          return typeof parsed === "string" ? deepParse(parsed) : parsed;
        }

        // Handle the specific weird case from screenshot: {[\"Manufacturer\"]}
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          const inner = trimmed
            .substring(1, trimmed.length - 1)
            .replace(/\\"/g, '"');
          if (inner.startsWith("[") && inner.endsWith("]")) {
            return JSON.parse(inner);
          }
        }
      } catch {
        // Still failed
      }
    }

    // fallback to comma separation if it's a list field
    if (isListField && trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((s) => s.trim())
        .filter((s) => !!s);
    }

    return trimmed;
  };

  let processed: string | string[] | Record<string, unknown> = value as
    | string
    | string[]
    | Record<string, unknown>;
  if (typeof value === "string") {
    processed = deepParse(value);
  } else if (Array.isArray(value)) {
    // Handle case where value is an array containing JSON strings
    // e.g., ["[\"Military\",\"Government\"]"] or ["[\"\",\"authority_license\",\"eocn\"]"]
    if (value.length === 1 && typeof value[0] === "string") {
      const firstElement = value[0].trim();
      // If the single element is a JSON string, parse it
      if (
        (firstElement.startsWith("[") && firstElement.endsWith("]")) ||
        (firstElement.startsWith("{") && firstElement.endsWith("}"))
      ) {
        processed = deepParse(firstElement);
      } else {
        processed = value.filter((i) => i !== "" && i !== null);
      }
    } else {
      // Regular array, just filter empty values
      processed = value.filter((i) => i !== "" && i !== null);
    }
  }

  // Ensure list fields are always arrays for tag rendering
  if (isListField) {
    if (processed === "—" || processed === null || processed === undefined)
      return "—";
    if (!Array.isArray(processed)) return [String(processed)];
    const filtered = processed.filter((i) => !!i);
    return filtered.length > 0 ? filtered : "—";
  }

  // Format objects for standard display
  if (
    typeof processed === "object" &&
    processed !== null &&
    !Array.isArray(processed)
  ) {
    return Object.entries(processed)
      .map(([key, val]) => `${formatFieldName(key)}: ${val}`)
      .join(", ");
  }

  return Array.isArray(processed) ? processed.join(", ") : String(processed);
};

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { data: vendor, isLoading, error } = useVendor(userId);

  // Handle 404 errors - redirect to listing page if vendor doesn't exist
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      if (axiosError?.response?.status === 404) {
        // Vendor doesn't exist, redirect to listing page
        router.replace("/admin/vendors");
        return;
      }
      const errorMessage =
        axiosError?.response?.data?.message ||
        axiosError?.message ||
        "Failed to fetch vendor";
      toast.error(errorMessage);
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="3xl" className="text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading vendor details...
          </p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex w-full flex-col gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Vendor not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendorProfileData = (vendor.userProfile ||
    vendor.profile) as unknown as Record<string, unknown> | null;

  // Render field in section (from userProfile)
  const renderField = (fieldName: string, customLabel?: string) => {
    const value = vendorProfileData?.[fieldName];
    const formattedValue = formatValue(value, fieldName);

    const isEmail = fieldName.toLowerCase().includes("email") && value;
    const isPhone =
      (fieldName.toLowerCase().includes("phone") ||
        fieldName.toLowerCase().includes("mobile")) &&
      value;
    const isUrl =
      (fieldName.toLowerCase().endsWith("_url") ||
        fieldName.toLowerCase().includes("website") ||
        fieldName.toLowerCase().includes("link")) &&
      value;
    const isList = Array.isArray(formattedValue);

    return (
      <div key={fieldName}>
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {customLabel || formatFieldName(fieldName)}
        </label>
        <div className="text-foreground mt-2">
          {isEmail ? (
            <a
              href={`mailto:${value}`}
              className="text-primary hover:underline flex items-center gap-2 font-medium"
            >
              <Mail className="h-4 w-4" />
              {typeof formattedValue === "string"
                ? formattedValue
                : String(value)}
            </a>
          ) : isPhone ? (
            <a
              href={`tel:${value}`}
              className="text-primary hover:underline flex items-center gap-2 font-medium"
            >
              <Phone className="h-4 w-4" />
              {typeof formattedValue === "string"
                ? formattedValue
                : String(value)}
            </a>
          ) : isUrl && typeof value === "string" ? (
            <a
              href={value.startsWith("http") ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "hover:underline flex items-center gap-2 font-medium transition-colors",
                fieldName.endsWith("_url") ? "text-secondary" : "text-primary"
              )}
            >
              {fieldName.endsWith("_url") ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {fieldName.endsWith("_url")
                ? `View ${customLabel || formatFieldName(fieldName)}`
                : formattedValue}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ) : isList ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {formattedValue.map((item: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="break-all">
              {typeof formattedValue === "string"
                ? formattedValue
                : String(formattedValue)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* User Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Name
              </label>
              <p className="text-foreground mt-2">{vendor.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Username
              </label>
              <p className="text-foreground mt-2">{vendor.username}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <div className="text-foreground mt-2">
                <a
                  href={`mailto:${vendor.email}`}
                  className="text-primary hover:underline"
                >
                  {vendor.email}
                </a>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Phone
              </label>
              <div className="text-foreground mt-2">
                {vendor.phone ? (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="text-primary hover:underline"
                  >
                    {vendor.country_code || ""} {vendor.phone}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Email Verified
              </label>
              <p className="text-foreground mt-2">
                {vendor.email_verified ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Phone Verified
              </label>
              <p className="text-foreground mt-2">
                {vendor.phone_verified ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </label>
              <p className="text-foreground mt-2">
                <span
                  className={`text-sm font-medium ${vendor.is_active
                    ? "text-green-600 dark:text-green-500"
                    : "text-orange-600 dark:text-orange-500"
                    }`}
                >
                  {vendor.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Onboarding Step
              </label>
              <p className="text-foreground mt-2">
                {getOnboardingStepName(vendor.onboarding_step)}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Onboarding Status
              </label>
              <p className="text-foreground mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${vendorProfileData?.onboarding_status === "approved_controlled" ||
                    vendorProfileData?.onboarding_status === "approved_general"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : vendorProfileData?.onboarding_status === "under_review"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : vendorProfileData?.onboarding_status === "rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                >
                  {vendorProfileData?.onboarding_status === "approved_controlled" && (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {vendorProfileData?.onboarding_status === "approved_general" && (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {vendorProfileData?.onboarding_status === "under_review" && (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {vendorProfileData?.onboarding_status === "rejected" && (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {vendorProfileData?.onboarding_status
                    ? String(vendorProfileData.onboarding_status).replace(/_/g, " ")
                    : "Pending"}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      {vendorProfileData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {renderField("company_name")}
              {renderField("company_email")}
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Company Phone
                </label>
                <div className="text-foreground mt-2">
                  {vendorProfileData?.company_phone ? (
                    <a
                      href={`tel:${vendorProfileData.company_phone as string}`}
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      {(vendorProfileData.company_phone_country_code as string) ||
                        ""}{" "}
                      {vendorProfileData.company_phone as string}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              {renderField("country_of_registration")}
              {renderField("registered_company_name")}
              {renderField("trade_brand_name")}
              {renderField("year_of_establishment")}
              {renderField("entity_type")}
              {renderField("official_website")}
              {renderField("city_office_address")}
              {renderField("duns_number")}
              {renderField("tax_vat_number")}
              {renderField("tax_issuing_date")}
              {renderField("tax_expiry_date")}
              {renderField("sponsor_content", "Sponsor Content")}
              {renderField("selling_categories")}
              {renderField("vat_certificate_url", "VAT Certificate")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {vendorProfileData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {renderField("contact_full_name")}
              {renderField("contact_job_title")}
              {renderField("contact_work_email")}
              <div>
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Contact Mobile
                </label>
                <div className="text-foreground mt-2">
                  {vendorProfileData?.contact_mobile ? (
                    <a
                      href={`tel:${vendorProfileData.contact_mobile as string}`}
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      {(vendorProfileData.contact_mobile_country_code as string) ||
                        ""}{" "}
                      {vendorProfileData.contact_mobile as string}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              {renderField("contact_id_document_url", "ID Document")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal & Compliance */}
      {vendorProfileData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Legal & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {renderField("nature_of_business")}
              {renderField("license_types")}
              {renderField("end_use_markets")}
              {renderField("operating_countries")}
              {renderField("business_license_url", "Business License")}
              {renderField("company_profile_url", "Company Profile")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Information */}
      {vendorProfileData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {renderField("preferred_currency")}
              {renderField("bank_country")}
              {renderField("financial_institution")}
              {renderField("swift_code")}
              {renderField("bank_account_number")}
              {renderField("proof_type")}
              {renderField("bank_proof_url", "Bank Proof")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      <VendorApprovalActions vendor={vendor} />
      <VendorActions vendor={vendor} />
    </div>
  );
}

function VendorActions({ vendor }: { vendor: any }) {
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async ({ action, reason }: { action: 'activate' | 'suspend'; reason?: string }) => {
      return vendorService.updateStatus(vendor.id, action, reason);
    },
    onSuccess: () => {
      toast.success("Vendor status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vendor", vendor.id] });
      setSelectedAction("");
      setReason("");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  });

  const handleAction = () => {
    if (selectedAction === 'suspend' && !reason) {
      toast.error("Please provide a reason for suspension");
      return;
    }
    updateStatus({ action: selectedAction as 'activate' | 'suspend', reason });
  };

  return (
    <Card className="border-t-4 border-t-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Account Actions
        </CardTitle>
        <div className="w-56">
          <Select
            placeholder="Change Status..."
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className={cn(
              "font-semibold bg-primary text-white",
              selectedAction === "suspend"
                ? "bg-destructive border-destructive/50"
                : ""
            )}
          >
            {vendor.is_active ? (
              <option value="suspend">Suspend Account</option>
            ) : (
              <option value="activate">Activate Account</option>
            )}
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedAction && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {selectedAction === 'suspend' && (
              <div className="space-y-2">
                <Label
                  htmlFor="reason"
                  className="text-base font-semibold flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Suspension Reason (Required)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why the vendor is being suspended..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[120px] border-destructive/20 focus-visible:ring-destructive/30"
                />
              </div>
            )}

            <div className="flex gap-4">
              <Button
                size="lg"
                className={cn(
                  "px-8 font-semibold shadow-md transition-all min-w-[140px]",
                  selectedAction === "suspend"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground"
                )}
                disabled={isPending}
                onClick={handleAction}
              >
                {isPending ? (
                  <Spinner className="mr-2 h-4 w-4 border-2" />
                ) : selectedAction === "suspend" ? (
                  <XCircle className="mr-2 h-5 w-5" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                Confirm{" "}
                {selectedAction === "suspend" ? "Suspension" : "Activation"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 font-semibold border-2 transition-all"
                disabled={isPending}
                onClick={() => {
                  setSelectedAction("");
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { authService } from "@/services/admin/auth.service";

// ... existing code ...

function VendorApprovalActions({ vendor }: { vendor: any }) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [comment, setComment] = useState("");
  const [canApproveControlled, setCanApproveControlled] = useState(false);

  useEffect(() => {
    const hasPermission = authService.hasPermission("vendor.controlled.approve");
    setCanApproveControlled(hasPermission);
  }, []);

  const { approveVendor, isApproving, rejectVendor, isRejecting } =
    useVendorActions(vendor.id);

  const handleAction = async () => {
    if (selectedStatus === "rejected") {
      if (!comment) {
        toast.error("Please provide a reason for rejection in the comments");
        return;
      }
      try {
        await rejectVendor(comment);
        setSelectedStatus("");
        setComment("");
      } catch (e) {
        // Error handled in hook
      }
    } else {
      try {
        await approveVendor({ status: selectedStatus, note: comment });
        setSelectedStatus("");
        setComment("");
      } catch (e) {
        // Error handled in hook
      }
    }
  };

  const isPending = isApproving || isRejecting;

  return (
    <Card className="border-t-4 border-t-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Review & Approval
        </CardTitle>
        <div className="w-56">
          <Select
            placeholder="Change Status..."
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={cn(
              "font-semibold bg-primary text-white",
              selectedStatus === "rejected"
                ? "bg-destructive border-destructive/50"
                : ""
            )}
          >
            {canApproveControlled && (
              <option value="approved_controlled">Approved Controlled</option>
            )}
            <option value="approved_general">Approved General</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedStatus && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <Label
                htmlFor="comment"
                className="text-base font-semibold flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {selectedStatus === "rejected"
                  ? "Rejection Reason (Required)"
                  : "Notes / Comments"}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  selectedStatus === "rejected"
                    ? "Explain why the vendor is being rejected..."
                    : "Add any notes about this approval..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={cn(
                  "min-h-[120px]",
                  selectedStatus === "rejected"
                    ? "border-destructive/20 focus-visible:ring-destructive/30"
                    : ""
                )}
              />
            </div>
            <div className="flex gap-4">
              <Button
                size="lg"
                className={cn(
                  "px-8 font-semibold shadow-md transition-all min-w-[140px]",
                  selectedStatus === "rejected"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground"
                )}
                disabled={isPending}
                onClick={handleAction}
              >
                {isPending ? (
                  <Spinner className="mr-2 h-4 w-4 border-2" />
                ) : selectedStatus === "rejected" ? (
                  <XCircle className="mr-2 h-5 w-5" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                Confirm{" "}
                {selectedStatus === "rejected" ? "Rejection" : "Approval"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 font-semibold border-2 transition-all"
                disabled={isPending}
                onClick={() => {
                  setSelectedStatus("");
                  setComment("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
