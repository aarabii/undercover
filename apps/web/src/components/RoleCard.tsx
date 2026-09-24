import type { CardView } from "@game/types";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";

interface RoleCardProps {
  card?: CardView;
}

export default function RoleCard({ card }: RoleCardProps) {
  const { isInfoCardVisible, toggleInfoCard } = useGameStore();

  if (!card) return null;

  // Exact copy mapping per spec §7
  let title = "YOUR WORD";
  let description =
    "This is your word. Play along: describe it without saying it, and figure out who's different.";
  let shadowClass = "shadow-[4px_4px_0px_#000]";
  let borderClass = "border-[3px] border-black";
  let bgClass = "bg-white";

  switch (card.variant) {
    case "MR_WHITE":
      title = "YOU ARE MR. WHITE";
      description =
        "You don't have a word. Play along, listen to everyone, and try to work out the word. If you're voted out you get one last guess.";
      shadowClass = "shadow-none";
      borderClass = "border-2 border-dashed border-black";
      bgClass = "bg-white";
      break;

    case "CIVILIAN":
      title = "CIVILIAN";
      description =
        "This is your word. Play along: describe it without saying it, and spot who's different.";
      shadowClass = "shadow-[4px_4px_0px_#A3E635]";
      borderClass = "border-[3px] border-black";
      bgClass = "bg-white";
      break;

    case "UNDERCOVER":
      title = "UNDERCOVER";
      description =
        "Your word is different from everyone else's. Play along and blend in.";
      shadowClass = "shadow-[4px_4px_0px_#38BDF8]";
      borderClass = "border-[3px] border-black";
      bgClass = "bg-white";
      break;

    case "WORD_ONLY":
    default:
      title = "YOUR WORD";
      description =
        "This is your word. Play along: describe it without saying it, and figure out who's different.";
      shadowClass = "shadow-[4px_4px_0px_#000]";
      borderClass = "border-[3px] border-black";
      bgClass = "bg-white";
      break;
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-2 select-none">
      {/* Toggle Button */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={toggleInfoCard}
        className="w-full bg-[#fdfbf7] hover:bg-yellow-200 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-black uppercase text-xs flex items-center justify-center gap-2 cursor-pointer h-10"
      >
        {isInfoCardVisible ? (
          <>
            <EyeOff className="size-4" />
            <span>Hide Secret Info</span>
          </>
        ) : (
          <>
            <Eye className="size-4" />
            <span>Show Secret Info</span>
          </>
        )}
      </Button>

      {/* Expanded Info Card */}
      {isInfoCardVisible && (
        <div
          className={`${bgClass} ${borderClass} ${shadowClass} rounded-base p-5 text-center space-y-3 transition-all`}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-widest text-black">
            <ShieldAlert className="size-4 text-black" />
            <span>{title}</span>
          </div>

          {/* Word Display (null for Mr. White) */}
          {card.word ? (
            <div className="py-2.5 px-4 bg-yellow-200 border-2 border-black rounded-base font-heading font-black text-2xl tracking-wider text-black select-all">
              {card.word}
            </div>
          ) : (
            <div className="py-2.5 px-4 bg-gray-100 border-2 border-dashed border-black rounded-base font-mono text-sm font-bold text-gray-600">
              [ NO WORD ]
            </div>
          )}

          <p className="text-xs font-bold text-gray-700 leading-relaxed px-1">
            {description}
          </p>

          <span className="block text-[10px] font-mono font-medium text-gray-500 pt-1">
            (Auto-hides on tab blur)
          </span>
        </div>
      )}
    </div>
  );
}
