import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GiSecretBook,
  GiSpy,
  GiHoodedFigure,
  GiGhost,
  GiDiscussion,
  GiVote,
  GiCheckMark,
} from "react-icons/gi";
import { Target } from "lucide-react";

interface RulesDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const RulesDialog: React.FC<RulesDialogProps> = ({
  trigger,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-canvas p-5 sm:p-6 border-[3px] border-black shadow-[6px_6px_0px_#000]">
        <DialogHeader className="space-y-2 border-b-2 border-black pb-4 text-left">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-base border-2 border-black bg-amber-base shadow-brutal-sm flex items-center justify-center shrink-0">
              <GiSecretBook className="size-5 text-ink" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight font-heading text-ink">
                How to Play Undercover
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                The Art of Lying Convincingly to People You Know
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2 text-left font-para">
          {/* Objective */}
          <div className="rounded-base border-2 border-black bg-amber-fade p-4 shadow-brutal-sm">
            <h4 className="font-black text-sm uppercase tracking-wider text-ink mb-1 flex items-center gap-1.5 font-heading">
              <Target className="size-4 text-ink stroke-[2.5]" />
              <span>Objective</span>
            </h4>
            <p className="text-sm font-medium text-ink leading-relaxed">
              Everyone gets a secret word on their screen. Civilians get the same word. The Undercover gets a cousin word. Mr. White gets a blank screen and a dream. Spot the impostors before they outnumber you.
            </p>
          </div>

          {/* The 3 Roles */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-ink-muted mb-3 font-mono">
              THE 3 ROLES
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Civilian (Lime) */}
              <div className="rounded-base border-2 border-black bg-lime-fade p-3.5 shadow-brutal-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-8 rounded-base border-2 border-black bg-lime-base flex items-center justify-center shadow-brutal-sm">
                      <GiSpy className="size-5 text-ink" />
                    </div>
                    <Badge variant="lime" className="text-[10px] bg-lime-base text-ink">Majority</Badge>
                  </div>
                  <h5 className="font-black text-base text-ink mb-1 font-heading">Civilian</h5>
                  <p className="text-xs font-medium text-ink-muted leading-relaxed">
                    You're on the majority team. Prove you know the word without spelling it out for Mr. White.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 text-[11px] font-bold text-lime-shade">
                  Goal: Sniff out the fakes and eliminate them.
                </div>
              </div>

              {/* Undercover (Sky) */}
              <div className="rounded-base border-2 border-black bg-sky-fade p-3.5 shadow-brutal-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-8 rounded-base border-2 border-black bg-sky-base flex items-center justify-center shadow-brutal-sm">
                      <GiHoodedFigure className="size-5 text-ink" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-sky-base text-ink">Impostor</Badge>
                  </div>
                  <h5 className="font-black text-base text-ink mb-1 font-heading">Undercover</h5>
                  <p className="text-xs font-medium text-ink-muted leading-relaxed">
                    Your word is subtly different (e.g. "Coffee" vs "Tea"). Blend in, pray nobody asks you for details, and frame an innocent person.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 text-[11px] font-bold text-sky-shade">
                  Goal: Survive until only 1 civilian is left standing.
                </div>
              </div>

              {/* Mr. White (Dashed Crisp Paper) */}
              <div className="rounded-base border-2 border-dashed border-black bg-paper p-3.5 shadow-none flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-8 rounded-base border-2 border-dashed border-black bg-canvas-fade flex items-center justify-center">
                      <GiGhost className="size-5 text-ink" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-dashed border-black bg-canvas-fade">Ghost</Badge>
                  </div>
                  <h5 className="font-black text-base text-ink mb-1 font-heading">Mr. White</h5>
                  <p className="text-xs font-medium text-ink-muted leading-relaxed">
                    You get zero intel. Fake confidence, give an aggressively generic clue, and if you get voted out, guess their word to steal the win.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 text-[11px] font-bold text-ink-muted">
                  Goal: Stay alive, or steal the win with one final guess.
                </div>
              </div>
            </div>
          </div>

          {/* Game Flow */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-ink-muted mb-3 font-mono">
              TURN STRUCTURE
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 rounded-base border-2 border-black bg-paper p-3 shadow-brutal-sm">
                <span className="size-6 rounded-base bg-lime-base text-ink font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-black shadow-brutal-sm">
                  1
                </span>
                <div>
                  <div className="font-black text-sm text-ink flex items-center gap-1.5 font-heading">
                    <GiSecretBook className="size-4 text-ink-muted" />
                    Word Delivery
                  </div>
                  <p className="text-xs font-medium text-ink-muted">
                    Inspect your secret word privately. Poker face starts now.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-base border-2 border-black bg-paper p-3 shadow-brutal-sm">
                <span className="size-6 rounded-base bg-amber-base text-ink font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-black shadow-brutal-sm">
                  2
                </span>
                <div>
                  <div className="font-black text-sm text-ink flex items-center gap-1.5 font-heading">
                    <GiDiscussion className="size-4 text-ink-muted" />
                    Give Clues
                  </div>
                  <p className="text-xs font-medium text-ink-muted">
                    Take turns giving a one-word or short clue. Be believable, but don't give away the farm.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-base border-2 border-black bg-paper p-3 shadow-brutal-sm">
                <span className="size-6 rounded-base bg-rose-base text-ink font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-black shadow-brutal-sm">
                  3
                </span>
                <div>
                  <div className="font-black text-sm text-ink flex items-center gap-1.5 font-heading">
                    <GiVote className="size-4 text-ink-muted" />
                    Vote & Elimination
                  </div>
                  <p className="text-xs font-medium text-ink-muted">
                    Argue passionately, blame the quietest person, and vote someone out.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t-2 border-black pt-4">
          <DialogClose asChild>
            <Button variant="primary" size="default" className="w-full sm:w-auto">
              <GiCheckMark className="mr-2 size-4" /> Understood. Prepare the pitchforks.
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RulesDialog;
