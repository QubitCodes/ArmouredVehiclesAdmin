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
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface VendorProfileViewProps {
    user: any;
    profile: any;
    markedFields?: Set<string>;
    toggleMarkField?: (field: string) => void;
    canPerformActions?: boolean;
    hideUserInfo?: boolean;
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

    // Deep parse function
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

export function VendorProfileView({ user, profile, markedFields, toggleMarkField, canPerformActions, hideUserInfo = false }: VendorProfileViewProps) {

    // Render row logic
    const renderRow = (fieldName: string, customLabel?: string, overrideValue?: React.ReactNode) => {
        const value = overrideValue !== undefined ? overrideValue : profile?.[fieldName];
        // Pass value if overrideValue is not provided, else pass helper logic
        // Actually overrideValue is only for Company Phone custom render.
        // If overrideValue is NULL/undefined, we get value from profile.
        // But overrideValue might be passed as a ReactNode. We need to handle this.

        let displayValue: React.ReactNode = "—";

        if (overrideValue) {
            displayValue = overrideValue;
        } else {
            const rawValue = profile?.[fieldName];
            const formattedValue = formatValue(rawValue, fieldName);

            const isEmail = fieldName.toLowerCase().includes("email") && rawValue;
            const isPhone =
                (fieldName.toLowerCase().includes("phone") ||
                    fieldName.toLowerCase().includes("mobile")) &&
                rawValue;
            const isUrl =
                (fieldName.toLowerCase().endsWith("_url") ||
                    fieldName.toLowerCase().includes("website") ||
                    fieldName.toLowerCase().includes("link")) &&
                rawValue;
            const isList = Array.isArray(formattedValue);

            if (isEmail) {
                displayValue = (
                    <a
                        href={`mailto:${rawValue}`}
                        className="text-primary hover:underline flex items-center gap-2 font-medium"
                    >
                        <Mail className="h-4 w-4" />
                        {typeof formattedValue === "string" ? formattedValue : String(rawValue)}
                    </a>
                );
            } else if (isPhone) {
                displayValue = (
                    <a
                        href={`tel:${rawValue}`}
                        className="text-primary hover:underline flex items-center gap-2 font-medium"
                    >
                        <Phone className="h-4 w-4" />
                        {typeof formattedValue === "string" ? formattedValue : String(rawValue)}
                    </a>
                );
            } else if (isUrl && typeof rawValue === "string") {
                displayValue = (
                    <a
                        href={rawValue.startsWith("http") ? rawValue : `https://${rawValue}`}
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
                );
            } else if (isList) {
                displayValue = (
                    <div className="flex flex-wrap gap-2">
                        {(formattedValue as string[]).map((item, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                );
            } else {
                displayValue = <span className="break-all">{typeof formattedValue === "string" ? formattedValue : String(formattedValue)}</span>;
            }
        }

        const isMarked = markedFields?.has(fieldName);

        return (
            <TableRow key={fieldName} className={cn(isMarked && "bg-destructive/10")}>
                <TableCell className={cn("font-medium text-muted-foreground w-[250px] uppercase text-xs tracking-wide", isMarked && "line-through opacity-50")}>
                    {customLabel || formatFieldName(fieldName)}
                </TableCell>
                <TableCell className={cn(isMarked && "line-through opacity-50 text-destructive")}>
                    {displayValue}
                </TableCell>
                {canPerformActions && (
                    <TableCell className="w-[80px] text-right">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMarkField?.(fieldName)}
                            className={cn("h-8 w-8", isMarked ? "text-destructive hover:text-destructive/90 hover:bg-destructive/20 bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
                            title={isMarked ? "Undo Mark for Deletion" : "Mark field for deletion"}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                )}
            </TableRow>
        );
    };

    // Component to render a table within a card
    const RenderSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
        <Card>
            <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[250px] pl-6">Field</TableHead>
                            <TableHead>Value</TableHead>
                            {canPerformActions && <TableHead className="w-[80px] text-right pr-6">Action</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {children}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex w-full flex-col gap-8">
            {/* User Information Section - No Actions generally, or handle differently */}
            {!hideUserInfo && (
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
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
                                <p className="text-foreground mt-2">{user.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                                <p className="text-foreground mt-2">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
                                <p className="text-foreground mt-2">{user.country_code} {user.phone}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                                <p className="text-foreground mt-2">
                                    <span className={cn("text-sm font-medium", user.is_active ? "text-green-600" : "text-orange-600")}>
                                        {user.is_active ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </div>
                            {user.user_type === 'vendor' && (
                                <>
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Onboarding Step</label>
                                        <p className="text-foreground mt-2">{getOnboardingStepName(user.onboarding_step)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Onboarding Status</label>
                                        <p className="text-foreground mt-2">
                                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase",
                                                profile?.onboarding_status?.includes("approved") ? "bg-green-100 text-green-700" :
                                                    profile?.onboarding_status === "rejected" ? "bg-red-100 text-red-700" :
                                                        profile?.onboarding_status === "update_needed" ? "bg-yellow-100 text-yellow-700" :
                                                            "bg-gray-100 text-gray-700"
                                            )}>
                                                {profile?.onboarding_status?.replace(/_/g, " ") || "Pending"}
                                            </span>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Company Information */}
            {profile && (
                <RenderSection title="Company Information" icon={Building2}>
                    {renderRow("registered_company_name", "Company Name")}
                    {renderRow("contact_full_name", "Contact Person Name")}
                    {renderRow("contact_work_email", "Company Email")}

                    {/* Custom Phone Logic injection for table row */}
                    {renderRow("contact_mobile", "Company Phone",
                        profile?.contact_mobile ? (
                            <a href={`tel:${profile.contact_mobile}`} className="text-primary hover:underline flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {profile.contact_mobile_country_code || ""} {profile.contact_mobile}
                            </a>
                        ) : "—"
                    )}

                    {renderRow("country_of_registration")}
                    {renderRow("trade_brand_name")}
                    {renderRow("year_of_establishment")}
                    {renderRow("entity_type")}
                    {renderRow("official_website")}
                    {renderRow("city_office_address")}
                    {renderRow("duns_number")}
                    {renderRow("tax_vat_number")}
                    {renderRow("tax_issuing_date")}
                    {renderRow("tax_expiry_date")}
                    {renderRow("sponsor_content", "Sponsor Content")}
                    {renderRow("selling_categories")}
                    {renderRow("vat_certificate_url", "VAT Certificate")}
                </RenderSection>
            )}

            {/* Contact Information */}
            {profile && (
                <RenderSection title="Contact Information" icon={Mail}>
                    {renderRow("contact_full_name")}
                    {renderRow("contact_job_title")}
                    {renderRow("contact_work_email")}
                    {renderRow("contact_mobile", "Contact Mobile",
                        profile?.contact_mobile ? (
                            <a href={`tel:${profile.contact_mobile}`} className="text-primary hover:underline flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {profile.contact_mobile_country_code || ""} {profile.contact_mobile}
                            </a>
                        ) : "—"
                    )}
                    {renderRow("contact_id_document_url", "ID Document")}
                </RenderSection>
            )}

            {/* Legal & Compliance */}
            {profile && (
                <RenderSection title="Legal & Compliance" icon={Shield}>
                    {renderRow("controlled_items", "Sell Controlled Products")}
                    {renderRow("nature_of_business")}
                    {renderRow("license_types")}
                    {renderRow("end_use_markets")}
                    {renderRow("operating_countries")}
                    {renderRow("business_license_url", "Business License")}
                </RenderSection>
            )}

            {/* Payment Information */}
            {profile && (
                <RenderSection title="Payment Information" icon={CreditCard}>
                    {renderRow("preferred_currency")}
                    {renderRow("bank_country")}
                    {renderRow("financial_institution")}
                    {renderRow("swift_code")}
                    {renderRow("bank_account_number")}
                    {renderRow("proof_type")}
                    {renderRow("bank_proof_url", "Bank Proof")}
                </RenderSection>
            )}
        </div>
    );
}
