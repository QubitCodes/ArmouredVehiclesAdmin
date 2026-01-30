"use client";

import * as React from "react";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionProps {
    children: React.ReactNode;
    className?: string;
    allowMultiple?: boolean;
}

interface AccordionItemProps {
    id: string;
    title: string;
    icon?: React.ElementType;
    children: React.ReactNode;
    isOpen?: boolean;
    isLocked?: boolean;
    onToggle?: () => void;
    className?: string;
}

export const Accordion = ({ children, className, allowMultiple = false }: AccordionProps) => {
    return (
        <div className={cn("space-y-4", className)}>
            {children}
        </div>
    );
};

export const AccordionItem = ({
    id,
    title,
    icon: Icon,
    children,
    isOpen = false,
    isLocked = false,
    onToggle,
    className,
}: AccordionItemProps) => {
    const contentRef = React.useRef<HTMLDivElement>(null);

    return (
        <div
            id={id}
            className={cn(
                "border rounded-lg overflow-hidden transition-all duration-200",
                isOpen ? "border-primary ring-1 ring-primary/20" : "border-border",
                isLocked && "opacity-75 grayscale-[0.5]",
                className
            )}
        >
            <button
                type="button"
                disabled={isLocked}
                onClick={onToggle}
                className={cn(
                    "w-full flex items-center justify-between px-6 py-4 text-left transition-colors",
                    isOpen ? "bg-primary/5" : "bg-card hover:bg-accent/50",
                    isLocked ? "cursor-not-allowed" : "cursor-pointer"
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className={cn("h-5 w-5", isOpen ? "text-primary" : "text-muted-foreground")} />}
                    <span className={cn("font-semibold", isOpen ? "text-primary" : "text-foreground")}>
                        {title}
                    </span>
                    {isLocked && <Lock className="h-4 w-4 text-muted-foreground ml-2" />}
                </div>
                <ChevronDown
                    className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
                    )}
                />
            </button>

            <div
                className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isOpen ? "max-h-[5000px] border-t border-border" : "max-h-0"
                )}
            >
                <div className="p-6 bg-card">
                    {children}
                </div>
            </div>
        </div>
    );
};
