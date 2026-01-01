import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive font-heading",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 uppercase tracking-wide px-12 py-2.5 font-medium",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 uppercase tracking-wide px-12 py-2",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 px-4 py-2",
        secondary:
          "bg-secondary text-white hover:bg-secondary/90 uppercase tracking-wide px-12 py-2.5 font-medium",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto",
        sm: "h-auto gap-1.5 text-xs",
        lg: "h-auto text-base",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // Apply pointed arrow design for default, destructive, and secondary variants (but not icon sizes)
  const shouldApplyPointedDesign = 
    (variant === "default" || variant === "destructive" || variant === "secondary") &&
    size !== "icon" && size !== "icon-sm" && size !== "icon-lg";

  // Refined clip-path for more pronounced arrow-like pointed ends matching the reference
  // The clip-path creates the pointed arrow ends while preserving all the padding
  const buttonStyle = shouldApplyPointedDesign
    ? {
        ...style,
        clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)",
      }
    : style;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      style={buttonStyle}
      {...props}
    />
  );
}

export { Button, buttonVariants };
