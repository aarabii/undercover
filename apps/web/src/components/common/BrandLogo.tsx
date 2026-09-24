import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  size = "md",
  showTagline = true,
}) => {
  const iconSizes = {
    sm: "size-8 p-0.5",
    md: "size-10 p-1",
    lg: "size-14 p-1.5",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        className={cn(
          "rounded-base border-[3px] border-black bg-[#facc15] shadow-brutal flex items-center justify-center transition-transform hover:rotate-3 shrink-0",
          iconSizes[size]
        )}
      >
        <img
          src="/favicon.svg"
          alt="Undercover Default Icon"
          className="size-full object-contain"
        />
      </div>
      <div className="flex flex-col text-left">
        <span
          className={cn(
            "font-black tracking-tighter leading-none text-black",
            textSizes[size]
          )}
        >
          UNDERCOVER
        </span>
        {showTagline && (
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 leading-tight mt-0.5">
            Social Deduction
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
