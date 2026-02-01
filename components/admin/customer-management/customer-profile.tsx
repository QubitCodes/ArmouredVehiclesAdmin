"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    User,
    Mail,
    Phone,
    Shield,
    FileText,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Building2,
    CreditCard,
    Globe,
    ExternalLink,
    Trash2,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { customerService, Customer } from "@/services/admin/customer.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/admin/auth.service";
import { useEffect } from "react";
import { Switch } from "@/components/ui/switch";

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
        1: "Buyer Information",
        2: "Contact Person",
        3: "Declaration",
        4: "Account Setup",
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

interface CustomerProfileProps {
    customer: Customer;
    markedFields?: Set<string>;
    toggleMarkField?: (field: string) => void;
    canPerformActions?: boolean;
}

export function CustomerProfile({ customer, markedFields, toggleMarkField, canPerformActions }: CustomerProfileProps) {
    const profile = (customer.profile as any) || null;

    // Render row logic
    const renderRow = (fieldName: string, customLabel?: string, overrideValue?: React.ReactNode) => {
        const rawValue = overrideValue !== undefined ? overrideValue : profile?.[fieldName];
        const formattedValue = formatValue(profile?.[fieldName], fieldName);

        let displayValue: React.ReactNode = "—";

        if (overrideValue !== undefined) {
            displayValue = overrideValue;
        } else {
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
                        {formattedValue.map((item: string, index: number) => (
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
                {canPerformActions && toggleMarkField && (
                    <TableCell className="w-[80px] text-right">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMarkField(fieldName)}
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

    // Helper component to render a section as a table
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
                        <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="w-[250px] pl-6 text-xs uppercase font-bold tracking-wider">Field</TableHead>
                            <TableHead className="text-xs uppercase font-bold tracking-wider">Value</TableHead>
                            {canPerformActions && toggleMarkField && <TableHead className="w-[80px] text-right pr-6 text-xs uppercase font-bold tracking-wider">Action</TableHead>}
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
            {/* User Information Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
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
                            <p className="text-foreground mt-2">{customer.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Username
                            </label>
                            <p className="text-foreground mt-2">{customer.username}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Email
                            </label>
                            <div className="text-foreground mt-2">
                                <a
                                    href={`mailto:${customer.email}`}
                                    className="text-primary hover:underline"
                                >
                                    {customer.email}
                                </a>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Phone
                            </label>
                            <div className="text-foreground mt-2">
                                {customer.phone ? (
                                    <a
                                        href={`tel:${customer.phone}`}
                                        className="text-primary hover:underline"
                                    >
                                        {customer.country_code || ""} {customer.phone}
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
                                {customer.email_verified ? "Yes" : "No"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Phone Verified
                            </label>
                            <p className="text-foreground mt-2">
                                {customer.phone_verified ? "Yes" : "No"}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Status
                            </label>
                            <p className="text-foreground mt-2">
                                <span
                                    className={cn(
                                        "text-sm font-medium",
                                        customer.is_active
                                            ? "text-green-600 dark:text-green-500"
                                            : "text-red-600 dark:text-red-500"
                                    )}
                                >
                                    {customer.is_active ? "Active" : "Suspended"}
                                </span>
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Onboarding Step
                            </label>
                            <p className="text-foreground mt-2">{getOnboardingStepName(customer.onboarding_step)}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Onboarding Status
                            </label>
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
                        {customer.suspended_at && (
                            <>
                                <div>
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Suspended At
                                    </label>
                                    <p className="text-foreground mt-2">
                                        {new Date(customer.suspended_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Suspension Reason
                                    </label>
                                    <p className="text-foreground mt-2 break-all">
                                        {customer.suspended_reason || "—"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Company Information */}
            {profile && (
                <RenderSection title="Company Information" icon={Building2}>
                    {renderRow("company_name")}
                    {renderRow("company_email")}
                    {renderRow("company_phone", "Company Phone",
                        profile?.company_phone ? (
                            <a
                                href={`tel:${profile.company_phone as string}`}
                                className="text-primary hover:underline flex items-center gap-2"
                            >
                                <Phone className="h-4 w-4" />
                                {(profile.company_phone_country_code as string) || ""} {profile.company_phone as string}
                            </a>
                        ) : "—"
                    )}
                    {renderRow("country_of_registration")}
                    {renderRow("registered_company_name")}
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
                            <a
                                href={`tel:${profile.contact_mobile as string}`}
                                className="text-primary hover:underline flex items-center gap-2"
                            >
                                <Phone className="h-4 w-4" />
                                {(profile.contact_mobile_country_code as string) || ""} {profile.contact_mobile as string}
                            </a>
                        ) : "—"
                    )}
                    {renderRow("contact_id_document_url", "ID Document")}
                </RenderSection>
            )}

            {/* Legal & Compliance */}
            {profile && (
                <RenderSection title="Legal & Compliance" icon={Shield}>
                    {renderRow("controlled_items", "Buy Controlled Products")}
                    {/* {renderRow("nature_of_business")} */}
                    {renderRow("license_types")}
                    {renderRow("end_use_markets")}
                    {renderRow("operating_countries")}
                    {renderRow("business_license_url", "Business License")}
                    {renderRow("company_profile_url", "Company Profile")}
                </RenderSection>
            )}

            {/* Payment Information */}
            {/* {profile && (
                <RenderSection title="Payment Information" icon={CreditCard}>
                    {renderRow("preferred_currency")}
                    {renderRow("bank_country")}
                    {renderRow("financial_institution")}
                    {renderRow("swift_code")}
                    {renderRow("bank_account_number")}
                    {renderRow("proof_type")}
                    {renderRow("bank_proof_url", "Bank Proof")}
                </RenderSection>
            )} */}

            {/* Onboarding Review */}
            <OnboardingReview customer={customer} markedFields={markedFields} />

            {/* Admin Actions */}
            <CustomerActions customer={customer} />
        </div>
    );
}



function OnboardingReview({ customer, markedFields }: { customer: Customer, markedFields?: Set<string> }) {
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [note, setNote] = useState("");
    const queryClient = useQueryClient();
    const profile = (customer.profile as any) || {};
    const [canApproveControlled, setCanApproveControlled] = useState(false);

    useEffect(() => {
        // Check permissions on mount
        const hasPermission = authService.hasPermission("customer.controlled.approve");
        setCanApproveControlled(hasPermission);

        // Pre-select status and reason
        if (profile.onboarding_status) {
            setSelectedStatus(profile.onboarding_status);
        }

        // Map reason if rejected or needs update
        if (profile.onboarding_status === 'rejected' && profile.rejection_reason) {
            setNote(profile.rejection_reason);
        } else if (profile.onboarding_status === 'update_needed' && profile.update_needed_reason) {
            setNote(profile.update_needed_reason);
        }
    }, [profile]);

    // Force rejection if fields are marked
    const hasMarkedFields = markedFields && markedFields.size > 0;

    useEffect(() => {
        if (hasMarkedFields) {
            // Allow both 'rejected' and 'update_needed' for clearing fields
            if (selectedStatus !== "rejected" && selectedStatus !== "update_needed" && selectedStatus !== "") {
                toast.warning("You must reject or request an update when fields are marked for clearing.");
                setSelectedStatus("update_needed"); // Default to update_needed as softer rejection
            }
        }
    }, [hasMarkedFields, selectedStatus]);

    const { mutate: updateOnboarding, isPending } = useMutation({
        mutationFn: async ({ status, note, fields_to_clear }: { status: string; note?: string; fields_to_clear?: string[] }) => {
            return customerService.updateOnboardingStatus(customer.id, status, note, fields_to_clear);
        },
        onSuccess: () => {
            toast.success("Customer onboarding status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["customer", customer.id] });
            setSelectedStatus("");
            setNote("");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update onboarding status");
        }
    });

    const handleUpdate = () => {
        if (selectedStatus === 'rejected' || selectedStatus === 'update_needed') {
            if (!note) {
                toast.error("Please provide a reason");
                return;
            }
            updateOnboarding({
                status: selectedStatus,
                note,
                fields_to_clear: hasMarkedFields ? Array.from(markedFields) : undefined
            });
        } else {
            updateOnboarding({ status: selectedStatus, note });
        }
    };

    // Determine current status label
    const currentStatus = profile.onboarding_status || 'not_started';
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved_general': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'approved_controlled': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
            case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            case 'update_needed': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
            case 'pending_verification': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <Card className="border-t-4 border-t-secondary/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    Review & Approval
                </CardTitle>
                <div className={cn("px-3 py-1 rounded-full text-xs font-semibold uppercase", getStatusColor(currentStatus))}>
                    {currentStatus.replace('_', ' ')}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 items-end">
                    <div className="w-64 space-y-2">
                        <Label>Review Action</Label>
                        <Select
                            placeholder="Select Decision..."
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            {/* General Approval Option */}
                            {(!hasMarkedFields && (authService.hasPermission("customer.approve") || authService.hasPermission("customer.controlled.approve"))) && (
                                <option value="approved_general">Approve (General)</option>
                            )}

                            {/* Controlled Approval Option */}
                            {((canApproveControlled || authService.hasPermission("customer.controlled.approve")) && !hasMarkedFields) && (
                                <option value="approved_controlled">Approve (Controlled)</option>
                            )}

                            <option value="rejected">Reject Application</option>
                            <option value="update_needed">Request Update</option>
                            <option value="pending_verification">Set to Pending</option>
                        </Select>
                    </div>
                </div>

                {selectedStatus && (
                    <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                            <Label
                                htmlFor="review-note"
                                className="text-base font-semibold flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {selectedStatus === 'rejected' || selectedStatus === 'update_needed' ? 'Reason (Required)' : 'Review Note (Optional)'}
                            </Label>
                            <Textarea
                                id="review-note"
                                placeholder={selectedStatus === 'rejected' ? "Explain why the application is rejected..." : selectedStatus === 'update_needed' ? "Explain what needs to be updated..." : "Add any internal notes about this approval..."}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className={cn(
                                    "min-h-[100px]",
                                    selectedStatus === 'rejected' ? "border-destructive/20 focus-visible:ring-destructive/30" : ""
                                )}
                            />
                            {hasMarkedFields && (selectedStatus === "rejected" || selectedStatus === "update_needed") && (
                                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {markedFields.size} field(s) marked for clearing will be removed.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className={cn(
                                    "px-8 font-semibold shadow-md transition-all min-w-[140px]",
                                    selectedStatus === "rejected"
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                )}
                                disabled={isPending}
                                onClick={handleUpdate}
                            >
                                {isPending ? (
                                    <Spinner className="mr-2 h-4 w-4 border-2" />
                                ) : (selectedStatus === "rejected" || selectedStatus === "update_needed") ? (
                                    <AlertCircle className="mr-2 h-5 w-5" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                )}
                                {selectedStatus === "rejected" ? "Confirm Rejection" : selectedStatus === "update_needed" ? "Confirm Update Request" : "Confirm Decision"}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="px-8 font-semibold border-2 transition-all"
                                disabled={isPending}
                                onClick={() => {
                                    setSelectedStatus("");
                                    setNote("");
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

function CustomerActions({ customer }: { customer: Customer }) {
    const [isSuspended, setIsSuspended] = useState(!customer.is_active);
    const [reason, setReason] = useState("");
    const queryClient = useQueryClient();

    if (!authService.hasPermission("customer.manage")) {
        return null;
    }

    // Sync state with prop
    useEffect(() => {
        setIsSuspended(!customer.is_active);
    }, [customer.is_active]);

    const { mutate: updateStatus, isPending } = useMutation({
        mutationFn: async ({ action, reason }: { action: 'activate' | 'suspend'; reason?: string }) => {
            return customerService.updateStatus(customer.id, action, reason);
        },
        onSuccess: () => {
            toast.success("Customer status updated successfully");
            queryClient.invalidateQueries({ queryKey: ["customer", customer.id] });
            setReason("");
            // State sync is handled by useEffect when data refetches
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update status");
            // Revert switch on error if needed
            setIsSuspended(!customer.is_active);
        }
    });

    const handleToggle = (checked: boolean) => {
        setIsSuspended(checked);
    };

    const hasPendingChange = isSuspended !== (!customer.is_active);

    const handleAction = () => {
        const action = isSuspended ? 'suspend' : 'activate';

        if (action === 'suspend' && !reason) {
            toast.error("Please provide a reason for suspension");
            return;
        }
        updateStatus({ action, reason });
    };

    const handleCancel = () => {
        setIsSuspended(!customer.is_active); // Revert to actual state
        setReason("");
    };

    return (
        <Card className="border-t-4 border-t-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Suspend Account
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Label htmlFor="suspend-mode" className="text-sm font-medium text-muted-foreground">
                        {isSuspended ? "Suspended" : "Active"}
                    </Label>
                    <Switch
                        id="suspend-mode"
                        checked={isSuspended}
                        onCheckedChange={handleToggle}
                        disabled={isPending}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {hasPendingChange && (
                    <div className="grid gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="rounded-md bg-muted/50 p-4 border border-dashed">
                            <p className="text-sm font-medium mb-4">
                                You are about to <span className={isSuspended ? "text-destructive" : "text-green-600"}>{isSuspended ? "SUSPEND" : "ACTIVATE"}</span> this customer.
                            </p>

                            {isSuspended && (
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="suspend-reason"
                                        className="text-base font-semibold flex items-center gap-2"
                                    >
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Suspension Reason (Required)
                                    </Label>
                                    <Textarea
                                        id="suspend-reason"
                                        placeholder="Explain why the customer is being suspended..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="min-h-[120px] border-destructive/20 focus-visible:ring-destructive/30"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className={cn(
                                    "px-8 font-semibold shadow-md transition-all min-w-[140px]",
                                    isSuspended
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                )}
                                disabled={isPending}
                                onClick={handleAction}
                            >
                                {isPending ? (
                                    <Spinner className="mr-2 h-4 w-4 border-2" />
                                ) : isSuspended ? (
                                    <XCircle className="mr-2 h-5 w-5" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                )}
                                Confirm {isSuspended ? "Suspension" : "Activation"}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="px-8 font-semibold border-2 transition-all"
                                disabled={isPending}
                                onClick={handleCancel}
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
