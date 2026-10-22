import * as React from "react";
import { cn, cva, type VariantProps } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-base border-black font-bold tracking-wide transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
  {
    variants: {
      variant: {
        primary: "bg-amber-base hover:bg-amber-tint text-ink",
        secondary: "bg-sky-base hover:bg-sky-tint text-ink",
        default: "bg-lime-base hover:bg-lime-tint text-ink",
        lime: "bg-lime-base hover:bg-lime-tint text-ink",
        rose: "bg-rose-base hover:bg-rose-tint text-ink",
        destructive: "bg-crimson-base hover:bg-crimson-tint text-ink",
        danger: "bg-crimson-base hover:bg-crimson-tint text-ink",
        outline: "bg-paper hover:bg-canvas-fade text-ink",
        subtleDanger: "bg-paper text-crimson-shade hover:bg-crimson-fade",
        ghost: "border-transparent shadow-none hover:bg-black/10 active:bg-black/20",
        link: "border-none shadow-none text-ink underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        lg: "h-14 px-8 text-base font-black border-[3px] shadow-brutal active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        default: "h-11 px-5 py-2 text-sm font-bold border-[3px] shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        sm: "h-9 px-3 text-xs font-bold border-2 shadow-brutal-sm active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none",
        icon: "size-11 border-[3px] shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        "icon-sm": "size-9 border-2 shadow-brutal-sm active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
