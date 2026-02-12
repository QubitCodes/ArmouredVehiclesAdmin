"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Bold, Italic, Underline, Heading1, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { webFrontendService } from "@/services/admin/web-frontend.service";
import { cn } from "@/lib/utils";

/**
 * SubFooterTextView - Markdown editor for the sub-footer SEO text.
 * Supports: Bold (**), Italic (*), Underline (<u>), Heading (# )
 */
export function SubFooterTextView() {
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /** Fetch current sub-footer text on mount */
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await webFrontendService.getSubFooterText();
                setContent(data || "");
            } catch {
                toast.error("Failed to load sub-footer text");
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, []);

    /**
     * Wraps selected text with markdown syntax.
     * If no selection, inserts placeholder text.
     */
    const wrapSelection = useCallback((prefix: string, suffix: string, placeholder: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.substring(start, end);
        const text = selected || placeholder;

        const before = content.substring(0, start);
        const after = content.substring(end);
        const newContent = `${before}${prefix}${text}${suffix}${after}`;

        setContent(newContent);

        // Restore cursor position after React re-render
        setTimeout(() => {
            textarea.focus();
            const newStart = start + prefix.length;
            const newEnd = newStart + text.length;
            textarea.setSelectionRange(newStart, newEnd);
        }, 0);
    }, [content]);

    /** Toolbar button handlers */
    const handleBold = () => wrapSelection("**", "**", "bold text");
    const handleItalic = () => wrapSelection("*", "*", "italic text");
    const handleUnderline = () => wrapSelection("<u>", "</u>", "underlined text");

    /** Heading inserts at beginning of current line */
    const handleHeading = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursor = textarea.selectionStart;
        const lineStart = content.lastIndexOf("\n", cursor - 1) + 1;
        const lineEnd = content.indexOf("\n", cursor);
        const actualEnd = lineEnd === -1 ? content.length : lineEnd;
        const currentLine = content.substring(lineStart, actualEnd);

        let newLine: string;
        if (currentLine.startsWith("# ")) {
            // Toggle off — remove heading prefix
            newLine = currentLine.substring(2);
        } else {
            // Add heading prefix
            newLine = `# ${currentLine}`;
        }

        const newContent = content.substring(0, lineStart) + newLine + content.substring(actualEnd);
        setContent(newContent);
    };

    /** Save to platform settings */
    const handleSave = async () => {
        try {
            setIsSaving(true);
            await webFrontendService.updateSubFooterText(content);
            toast.success("Sub-footer text saved successfully");
        } catch {
            toast.error("Failed to save sub-footer text");
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
            // Heading
            if (line.startsWith("# ")) {
                const headingContent = processInline(line.substring(2));
                return `<h2 class="text-lg font-bold mb-2">${headingContent}</h2>`;
            }

            // Empty line = paragraph break
            if (!line.trim()) return "<br />";

            // Regular paragraph
            return `<p class="mb-2">${processInline(line)}</p>`;
        });

        return html.join("");
    };

    /** Process inline markdown: bold, italic, underline */
    const processInline = (text: string): string => {
        let result = text;
        // Escape HTML except <u> tags
        result = result.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Restore <u> tags
        result = result.replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>");

        // Bold: **text**
        result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

        // Italic: *text* (but not **)
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
                    <h2 className="text-xl font-semibold">Sub Footer Text</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        This text appears above the footer on the website. Use the toolbar to format.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? "Saving..." : "Save"}
                </Button>
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
                    placeholder="Enter sub-footer text here...&#10;&#10;Use the toolbar above to format:&#10;# Heading&#10;**Bold** *Italic* <u>Underline</u>"
                    className="w-full min-h-[250px] p-4 text-sm font-mono resize-y focus:outline-none bg-background text-foreground"
                    spellCheck={false}
                />
            </div>

            {/* Preview */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Preview</h3>
                <div
                    className="border rounded-lg p-6 bg-[#333] text-white text-sm leading-relaxed min-h-[120px]"
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
