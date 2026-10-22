import React, { useState } from "react";
import BrandLogo from "@/components/common/BrandLogo";
import RulesDialog from "@/components/modals/RulesDialog";
import { Button } from "@/components/ui/button";
import { GiSecretBook } from "react-icons/gi";
import { ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  variant?: "landing" | "play";
}

export const AppHeader: React.FC<AppHeaderProps> = ({ variant = "landing" }) => {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <header className="w-full flex items-center justify-between gap-3 select-none">
      <a
        href="/"
        className="min-w-0 shrink hover:opacity-95 transition-opacity"
        title="Undercover — Return to Home"
      >
        <BrandLogo size="sm" showTagline={true} />
      </a>

      <nav className="shrink-0 flex items-center gap-2">
        {/* Rules Trigger: Single clear button, avoids navbar bloat */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRulesOpen(true)}
          className="flex items-center gap-1.5"
          title="How to play Undercover"
        >
          <GiSecretBook className="size-4 shrink-0 text-ink" />
          <span className="hidden sm:inline">Game Rules</span>
          <span className="sm:hidden">Rules</span>
        </Button>

        {variant === "play" && (
          <a href="/" className="no-underline">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-ink"
              title="Return to Home"
            >
              <ArrowLeft className="size-3.5 shrink-0" />
              <span>Home</span>
            </Button>
          </a>
        )}
      </nav>

      {/* Rules Dialog Modal */}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </header>
  );
};

export default AppHeader;
