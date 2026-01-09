"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CustomPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  maxWidth?: string; // e.g. "max-w-2xl"
}

export function CustomPopup({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = "sm:max-w-[500px]",
}: CustomPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth, "bg-bg-light", className)}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground uppercase tracking-wide">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2">
            {children}
        </div>

        {footer && (
          <DialogFooter className="mt-4">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
