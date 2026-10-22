import { useEffect } from "react";
import type { CardView } from "@game/types";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, EyeOff, ShieldAlert, Sparkles } from "lucide-react";

interface RoleCardProps {
  card?: CardView;
  className?: string;
}

export default function RoleCard({ card, className = "" }: RoleCardProps) {
  const { roomView, isInfoCardVisible, setInfoCardVisible } = useGameStore();

  // Auto-close secret info modal if game phase changes
  useEffect(() => {
    setInfoCardVisible(false);
  }, [roomView?.phase, setInfoCardVisible]);

  if (!card) return null;

  // Exact copy mapping per spec §7
  let title = "YOUR WORD";
  let description =
    "This is your word. Say something believable. Or don't—chaos is also a valid strategy.";

  let shadowClass = "shadow-[6px_6px_0px_#000]";
  let borderClass = "border-[3px] border-black";

  switch (card.variant) {
    case "MR_WHITE":
      title = "YOU ARE MR. WHITE";
      description =
        "You have no word. You know nothing. Nod thoughtfully, drop a generic clue, and if they catch you, guess their word to steal victory.";
      shadowClass = "shadow-none";
      borderClass = "border-[3px] border-dashed border-black";
      break;

    case "CIVILIAN":
      title = "CIVILIAN";
      description =
        "This is the common word. Describe it without giving it away to Mr. White, and vote out anyone giving shady answers.";
      shadowClass = "shadow-[6px_6px_0px_0px_#84CC16]";
      borderClass = "border-[3px] border-black";
      break;

    case "UNDERCOVER":
      title = "UNDERCOVER";
      description =
        "Your word is slightly different from the civilians'. Blend in, pretend you belong, and deflect suspicion onto literally anyone else.";
      shadowClass = "shadow-[6px_6px_0px_0px_#0EA5E9]";
      borderClass = "border-[3px] border-black";
      break;

    case "WORD_ONLY":
    default:
      title = "YOUR WORD";
      description =
        "This is your word. Say something believable. Or don't—chaos is also a valid strategy.";
      shadowClass = "shadow-[6px_6px_0px_#000]";
      borderClass = "border-[3px] border-black";
      break;
  }

  return (
    <div className={`w-full max-w-md mx-auto select-none ${className}`}>
      {/* Show Secret Info Trigger Button */}
      <Button
        type="button"
        variant="primary"
        size="default"
        onClick={() => setInfoCardVisible(true)}
        className="w-full flex items-center justify-center gap-2 h-12 text-sm font-black uppercase tracking-wider font-mono shadow-brutal"
      >
        <Eye className="size-4 shrink-0" />
        <span>Show Secret Info</span>
        <Sparkles className="size-3.5 text-ink/70 shrink-0 ml-1" />
      </Button>

      {/* Secret Info Modal */}
      <Dialog open={isInfoCardVisible} onOpenChange={setInfoCardVisible}>
        <DialogContent className={`max-w-md bg-paper ${borderClass} ${shadowClass} p-6 text-center`}>
          <DialogHeader className="border-b-2 border-black pb-3">
            <div className="flex items-center justify-center gap-2">
              <ShieldAlert className="size-5 text-ink" />
              <DialogTitle
                className="font-heading font-black text-xl text-ink"
                data-testid="role-card-title"
              >
                {title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-bold text-ink-muted">
              Angle your screen down. Peeking eyes are everywhere.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Word Display (null for Mr. White) - preserves bg-yellow-200 and font-heading for E2E */}
            {card.word ? (
              <div className="py-3.5 px-4 bg-yellow-200 border-2 border-black rounded-base font-heading font-black text-2xl sm:text-3xl tracking-wider text-ink select-all shadow-[2px_2px_0px_#000]">
                {card.word}
              </div>
            ) : (
              <div className="py-3.5 px-4 bg-canvas border-2 border-dashed border-black rounded-base font-mono text-base font-bold text-ink-muted">
                [ ABSOLUTELY NOTHING ]
              </div>
            )}

            <p className="text-xs sm:text-sm font-bold text-ink-muted leading-relaxed px-1">
              {description}
            </p>

            <span className="block text-[10px] font-mono font-medium text-ink-muted pt-1">
              (Auto-hides if you switch tabs)
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setInfoCardVisible(false)}
              className="w-full flex items-center justify-center gap-2"
            >
              <EyeOff className="size-5" />
              <span>Hide Secret Info</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
