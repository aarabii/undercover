import React, { useState } from "react";
import BrandLogo from "@/components/common/BrandLogo";
import RulesDialog from "@/components/modals/RulesDialog";
import { Button } from "@/components/ui/button";
import { GiSecretBook } from "react-icons/gi";

export const LandingHeader: React.FC = () => {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <header className="w-full max-w-full min-w-0 flex items-center justify-between gap-2 overflow-hidden">
      <a
        href="/"
        className="min-w-0 shrink hover:opacity-95 transition-opacity"
      >
        <BrandLogo size="md" showTagline={true} />
      </a>

      <nav className="shrink-0 flex items-center gap-2.5 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRulesOpen(true)}
          className="bg-white hover:bg-yellow-200 font-bold border-2 border-black shadow-brutal-sm text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
        >
          <GiSecretBook className="size-4 shrink-0" />

          <span className="hidden sm:inline">How Not to Lose</span>

          <span className="sm:hidden">Rules</span>
        </Button>
      </nav>

      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </header>
  );
};

export default LandingHeader;
