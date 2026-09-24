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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 border-b-2 border-black pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-base border-2 border-black bg-[#facc15] shadow-brutal-sm flex items-center justify-center shrink-0">
              <GiSecretBook className="size-5 text-black" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                How to Play Undercover
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Social Deduction & Word Bluffing Game
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2 text-left font-para">
          {/* Objective */}
          <div className="rounded-base border-2 border-black bg-yellow-100/80 p-4 shadow-brutal-sm">
            <h4 className="font-black text-sm uppercase tracking-wider text-black mb-1 flex items-center gap-1.5">
              <span>🎯</span> Objective
            </h4>
            <p className="text-sm font-medium text-gray-900 leading-relaxed">
              Every player receives a secret word on their screen. Civilians share the same word, while the Undercover gets a slightly different word. Mr. White receives no word at all. Find and eliminate the impostors before they take over!
            </p>
          </div>

          {/* The 3 Roles */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-600 mb-3">
              The 3 Roles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Civilian */}
              <div className="rounded-base border-2 border-black bg-white p-3.5 shadow-brutal-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-8 rounded-base border-2 border-black bg-sky-200 flex items-center justify-center">
                      <GiSpy className="size-5 text-black" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Majority</Badge>
                  </div>
                  <h5 className="font-black text-base text-black mb-1">Civilian</h5>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">
                    You have the secret word shared by most players. Give subtle clues to identify allies without revealing the exact word to Mr. White!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 text-[11px] font-bold text-sky-800">
                  Goal: Eliminate all Undercovers & Mr. White.
                </div>
              </div>

              {/* Undercover */}
              <div className="rounded-base border-2 border-black bg-yellow-200/60 p-3.5 shadow-brutal-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-8 rounded-base border-2 border-black bg-yellow-300 flex items-center justify-center">
                      <GiHoodedFigure className="size-5 text-black" />
                    </div>
                    <Badge variant="primary" className="text-[10px]">Impostor</Badge>
                  </div>
                  <h5 className="font-black text-base text-black mb-1">Undercover</h5>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">
                    Your word is slightly different (e.g. "Coffee" vs "Tea"). Blend in, deduce what the civilians have, and deflect suspicion!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 text-[11px] font-bold text-yellow-900">
                  Goal: Survive until only 1 civilian remains.
                </div>
              </div>

              {/* Mr. White */}
              <div className="rounded-base border-2 border-black bg-pink-200/60 p-3.5 shadow-brutal-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-8 rounded-base border-2 border-black bg-pink-300 flex items-center justify-center">
                      <GiGhost className="size-5 text-black" />
                    </div>
                    <Badge variant="destructive" className="text-[10px]">Ghost</Badge>
                  </div>
                  <h5 className="font-black text-base text-black mb-1">Mr. White</h5>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">
                    You get NO word at all! Listen closely, improvise a plausible clue, and if caught, guess the civilian word to steal the win!
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 text-[11px] font-bold text-pink-900">
                  Goal: Survive, or correctly guess the word if voted out.
                </div>
              </div>
            </div>
          </div>

          {/* Game Flow */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-600 mb-3">
              Turn Structure
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 rounded-base border-2 border-black bg-white p-3 shadow-brutal-sm">
                <span className="size-6 rounded-base bg-black text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-black text-sm text-black flex items-center gap-1.5">
                    <GiSecretBook className="size-4 text-gray-800" />
                    Word Delivery
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    Each player receives their secret word privately on their mobile device or browser.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-base border-2 border-black bg-white p-3 shadow-brutal-sm">
                <span className="size-6 rounded-base bg-black text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-black text-sm text-black flex items-center gap-1.5">
                    <GiDiscussion className="size-4 text-gray-800" />
                    Give Clues
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    In random order, each alive player states ONE single word or short clue describing their secret word. Never repeat a clue!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-base border-2 border-black bg-white p-3 shadow-brutal-sm">
                <span className="size-6 rounded-base bg-black text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-black text-sm text-black flex items-center gap-1.5">
                    <GiVote className="size-4 text-gray-800" />
                    Vote & Elimination
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    After everyone has given a clue, discuss and vote on who looks the most suspicious. The player with the most votes is eliminated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t-2 border-black pt-4">
          <DialogClose asChild>
            <Button variant="default" size="default" className="w-full sm:w-auto font-black">
              <GiCheckMark className="mr-2 size-4" /> Got it, Let's Play!
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RulesDialog;
