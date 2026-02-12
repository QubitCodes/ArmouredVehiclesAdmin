"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Bold, Italic, Underline, Heading1, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { webFrontendService } from "@/services/admin/web-frontend.service";
import { cn } from "@/lib/utils";

/**
 * Invoice T&C tab IDs
 */
const TABS = [
    { id: "customer", label: "Customer Invoice T&C" },
    { id: "vendor", label: "Vendor Invoice T&C" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * InvoiceTermsView
 * Markdown editor for customer and vendor invoice Terms & Conditions.
 * Follows the same pattern as SubFooterTextView.
 */
export function InvoiceTermsView() {
    const [activeTab, setActiveTab] = useState<TabId>("customer");
    const [customerContent, setCustomerContent] = useState("");
    const [vendorContent, setVendorContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /** Fetch both T&C texts on mount */
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const terms = await webFrontendService.getInvoiceTerms();
                setCustomerContent(terms.customer || "");
                setVendorContent(terms.vendor || "");
            } catch {
                toast.error("Failed to load invoice terms");
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, []);

    /** Get/set content for the active tab */
    const content = activeTab === "customer" ? customerContent : vendorContent;
    const setContent = activeTab === "customer" ? setCustomerContent : setVendorContent;

    /**
     * Wraps selected text with markdown syntax.
     * If no selection, inserts placeholder text.
     */
    const wrapSelection = useCallback((prefix: string, suffix: string, placeholder: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentContent = activeTab === "customer" ? customerContent : vendorContent;
        const selected = currentContent.substring(start, end);
        const text = selected || placeholder;

        const before = currentContent.substring(0, start);
        const after = currentContent.substring(end);
        const newContent = `${before}${prefix}${text}${suffix}${after}`;

        if (activeTab === "customer") {
            setCustomerContent(newContent);
        } else {
            setVendorContent(newContent);
        }

        // Restore cursor position after React re-render
        setTimeout(() => {
            textarea.focus();
            const newStart = start + prefix.length;
            const newEnd = newStart + text.length;
            textarea.setSelectionRange(newStart, newEnd);
        }, 0);
    }, [activeTab, customerContent, vendorContent]);

    /** Toolbar button handlers */
    const handleBold = () => wrapSelection("**", "**", "bold text");
    const handleItalic = () => wrapSelection("*", "*", "italic text");
    const handleUnderline = () => wrapSelection("<u>", "</u>", "underlined text");

    /** Heading inserts at beginning of current line */
    const handleHeading = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const currentContent = activeTab === "customer" ? customerContent : vendorContent;
        const cursor = textarea.selectionStart;
        const lineStart = currentContent.lastIndexOf("\n", cursor - 1) + 1;
        const lineEnd = currentContent.indexOf("\n", cursor);
        const actualEnd = lineEnd === -1 ? currentContent.length : lineEnd;
        const currentLine = currentContent.substring(lineStart, actualEnd);

        let newLine: string;
        if (currentLine.startsWith("# ")) {
            newLine = currentLine.substring(2);
        } else {
            newLine = `# ${currentLine}`;
        }

        const newContent = currentContent.substring(0, lineStart) + newLine + currentContent.substring(actualEnd);
        if (activeTab === "customer") {
            setCustomerContent(newContent);
        } else {
            setVendorContent(newContent);
        }
    };

    /** Save the active tab's content to platform settings */
    const handleSave = async () => {
        try {
            setIsSaving(true);
            const payload = activeTab === "customer"
                ? { customer_invoice_terms: customerContent }
                : { vendor_invoice_terms: vendorContent };
            await webFrontendService.updateInvoiceTerms(payload);
            toast.success(`${activeTab === "customer" ? "Customer" : "Vendor"} invoice terms saved`);
        } catch {
            toast.error("Failed to save invoice terms");
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Converts the markdown subset to HTML for preview.
     * Supports: # heading, **bold**, *italic*, <u>underline</u>, newlines
     */
    const renderPreview = (text: string): string => {
        if (!text.trim()) return '<p class="text-gray-400 italic">No content yet. Start typing above.</p>';

        const lines = text.split("\n");
        const html = lines.map(line => {
            if (line.startsWith("# ")) {
                const headingContent = processInline(line.substring(2));
                return `<h2 class="text-lg font-bold mb-2">${headingContent}</h2>`;
            }
            if (!line.trim()) return "<br />";
            return `<p class="mb-2">${processInline(line)}</p>`;
        });

        return html.join("");
    };

    /** Process inline markdown: bold, italic, underline */
    const processInline = (text: string): string => {
        let result = text;
        result = result.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        result = result.replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>");
        result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
        return result;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Invoice Terms & Conditions</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage the T&C text that appears at the bottom of customer and vendor invoices.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </div>

            {/* Customer / Vendor Tabs */}
            <div className="flex gap-1 border-b">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors rounded-t-md -mb-px",
                            activeTab === tab.id
                                ? "border border-b-white bg-background text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div className="border rounded-lg overflow-hidden bg-background">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30">
                    <ToolbarButton icon={Heading1} label="Heading" onClick={handleHeading} />
                    <div className="w-px h-5 bg-border mx-1" />
                    <ToolbarButton icon={Bold} label="Bold" onClick={handleBold} />
                    <ToolbarButton icon={Italic} label="Italic" onClick={handleItalic} />
                    <ToolbarButton icon={Underline} label="Underline" onClick={handleUnderline} />
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Enter ${activeTab} invoice terms & conditions here...&#10;&#10;Use the toolbar above to format:&#10;# Heading&#10;**Bold** *Italic* <u>Underline</u>`}
                    className="w-full min-h-[250px] p-4 text-sm font-mono resize-y focus:outline-none bg-background text-foreground"
                    spellCheck={false}
                />
            </div>

            {/* Preview */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Preview</h3>
                <div
                    className="border rounded-lg p-6 bg-white text-gray-700 text-xs leading-relaxed min-h-[120px]"
                    dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                />
            </div>
        </div>
    );
}

/** Reusable toolbar button */
function ToolbarButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className={cn(
                "p-1.5 rounded hover:bg-muted transition-colors",
                "text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
