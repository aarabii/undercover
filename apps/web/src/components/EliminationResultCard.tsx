import type { EliminationResult, PlayerPublicView } from "@game/types";
import AvatarTile from "@/components/AvatarTile";
import { Skull, Scale } from "lucide-react";

interface EliminationResultCardProps {
  lastElimination?: EliminationResult;
  players: PlayerPublicView[];
}

export default function EliminationResultCard({
  lastElimination,
  players,
}: EliminationResultCardProps) {
  if (!lastElimination) return null;

  if (lastElimination.isTie) {
    return (
      <div className="w-full bg-yellow-100 border-[3px] border-black rounded-base p-6 shadow-[4px_4px_0px_#000] text-center space-y-3 animate-in fade-in duration-300">
        <div className="size-16 rounded-full border-[3px] border-black bg-yellow-300 mx-auto flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Scale className="size-8 text-black" />
        </div>

        <div className="space-y-1">
          <span className="font-heading font-black text-2xl uppercase tracking-wider text-black">
            TIE — Nobody Eliminated
          </span>
          <p className="text-xs font-bold text-gray-700">
            The votes were split evenly. Discuss more and vote again in the next round!
          </p>
        </div>
      </div>
    );
  }

  // Find eliminated player data
  const eliminatedPlayer = players.find(
    (p) => p.id === lastElimination.eliminatedId
  );

  const roleTitle =
    lastElimination.role === "MR_WHITE"
      ? "Mr. White"
      : lastElimination.role || "Unknown Role";

  const roleColor =
    lastElimination.role === "CIVILIAN"
      ? "bg-lime-400"
      : lastElimination.role === "UNDERCOVER"
      ? "bg-sky-300"
      : "bg-white border-dashed";

  return (
    <div className="w-full bg-white border-[3px] border-black rounded-base p-6 shadow-[4px_4px_0px_#000] text-center space-y-4 animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-center gap-2">
        <Skull className="size-6 text-red-600" />
        <span className="font-heading font-black text-xl uppercase tracking-wider text-black">
          Elimination Result
        </span>
      </div>

      {eliminatedPlayer && (
        <div className="flex flex-col items-center gap-2 py-2">
          <AvatarTile
            avatar={eliminatedPlayer.avatar}
            name={eliminatedPlayer.name}
            isEliminated
            size="lg"
          />
        </div>
      )}

      {/* Role Reveal Banner */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
          Secret Identity Revealed:
        </span>
        <div
          className={`py-2 px-4 rounded-base border-[3px] border-black font-heading font-black text-2xl uppercase tracking-wider text-black shadow-[3px_3px_0px_#000] inline-block ${roleColor}`}
        >
          {roleTitle}
        </div>
      </div>

      {/* Elimination Reason */}
      <p className="text-xs font-bold text-gray-700">
        Eliminated by {lastElimination.reason?.toLowerCase() || "vote"}.
      </p>
    </div>
  );
}
