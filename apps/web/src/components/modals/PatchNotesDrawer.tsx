import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PATCH_NOTES } from "@/lib/patchNotes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GiCancel, GiSecretBook } from "react-icons/gi";
import { Sparkles, CheckCircle2, Wrench, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatchNotesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const PatchNotesDrawer: React.FC<PatchNotesDrawerProps> = ({
  open,
  onOpenChange,
  trigger,
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}

      <DialogPrimitive.Portal>
        {/* Backdrop Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Drawer Content: Slide in from right on desktop, slide up from bottom on mobile */}
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col bg-canvas border-black text-ink outline-none",
            // Mobile: Bottom sheet
            "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-base border-t-[3px] border-x-[3px] shadow-[0px_-6px_0px_#000] duration-300",
            // Desktop: Right side slide-over drawer
            "sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:h-dvh sm:max-h-dvh sm:w-[500px] sm:rounded-none sm:border-t-0 sm:border-y-0 sm:border-l-[3px] sm:shadow-[-6px_0px_0px_#000]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          )}
        >
          {/* Top Classified Header Bar */}
          <div className="shrink-0 p-5 sm:p-6 bg-paper border-b-[3px] border-black flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-base border-2 border-black bg-rose-base flex items-center justify-center shadow-brutal-sm">
                  <GiSecretBook className="size-4 text-ink" />
                </div>
                <Badge variant="primary" className="bg-amber-base text-ink font-mono text-[10px]">
                  DECLASSIFIED ARCHIVE
                </Badge>
              </div>

              <DialogPrimitive.Title className="text-xl sm:text-2xl font-black tracking-tight text-ink font-heading uppercase">
                Field Patch Notes
              </DialogPrimitive.Title>

              <DialogPrimitive.Description className="text-xs font-medium text-ink-muted">
                Official changelog, dossier upgrades, balance adjustments, and counter-intel updates.
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close className="shrink-0 size-8 rounded-base border-2 border-black bg-paper text-ink shadow-brutal-sm hover:bg-black hover:text-white transition-colors flex items-center justify-center cursor-pointer active:translate-x-0.5 active:translate-y-0.5">
              <GiCancel className="size-4" />
              <span className="sr-only">Close patch notes</span>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable Changelog Timeline */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-canvas bg-dossier-grid">
            {PATCH_NOTES.map((release) => (
              <div
                key={release.version}
                className={cn(
                  "rounded-base border-[3px] border-black bg-paper p-5 shadow-brutal space-y-3.5 transition-transform hover:-translate-y-0.5",
                  release.isLatest && "border-[3px] border-black ring-2 ring-amber-base"
                )}
              >
                {/* Release Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-ink">
                      {release.version}
                    </span>
                    {release.isLatest && (
                      <Badge variant="lime" className="bg-lime-base text-ink text-[10px] px-2 py-0.5">
                        Latest Dispatch
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-ink-muted">
                    {release.date}
                  </span>
                </div>

                {/* Release Title & Summary */}
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-base text-ink leading-tight">
                    {release.title}
                  </h4>
                  <p className="text-xs font-medium text-ink-muted leading-relaxed">
                    {release.summary}
                  </p>
                </div>

                {/* Individual Bullet Items */}
                <div className="space-y-2 pt-1">
                  {release.items.map((item, idx) => {
                    let badgeBg = "bg-lime-tint";
                    let badgeLabel = "NEW";
                    let Icon = Sparkles;

                    if (item.type === "improved") {
                      badgeBg = "bg-sky-tint";
                      badgeLabel = "IMPROVED";
                      Icon = CheckCircle2;
                    } else if (item.type === "fixed") {
                      badgeBg = "bg-amber-tint";
                      badgeLabel = "FIXED";
                      Icon = Wrench;
                    } else if (item.type === "security") {
                      badgeBg = "bg-rose-tint";
                      badgeLabel = "SECURITY";
                      Icon = ShieldAlert;
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs font-medium text-ink bg-canvas-fade/80 p-2.5 rounded-tight border border-black/20"
                      >
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-tight border border-black text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5",
                            badgeBg
                          )}
                        >
                          <Icon className="size-2.5" />
                          <span>{badgeLabel}</span>
                        </span>
                        <span className="leading-snug pt-0.5">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Drawer Footer */}
          <div className="shrink-0 p-4 bg-paper border-t-[3px] border-black flex items-center justify-between gap-3">
            <span className="text-xs font-mono font-bold text-ink-muted hidden sm:inline">
              Undercover v1.2.0 • Public Release
            </span>

            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="primary"
                size="default"
                className="w-full sm:w-auto font-black bg-amber-base hover:bg-amber-tint text-ink border-[3px] border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ml-auto"
              >
                Understood, Case Closed
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default PatchNotesDrawer;
