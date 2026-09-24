import { useState } from "react";
import type { RoomView } from "@game/types";
import { connection } from "@/lib/connection";
import GameCountdown from "@/components/game/GameCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Send, Loader2 } from "lucide-react";

interface MrWhiteGuessScreenProps {
  roomView: RoomView;
}

export default function MrWhiteGuessScreen({
  roomView,
}: MrWhiteGuessScreenProps) {
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isVotedMrWhite = roomView.lastElimination?.eliminatedId === roomView.me.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed || submitted) return;
    setSubmitted(true);
    connection.mrWhiteGuess(trimmed);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-5 font-para">
      {/* Countdown Timer */}
      <GameCountdown
        endsAt={roomView.endsAt}
        serverNow={roomView.serverNow}
        paused={roomView.paused}
      />

      {isVotedMrWhite ? (
        /* Private Input for the voted-out Mr. White */
        <div className="bg-white border-[3px] border-black rounded-base p-6 shadow-[4px_4px_0px_#000] space-y-4">
          <div className="size-16 rounded-full border-2 border-dashed border-black bg-white mx-auto flex items-center justify-center shadow-none">
            <HelpCircle className="size-8 text-black" />
          </div>

          <div className="space-y-1">
            <span className="font-heading font-black text-2xl uppercase tracking-wider text-black">
              Final Guess!
            </span>
            <p className="text-xs font-bold text-gray-700">
              You were voted out as Mr. White. Guess the Civilians' secret word to steal victory for the Infiltrators!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <Input
              type="text"
              autoFocus
              disabled={submitted}
              value={guess}
              maxLength={50}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter your word guess"
              className="text-center font-heading font-black text-xl uppercase h-14 bg-[#fdfbf7] border-2 border-black rounded-base shadow-[2px_2px_0px_#000]"
            />

            <Button
              type="submit"
              size="lg"
              disabled={!guess.trim() || submitted}
              className="w-full h-12 text-base font-black bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitted ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guess Sent</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Submit Guess</span>
                </>
              )}
            </Button>
          </form>
        </div>
      ) : (
        /* Waiting screen for everyone else */
        <div className="bg-white border-[3px] border-black rounded-base p-8 shadow-[4px_4px_0px_#000] space-y-4">
          <div className="size-16 rounded-full border-2 border-dashed border-black bg-white mx-auto flex items-center justify-center shadow-none">
            <Loader2 className="size-8 animate-spin text-black" />
          </div>

          <div className="space-y-1">
            <span className="font-heading font-black text-xl uppercase tracking-wider text-black">
              Mr. White is Guessing...
            </span>
            <p className="text-xs font-bold text-gray-700">
              The eliminated Mr. White is typing their final guess. If they guess the Civilian word, Infiltrators win!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
