"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Building2, User, Mail, Calendar, Shield, FileText, CreditCard } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendor } from "@/hooks/admin/vendor-management/use-vendor";

// Helper function to format field names (camelCase to Title Case)
const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// Helper function to format field value
const formatFieldValue = (value: unknown, fieldName: string): string => {
  if (value === undefined || value === null) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }
    return value.filter((item) => item !== "" && item !== null).join(", ");
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    return value.toString();
  }

  return String(value);
};

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const {
    data: vendor,
    isLoading,
    error,
  } = useVendor(userId);

  // Handle 404 errors - redirect to listing page if vendor doesn't exist
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError?.response?.status === 404) {
        // Vendor doesn't exist, redirect to listing page
        router.replace("/admin/vendors");
        return;
      }
      const errorMessage = axiosError?.response?.data?.message || axiosError?.message || "Failed to fetch vendor";
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

  const vendorData = vendor as unknown as Record<string, unknown>;

  // Render field in section
  const renderField = (fieldName: string) => {
    const value = vendorData[fieldName];
    const formattedValue = formatFieldValue(value, fieldName);

    return (
      <div key={fieldName}>
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {formatFieldName(fieldName)}
        </label>
        <p className="text-foreground mt-2">
          {formattedValue}
        </p>
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
              <p className="text-foreground mt-2">
                {vendor.user.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Username
              </label>
              <p className="text-foreground mt-2">
                {vendor.user.username}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <p className="text-foreground mt-2">
                {vendor.user.email}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Phone
              </label>
              <p className="text-foreground mt-2">
                {vendor.user.phone ? `${vendor.user.countryCode || ""} ${vendor.user.phone}` : "—"}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Email Verified
              </label>
              <p className="text-foreground mt-2">
                {vendor.user.emailVerified ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Phone Verified
              </label>
              <p className="text-foreground mt-2">
                {vendor.user.phoneVerified ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </label>
              <p className="text-foreground mt-2">
                <span
                  className={`text-sm font-medium ${
                    vendor.user.isActive
                      ? "text-green-600 dark:text-green-500"
                      : "text-orange-600 dark:text-orange-500"
                  }`}
                >
                  {vendor.user.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Completion Percentage
              </label>
              <p className="text-foreground mt-2">
                {vendor.user.completionPercentage}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderField("companyName")}
            {renderField("companyEmail")}
            {renderField("companyPhone")}
            {renderField("country")}
            {renderField("countryOfRegistration")}
            {renderField("registeredCompanyName")}
            {renderField("tradeBrandName")}
            {renderField("yearOfEstablishment")}
            {renderField("entityType")}
            {renderField("officialWebsite")}
            {renderField("cityOfficeAddress")}
            {renderField("dunsNumber")}
          </div>
        </CardContent>
      </Card>

      {/* Legal & Compliance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Legal & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderField("legalEntityId")}
            {renderField("legalEntityIssueDate")}
            {renderField("legalEntityExpiryDate")}
            {renderField("taxVatNumber")}
            {renderField("taxIssuingDate")}
            {renderField("taxExpiryDate")}
            {renderField("complianceRegistration")}
            {renderField("isOnSanctionsList")}
            {renderField("controlledDualUseItems")}
            {renderField("licenseTypes")}
            {renderField("natureOfBusiness")}
            {renderField("endUseMarkets")}
            {renderField("operatingCountries")}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderField("contactFullName")}
            {renderField("contactJobTitle")}
            {renderField("contactWorkEmail")}
            {renderField("contactMobile")}
          </div>
        </CardContent>
      </Card>

      {/* Business Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderField("registerAs")}
            {renderField("typeOfBuyer")}
            {renderField("sellingCategories")}
            {renderField("preferredCurrency")}
            {renderField("sponsorContent")}
            {renderField("commissionPercent")}
          </div>
        </CardContent>
      </Card>

      {/* Payment Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {renderField("paymentMethod")}
            {renderField("bankCountry")}
            {renderField("financialInstitution")}
            {renderField("swiftCode")}
            {renderField("bankAccountNumber")}
            {renderField("proofType")}
            {renderField("verificationMethod")}
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Onboarding Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Onboarding Status
              </label>
              <p className="text-foreground mt-2">
                <span
                  className={`text-sm font-medium capitalize ${
                    vendor.onboardingStatus === "approved"
                      ? "text-green-600 dark:text-green-500"
                      : vendor.onboardingStatus === "under_review"
                      ? "text-yellow-600 dark:text-yellow-500"
                      : vendor.onboardingStatus === "rejected"
                      ? "text-red-600 dark:text-red-500"
                      : "text-gray-600 dark:text-gray-500"
                  }`}
                >
                  {vendor.onboardingStatus.replace("_", " ")}
                </span>
              </p>
            </div>
            {renderField("currentStep")}
            {renderField("submittedForApproval")}
            {renderField("submittedAt")}
            {renderField("completedAt")}
            {renderField("reviewedBy")}
            {renderField("reviewedAt")}
            {renderField("reviewNote")}
            {renderField("rejectionReason")}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Created At
            </label>
            <p className="text-foreground mt-2">
              {new Date(vendor.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          {vendor.updatedAt && (
            <div>
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Last Updated
              </label>
              <p className="text-foreground mt-2">
                {new Date(vendor.updatedAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

