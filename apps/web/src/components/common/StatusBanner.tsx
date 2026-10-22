import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

export type StatusBannerVariant = "info" | "success" | "warning" | "danger" | "neutral";

interface StatusBannerProps {
  variant?: StatusBannerVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const variantStyles: Record<
  StatusBannerVariant,
  { container: string; defaultIcon: React.ReactNode }
> = {
  info: {
    container: "bg-sky-fade text-ink border-sky-shade/80 shadow-[2px_2px_0px_#0EA5E9]",
    defaultIcon: <Info className="size-4 shrink-0 text-sky-shade" />,
  },
  success: {
    container: "bg-lime-fade text-ink border-lime-shade/80 shadow-[2px_2px_0px_#84CC16]",
    defaultIcon: <CheckCircle2 className="size-4 shrink-0 text-lime-shade" />,
  },
  warning: {
    container: "bg-amber-fade text-ink border-amber-shade/80 shadow-[2px_2px_0px_#E6B000]",
    defaultIcon: <AlertTriangle className="size-4 shrink-0 text-amber-shade" />,
  },
  danger: {
    container: "bg-crimson-fade text-ink border-crimson-shade/80 shadow-[2px_2px_0px_#E03A2F]",
    defaultIcon: <XCircle className="size-4 shrink-0 text-crimson-shade" />,
  },
  neutral: {
    container: "bg-canvas-fade text-ink border-black shadow-[2px_2px_0px_#000]",
    defaultIcon: <Info className="size-4 shrink-0 text-ink-muted" />,
  },
};

export const StatusBanner: React.FC<StatusBannerProps> = ({
  variant = "info",
  icon,
  children,
  className,
  action,
}) => {
  const conf = variantStyles[variant];

  return (
    <div
      className={cn(
        "w-full p-3 rounded-base border-2 text-xs font-bold flex items-center justify-between gap-2.5 transition-all text-left",
        conf.container,
        className
      )}
      role="status"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon !== undefined ? icon : conf.defaultIcon}
        <div className="leading-snug break-words [overflow-wrap:anywhere]">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default StatusBanner;
