import * as React from "react";
import { cn, cva, type VariantProps } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-base border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase tracking-wider transition-colors shadow-brutal-sm",
  {
    variants: {
      variant: {
        default: "bg-black text-white",
        primary: "bg-amber-base text-ink",
        secondary: "bg-sky-base text-ink",
        destructive: "bg-crimson-base text-ink",
        lime: "bg-lime-base text-ink",
        pink: "bg-rose-base text-ink",
        outline: "bg-paper text-ink",
        mint: "bg-mint-base text-ink",
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
