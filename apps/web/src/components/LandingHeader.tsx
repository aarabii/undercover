import React, { useState } from "react";
import BrandLogo from "./BrandLogo";
import RulesDialog from "./RulesDialog";
import { Button } from "./ui/button";
import { GiSecretBook, GiEntryDoor } from "react-icons/gi";

export const LandingHeader: React.FC = () => {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <header className="w-full flex items-center justify-between">
      <a href="/" className="hover:opacity-95 transition-opacity">
        <BrandLogo size="md" showTagline={true} />
      </a>

      <nav className="flex items-center gap-2.5 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRulesOpen(true)}
          className="bg-white hover:bg-yellow-200 font-bold border-2 border-black shadow-brutal-sm text-xs sm:text-sm flex items-center gap-1.5"
        >
          <GiSecretBook className="size-4" />
          <span>Rules</span>
        </Button>

        <a href="/play">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="bg-[#facc15] hover:bg-yellow-300 text-black font-black border-2 border-black shadow-brutal-sm text-xs sm:text-sm flex items-center gap-1.5"
          >
            <GiEntryDoor className="size-4" />
            <span>Play Now</span>
          </Button>
        </a>
      </nav>

      {/* Rules Dialog Modal */}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </header>
  );
};

export default LandingHeader;
