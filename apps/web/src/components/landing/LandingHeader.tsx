import React, { useState } from "react";
import BrandLogo from "@/components/common/BrandLogo";
import RulesDialog from "@/components/modals/RulesDialog";
import PatchNotesDrawer from "@/components/modals/PatchNotesDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GiSecretBook } from "react-icons/gi";
import { Newspaper } from "lucide-react";

export const LandingHeader: React.FC = () => {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [patchNotesOpen, setPatchNotesOpen] = useState(false);

  return (
    <header className="w-full max-w-full min-w-0 flex items-center justify-between gap-2 overflow-hidden">
      <a
        href="/"
        className="min-w-0 shrink hover:opacity-95 transition-opacity"
      >
        <BrandLogo size="md" showTagline={true} />
      </a>

      <nav className="shrink-0 flex items-center gap-2 sm:gap-2.5">
        {/* Patch Notes Trigger Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPatchNotesOpen(true)}
          className="bg-paper hover:bg-rose-fade font-bold border-2 border-black shadow-brutal-sm text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          title="View latest updates and patch notes"
        >
          <Newspaper className="size-3.5 sm:size-4 shrink-0 text-ink" />
          <span className="hidden sm:inline">Patch Notes</span>
          <span className="sm:hidden">Updates</span>
          <Badge
            variant="pink"
            className="text-[9px] px-1.5 py-0 font-mono tracking-tighter bg-rose-tint border border-black"
          >
            v1.2
          </Badge>
        </Button>

        {/* Rules Trigger Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRulesOpen(true)}
          className="bg-paper hover:bg-amber-tint font-bold border-2 border-black shadow-brutal-sm text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
        >
          <GiSecretBook className="size-3.5 sm:size-4 shrink-0 text-ink" />
          <span className="hidden sm:inline">How Not to Lose</span>
          <span className="sm:hidden">Rules</span>
        </Button>
      </nav>

      {/* Modals & Drawers */}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
      <PatchNotesDrawer open={patchNotesOpen} onOpenChange={setPatchNotesOpen} />
    </header>
  );
};

export default LandingHeader;
