import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
  "2xl": "h-12 w-12",
  "3xl": "h-14 w-14",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
      aria-label="Loading"
    />
  );
}

