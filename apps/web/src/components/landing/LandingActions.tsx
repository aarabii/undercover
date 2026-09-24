import { useState } from "react";
import { Button } from "@/components/ui/button";
import RulesDialog from "@/components/modals/RulesDialog";
import { GiPadlock, GiEntryDoor, GiSecretBook } from "react-icons/gi";

export const LandingActions = () => {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* 2 Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <a href="/play?action=create" className="w-full no-underline">
          <Button
            type="button"
            size="lg"
            variant="default"
            className="w-full text-base sm:text-lg font-black tracking-wide h-14 bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-brutal flex items-center justify-center gap-2.5 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
            className="w-full text-base sm:text-lg font-black tracking-wide h-14 bg-sky-300 hover:bg-sky-200 text-black border-[3px] border-black shadow-brutal flex items-center justify-center gap-2.5 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <GiEntryDoor className="size-6 shrink-0" />
            <span>Enter Room Code</span>
          </Button>
        </a>
      </div>

      {/* Rules trigger button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => setRulesOpen(true)}
          className="bg-white hover:bg-yellow-200 font-bold border-2 border-black shadow-brutal-sm flex items-center gap-2 text-sm cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
        >
          <GiSecretBook className="size-4 text-black" />
          <span>The Rules (Read These First)</span>
        </Button>
      </div>

      {/* Rules Dialog */}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default LandingActions;
