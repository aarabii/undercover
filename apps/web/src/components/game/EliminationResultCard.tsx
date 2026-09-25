import type { EliminationResult, PlayerPublicView } from "@game/types";
import AvatarTile from "@/components/common/AvatarTile";
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
      <div
        className="
          w-full
          max-w-full
          overflow-hidden
          bg-yellow-100
          border-[3px]
          border-black
          rounded-base
          p-4 sm:p-6
          shadow-[4px_4px_0px_#000]
          text-center
          space-y-3
          animate-in
          fade-in
          duration-300
        "
      >
        <div className="size-16 rounded-full border-[3px] border-black bg-yellow-300 mx-auto flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Scale className="size-8 text-black" />
        </div>

        <div className="space-y-1 min-w-0">
          <span className="block font-heading font-black text-2xl uppercase tracking-wider text-black break-words">
            TIE — Nobody Eliminated
          </span>

          <p className="text-xs font-bold text-gray-700 break-words">
            A deadlock. Nobody could agree on who looked the shadiest. Everyone
            survives to lie another round.
          </p>
        </div>
      </div>
    );
  }

  const eliminatedPlayer = players.find(
    (p) => p.id === lastElimination.eliminatedId,
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
    <div
      className="
        w-full
        max-w-full
        overflow-hidden
        bg-white
        border-[3px]
        border-black
        rounded-base
        p-4 sm:p-6
        shadow-[4px_4px_0px_#000]
        text-center
        space-y-4
        animate-in
        zoom-in-95
        duration-300
      "
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-2 min-w-0">
        <Skull className="size-6 shrink-0 text-red-600" />

        <span className="font-heading font-black text-xl uppercase tracking-wider text-black break-words">
          The Verdict
        </span>
      </div>

      {/* Eliminated Player */}
      {eliminatedPlayer && (
        <div className="flex flex-col items-center gap-2 py-2 min-w-0">
          <AvatarTile
            avatar={eliminatedPlayer.avatar}
            name={eliminatedPlayer.name}
            isEliminated
            size="lg"
          />
        </div>
      )}

      {/* Role Reveal */}
      <div className="flex flex-col items-center gap-2 min-w-0">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
          Actual Identity:
        </span>

        <div
          className={`
            max-w-full
            py-2
            px-4
            rounded-base
            border-[3px]
            border-black
            font-heading
            font-black
            text-xl sm:text-2xl
            uppercase
            tracking-wider
            text-black
            shadow-[3px_3px_0px_#000]
            break-words
            [overflow-wrap:anywhere]
            ${roleColor}
          `}
        >
          {roleTitle}
        </div>
      </div>

      {/* Elimination Reason */}
      <p className="text-xs font-bold text-gray-700 break-words">
        Voted out. The jury has spoken, and the jury was ruthless.
      </p>
    </div>
  );
}
