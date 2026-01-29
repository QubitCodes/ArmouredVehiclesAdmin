"use client";

import {
    Building2,
    User,
    Mail,
    Shield,
    FileText,
    CreditCard,
    ExternalLink,
    Phone,
    Globe,
    CheckCircle2,
    AlertCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VendorProfileViewProps {
    user: any;
    profile: any;
}

// Helper function to format field names
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
        // Special check: If user is active and has no step, assume complete or not relevant?
        // Actually, step null usually means done or not started?
        // Let's stick to existing logic: "Completed"
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
const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "—";
    try {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateString;
    }
};

const formatValue = (value: unknown, fieldName: string): string | string[] => {
    if (value === undefined || value === null || value === "" || value === "—") {
        return "—";
    }

    if (fieldName.endsWith("_at") || fieldName.includes("_date") || fieldName === "date") {
        if (typeof value === 'string' && !isNaN(Date.parse(value))) {
            return formatDate(value);
        }
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

    // Deep parse function for JSON strings and Postgres Arrays
    const deepParse = (
        val: string
    ): string | string[] | Record<string, unknown> => {
        const trimmed = val.trim();
        if (!trimmed) return "—";

        // Handle Postgres Array Syntax
        if (trimmed.startsWith("{") && trimmed.endsWith("}") && !trimmed.includes(":")) {
            const inner = trimmed.substring(1, trimmed.length - 1);
            if (!inner) return [];

            const items = [];
            let current = '';
            let inQuote = false;

            for (let i = 0; i < inner.length; i++) {
                const char = inner[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    items.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            items.push(current.trim());

            return items.map(item => {
                if (item.startsWith('"') && item.endsWith('"')) {
                    return item.substring(1, item.length - 1).replace(/\\"/g, '"');
                }
                return item;
            });
        }

        // Try normal JSON parse
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === "string") {
                return deepParse(parsed);
            }
            return parsed;
        } catch {
            // fallback
        }

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
        processed = value.filter((i) => i !== "" && i !== null);
    }

    if (isListField) {
        if (processed === "—" || processed === null || processed === undefined)
            return "—";
        if (!Array.isArray(processed)) return [String(processed)];
        const filtered = processed.filter((i) => !!i);
        return filtered.length > 0 ? filtered : "—";
    }

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

export function VendorProfileView({ user, profile }: VendorProfileViewProps) {
    // Render field logic
    const renderField = (fieldName: string, customLabel?: string) => {
        const value = profile?.[fieldName];
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
                            <p className="text-foreground mt-2">{user.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Username
                            </label>
                            <p className="text-foreground mt-2">{user.username || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Email
                            </label>
                            <div className="text-foreground mt-2">
                                <a
                                    href={`mailto:${user.email}`}
                                    className="text-primary hover:underline"
                                >
                                    {user.email}
                                </a>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Phone
                            </label>
                            <div className="text-foreground mt-2">
                                {user.phone ? (
                                    <a
                                        href={`tel:${user.phone}`}
                                        className="text-primary hover:underline"
                                    >
                                        {user.country_code || ""} {user.phone}
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
                                {user.email_verified ? "Yes" : "No"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Phone Verified
                            </label>
                            <p className="text-foreground mt-2">
                                {user.phone_verified ? "Yes" : "No"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Status
                            </label>
                            <p className="text-foreground mt-2">
                                <span
                                    className={`text-sm font-medium ${user.is_active
                                        ? "text-green-600 dark:text-green-500"
                                        : "text-orange-600 dark:text-orange-500"
                                        }`}
                                >
                                    {user.is_active ? "Active" : "Inactive"}
                                </span>
                            </p>
                        </div>
                        {/* Show Onboarding info only if present (User might be Admin) */}
                        {user.user_type === 'vendor' && (
                            <>
                                <div>
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Onboarding Step
                                    </label>
                                    <p className="text-foreground mt-2">
                                        {getOnboardingStepName(user.onboarding_step)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Onboarding Status
                                    </label>
                                    <p className="text-foreground mt-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${profile?.onboarding_status === "approved_controlled" ||
                                                profile?.onboarding_status === "approved_general"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : profile?.onboarding_status === "under_review"
                                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    : profile?.onboarding_status === "rejected"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                }`}
                                        >
                                            {profile?.onboarding_status === "approved_controlled" && (
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            )}
                                            {profile?.onboarding_status === "approved_general" && (
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            )}
                                            {profile?.onboarding_status === "under_review" && (
                                                <AlertCircle className="h-3.5 w-3.5" />
                                            )}
                                            {profile?.onboarding_status === "rejected" && (
                                                <XCircle className="h-3.5 w-3.5" />
                                            )}
                                            {profile?.onboarding_status
                                                ? String(profile.onboarding_status).replace(/_/g, " ")
                                                : "Pending"}
                                        </span>
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Company Information */}
            {profile && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Company Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {renderField("registered_company_name", "Company Name")}
                            {renderField("contact_full_name", "Contact Person Name")}
                            {renderField("contact_work_email", "Company Email")}
                            <div>
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Company Phone
                                </label>
                                <div className="text-foreground mt-2">
                                    {profile?.contact_mobile ? (
                                        <a
                                            href={`tel:${profile.contact_mobile as string}`}
                                            className="text-primary hover:underline flex items-center gap-2"
                                        >
                                            <Phone className="h-4 w-4" />
                                            {(profile.contact_mobile_country_code as string) ||
                                                ""}{" "}
                                            {profile.contact_mobile as string}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </div>
                            </div>
                            {renderField("country_of_registration")}
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
            {profile && (
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
                                    {profile?.contact_mobile ? (
                                        <a
                                            href={`tel:${profile.contact_mobile as string}`}
                                            className="text-primary hover:underline flex items-center gap-2"
                                        >
                                            <Phone className="h-4 w-4" />
                                            {(profile.contact_mobile_country_code as string) ||
                                                ""}{" "}
                                            {profile.contact_mobile as string}
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
            {profile && (
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
            {profile && (
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
        </div>
    );
}
