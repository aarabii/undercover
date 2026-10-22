import React from "react";
import { Button } from "@/components/ui/button";
import { GiPadlock, GiEntryDoor } from "react-icons/gi";

export const LandingActions: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* 2 Main Hero CTAs: Host a Room (Amber) & Enter Room Code (Sky) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <a href="/play?action=create" className="w-full no-underline">
          <Button
            type="button"
            size="lg"
            variant="primary"
            className="w-full flex items-center justify-center gap-2.5"
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
            className="w-full flex items-center justify-center gap-2.5"
          >
            <GiEntryDoor className="size-6 shrink-0" />
            <span>Enter Room Code</span>
          </Button>
        </a>
      </div>
    </div>
  );
};

export default LandingActions;
