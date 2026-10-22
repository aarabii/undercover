import type { RoomView } from "@game/types";
import { connection } from "@/lib/connection";
import AvatarTile from "@/components/common/AvatarTile";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, LogOut } from "lucide-react";

interface GameOverScreenProps {
  roomView: RoomView;
}

export default function GameOverScreen({ roomView }: GameOverScreenProps) {
  const summary = roomView.gameOver;
  const isHost = roomView.players.find((p) => p.id === roomView.me.id)?.isHost ?? false;

  if (!summary) return null;

  const civiliansWon = summary.winner === "CIVILIANS";

  let winReasonText = "Victory achieved!";
  switch (summary.reason) {
    case "ALL_INFILTRATORS_ELIMINATED":
      winReasonText = "All infiltrators were eliminated! The undercover cracked under 4 minutes of peer pressure. Respect.";
      break;
    case "INFILTRATORS_EQUAL_OR_GREATER":
      winReasonText = "Infiltrators survived to equal or outnumber the civilians! The undercover walked so calmly through that interrogation you'd think they were innocent. They were not.";
      break;
    case "MR_WHITE_GUESSED":
      winReasonText = "Mr. White correctly guessed the civilian secret word! Absolute highway robbery on the final buzzer.";
      break;
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 text-center font-para pb-8 animate-in fade-in duration-300">
      {/* 1. Loud Full-Bleed Winner Banner per Design System §5.2 */}
      <div
        className={`w-full py-5 px-4 border-[3px] border-black rounded-none shadow-[6px_6px_0px_#000] space-y-1 ${
          civiliansWon ? "bg-lime-base" : "bg-sky-base"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Trophy className="size-8 text-ink fill-amber-base" />
          <h1 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-ink">
            {civiliansWon ? "Civilians Win" : "Infiltrators Win"}
          </h1>
        </div>
        <p className="font-bold text-sm text-ink max-w-md mx-auto">
          {winReasonText}
        </p>
      </div>

      {/* 2. Word Pair Comparison Reveal */}
      <div className="bg-paper border-[3px] border-black rounded-base p-5 shadow-brutal space-y-3">
        <span className="block text-xs font-black uppercase tracking-wider text-ink font-mono">
          THE EVIDENCE
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-lime-fade border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
            <span className="block text-[11px] font-black uppercase text-ink font-mono">
              Civilian Word
            </span>
            <span className="font-heading font-black text-xl text-ink select-all">
              {summary.civilianWord}
            </span>
          </div>

          <div className="p-3 bg-sky-fade border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
            <span className="block text-[11px] font-black uppercase text-ink font-mono">
              Undercover Word
            </span>
            <span className="font-heading font-black text-xl text-ink select-all">
              {summary.undercoverWord}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Everyone's Revealed Role and Word */}
      <div className="bg-paper border-[3px] border-black rounded-base p-5 shadow-brutal space-y-4">
        <span className="block text-xs font-black uppercase tracking-wider text-ink text-left font-mono">
          ROSTER & TRUE ROLES
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {roomView.players.map((player) => {
            const roleInfo = summary.playerRoles[player.id];
            const isCivilian = roleInfo?.role === "CIVILIAN";
            const isUndercover = roleInfo?.role === "UNDERCOVER";
            const isMrWhite = roleInfo?.role === "MR_WHITE";

            return (
              <div
                key={player.id}
                className="flex flex-col items-center p-3 bg-canvas border-2 border-black rounded-base shadow-[2px_2px_0px_#000] space-y-1.5"
              >
                <AvatarTile
                  avatar={player.avatar}
                  name={player.name}
                  isHost={player.isHost}
                  isMe={player.id === roomView.me.id}
                  size="sm"
                />
                <span
                  className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-tight border border-black ${
                    isCivilian
                      ? "bg-lime-base text-ink"
                      : isUndercover
                      ? "bg-sky-base text-ink"
                      : "bg-paper text-ink border-dashed"
                  }`}
                >
                  {isMrWhite ? "Mr. White" : roleInfo?.role}
                </span>
                {roleInfo?.word && (
                  <span className="text-xs font-mono font-bold text-ink-muted">
                    "{roleInfo.word}"
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Host Controls: Play Again */}
      <div className="space-y-3 pt-2">
        {isHost ? (
          <Button
            type="button"
            size="lg"
            onClick={() => connection.hostPlayAgain()}
            className="w-full h-14 text-lg font-black tracking-wide bg-amber-base hover:bg-amber-tint text-ink border-[3px] border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="size-5" />
            <span>Play Again</span>
          </Button>
        ) : (
          <div className="p-4 bg-amber-fade border-[3px] border-black rounded-base font-bold text-sm text-ink">
            Waiting for the host to hit rematch and ruin more friendships.
          </div>
        )}

        <button
          type="button"
          onClick={() => connection.leave()}
          className="text-xs font-black uppercase tracking-wider text-crimson-shade hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer font-mono"
        >
          <LogOut className="size-3.5" /> Exit to Main Menu
        </button>
      </div>
    </div>
  );
}
