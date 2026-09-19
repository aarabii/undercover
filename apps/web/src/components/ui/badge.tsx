import * as React from "react";
import { cn, cva, type VariantProps } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-base border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase tracking-wider transition-colors shadow-brutal-sm",
  {
    variants: {
      variant: {
        default: "bg-black text-white",
        primary: "bg-yellow-300 text-black",
        secondary: "bg-sky-300 text-black",
        destructive: "bg-red-400 text-black",
        lime: "bg-lime-400 text-black",
        pink: "bg-pink-300 text-black",
        outline: "bg-white text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
