
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SlidersView } from "./sliders-view";
import { AdsView } from "./ads-view";
import { SubFooterTextView } from "./sub-footer-text-view";
import { InvoiceTermsView } from "./invoice-terms-view";

const SECTIONS = [
    { id: "sliders", label: "Home Slider" },
    { id: "ads", label: "Ads" },
    { id: "sub_footer_text", label: "Sub Footer Text" },
    { id: "invoice_terms", label: "Invoice T&C" }
];

export function WebFrontendManager() {
    const [selectedSection, setSelectedSection] = useState(SECTIONS[0].id);

    return (
        <div className="flex bg-bg-light border rounded-lg overflow-hidden min-h-[600px]">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/10 p-4">
                <h3 className="font-semibold mb-4 px-2">Web Frontend</h3>
                <div className="space-y-1">
                    {SECTIONS.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setSelectedSection(section.id)}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                selectedSection === section.id
                                    ? "bg-secondary text-secondary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                {selectedSection === 'sliders' && <SlidersView />}
                {selectedSection === 'ads' && <AdsView />}
                {selectedSection === 'sub_footer_text' && <SubFooterTextView />}
                {selectedSection === 'invoice_terms' && <InvoiceTermsView />}
            </div>
        </div>
    );
}

