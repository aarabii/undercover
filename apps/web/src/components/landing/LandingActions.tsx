import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RulesDialog from "@/components/modals/RulesDialog";
import PatchNotesDrawer from "@/components/modals/PatchNotesDrawer";
import { GiPadlock, GiEntryDoor, GiSecretBook } from "react-icons/gi";
import { Newspaper } from "lucide-react";

export const LandingActions = () => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* 2 Main Action Buttons: Host a Room (Amber) & Enter Room Code (Sky) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <a href="/play?action=create" className="w-full no-underline">
          <Button
            type="button"
            size="lg"
            variant="default"
            className="w-full text-base sm:text-lg font-black tracking-wide h-14 bg-amber-base hover:bg-amber-tint text-ink border-[3px] border-black shadow-brutal flex items-center justify-center gap-2.5 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <GiPadlock className="size-6 shrink-0" />
            <span>Host a Room</span>
          </Button>
        </a>

        <a href="/play?action=join" className="w-full no-underline">
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="w-full text-base sm:text-lg font-black tracking-wide h-14 bg-sky-base hover:bg-sky-tint text-ink border-[3px] border-black shadow-brutal flex items-center justify-center gap-2.5 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <GiEntryDoor className="size-6 shrink-0" />
            <span>Enter Room Code</span>
          </Button>
        </a>
      </div>

      {/* Secondary Quick Action Triggers: Rules & Patch Notes */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => setRulesOpen(true)}
          className="bg-paper hover:bg-amber-fade font-bold border-2 border-black shadow-brutal-sm flex items-center gap-2 text-xs sm:text-sm cursor-pointer active:translate-x-0.5 active:translate-y-0.5 text-ink"
        >
          <GiSecretBook className="size-4 text-ink" />
          <span>The Rules (Read These First)</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => setPatchNotesOpen(true)}
          className="bg-paper hover:bg-rose-fade font-bold border-2 border-black shadow-brutal-sm flex items-center gap-2 text-xs sm:text-sm cursor-pointer active:translate-x-0.5 active:translate-y-0.5 text-ink"
        >
          <Newspaper className="size-4 text-ink" />
          <span>What's New</span>
          <Badge
            variant="pink"
            className="text-[9px] px-1.5 py-0 font-mono tracking-tighter bg-rose-tint border border-black"
          >
            v1.2
          </Badge>
        </Button>
      </div>

      {/* Modals & Drawers */}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
      <PatchNotesDrawer open={patchNotesOpen} onOpenChange={setPatchNotesOpen} />
    </div>
  );
};

export default LandingActions;
