import { useEffect } from "react";
import type { CardView } from "@game/types";
import { useGameStore } from "@/stores/gameStore";
import RoomCodeShare from "@/components/room/RoomCodeShare";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";

interface RoleCardProps {
  card?: CardView;
  code?: string;
  className?: string;
}

export default function RoleCard({ card, code, className = "" }: RoleCardProps) {
  const { roomView, isInfoCardVisible, setInfoCardVisible } = useGameStore();
  const roomCode = code || roomView?.code || "";

  // Auto-close secret info modal if game phase changes
  useEffect(() => {
    setInfoCardVisible(false);
  }, [roomView?.phase, setInfoCardVisible]);

  if (!card && !roomCode) return null;

  // Exact copy mapping per spec §7
  let title = "YOUR WORD";
  let description =
    "This is your word. Say something believable. Or don't—chaos is also a valid strategy.";

  if (card) {
    switch (card.variant) {
      case "MR_WHITE":
        title = "YOU ARE MR. WHITE";
        description =
          "You have no word. You know nothing. Nod thoughtfully, drop a generic clue, and if they catch you, guess their word to steal victory.";
        break;

      case "CIVILIAN":
        title = "CIVILIAN";
        description =
          "This is the common word. Describe it without giving it away to Mr. White, and vote out anyone giving shady answers.";
        break;

      case "UNDERCOVER":
        title = "UNDERCOVER";
        description =
          "Your word is slightly different from the civilians'. Blend in, pretend you belong, and deflect suspicion onto literally anyone else.";
        break;

      case "WORD_ONLY":
      default:
        title = "YOUR WORD";
        description =
          "This is your word. Say something believable. Or don't—chaos is also a valid strategy.";
        break;
    }
  }

  return (
    <div className={`w-full max-w-md mx-auto space-y-3 select-none ${className}`}>
      {/* 1. Room Code Share Div */}
      {roomCode && <RoomCodeShare code={roomCode} />}

      {/* 2. Show Secret Info Trigger Button */}
      {card && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setInfoCardVisible(true)}
          className="w-full bg-[#fdfbf7] hover:bg-yellow-200 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 font-black uppercase text-xs flex items-center justify-center gap-2 cursor-pointer h-10"
        >
          <Eye className="size-4" />
          <span>Show Secret Info</span>
        </Button>
      )}

      {/* 3. Secret Info Modal */}
      {card && (
        <Dialog open={isInfoCardVisible} onOpenChange={setInfoCardVisible}>
          <DialogContent className="max-w-md bg-white border-[3px] border-black shadow-[6px_6px_0px_#000] p-6 text-center">
            <DialogHeader className="border-b-2 border-black pb-3">
              <div className="flex items-center justify-center gap-2">
                <ShieldAlert className="size-5 text-black" />
                <DialogTitle
                  className="font-heading font-black text-xl text-black"
                  data-testid="role-card-title"
                >
                  {title}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs font-bold text-gray-700">
                Angle your screen down. Peeking eyes are everywhere.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Word Display (null for Mr. White) */}
              {card.word ? (
                <div className="py-3.5 px-4 bg-yellow-200 border-2 border-black rounded-base font-heading font-black text-2xl sm:text-3xl tracking-wider text-black select-all shadow-[2px_2px_0px_#000]">
                  {card.word}
                </div>
              ) : (
                <div className="py-3.5 px-4 bg-gray-100 border-2 border-dashed border-black rounded-base font-mono text-base font-bold text-gray-600">
                  [ ABSOLUTELY NOTHING ]
                </div>
              )}

              <p className="text-xs sm:text-sm font-bold text-gray-700 leading-relaxed px-1">
                {description}
              </p>

              <span className="block text-[10px] font-mono font-medium text-gray-500 pt-1">
                (Auto-hides if you switch tabs)
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={() => setInfoCardVisible(false)}
                className="w-full font-black bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              >
                <EyeOff className="size-5" />
                <span>Hide Secret Info</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
