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
      winReasonText = "All infiltrators were eliminated!";
      break;
    case "INFILTRATORS_EQUAL_OR_GREATER":
      winReasonText = "Infiltrators survived to equal or outnumber the civilians!";
      break;
    case "MR_WHITE_GUESSED":
      winReasonText = "Mr. White correctly guessed the civilian secret word!";
      break;
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 text-center font-para pb-8 animate-in fade-in duration-300">
      {/* 1. Loud Full-Bleed Winner Banner per Design System §5.2 */}
      <div
        className={`w-full py-5 px-4 border-[3px] border-black rounded-none shadow-[6px_6px_0px_#000] space-y-1 ${
          civiliansWon ? "bg-lime-400" : "bg-sky-300"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Trophy className="size-8 text-black fill-yellow-300" />
          <h1 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-wider text-black">
            {civiliansWon ? "Civilians Win" : "Infiltrators Win"}
          </h1>
        </div>
        <p className="font-bold text-sm text-black max-w-md mx-auto">
          {winReasonText}
        </p>
      </div>

      {/* 2. Word Pair Comparison Reveal */}
      <div className="bg-white border-[3px] border-black rounded-base p-5 shadow-[4px_4px_0px_#000] space-y-3">
        <span className="block text-xs font-black uppercase tracking-wider text-black">
          The Secret Words
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-lime-100 border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
            <span className="block text-[11px] font-black uppercase text-black">
              Civilian Word
            </span>
            <span className="font-heading font-black text-xl text-black select-all">
              {summary.civilianWord}
            </span>
          </div>

          <div className="p-3 bg-sky-100 border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
            <span className="block text-[11px] font-black uppercase text-black">
              Undercover Word
            </span>
            <span className="font-heading font-black text-xl text-black select-all">
              {summary.undercoverWord}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Everyone's Revealed Role and Word */}
      <div className="bg-white border-[3px] border-black rounded-base p-5 shadow-[4px_4px_0px_#000] space-y-4">
        <span className="block text-xs font-black uppercase tracking-wider text-black text-left">
          All Players & Identities
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
                className="flex flex-col items-center p-3 bg-[#fdfbf7] border-2 border-black rounded-base shadow-[2px_2px_0px_#000] space-y-1.5"
              >
                <AvatarTile avatar={player.avatar} name={player.name} size="sm" />
                <span
                  className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-tight border border-black ${
                    isCivilian
                      ? "bg-lime-300"
                      : isUndercover
                      ? "bg-sky-300"
                      : "bg-white border-dashed"
                  }`}
                >
                  {isMrWhite ? "Mr. White" : roleInfo?.role}
                </span>
                {roleInfo?.word && (
                  <span className="text-xs font-mono font-bold text-gray-700">
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
            className="w-full h-14 text-lg font-black tracking-wide bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="size-5" />
            <span>Play Again</span>
          </Button>
        ) : (
          <div className="p-4 bg-yellow-100 border-[3px] border-black rounded-base font-bold text-sm text-black">
            Waiting for host to start rematch...
          </div>
        )}

        <button
          type="button"
          onClick={() => connection.leave()}
          className="text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
        >
          <LogOut className="size-3.5" /> Return to Menu
        </button>
      </div>
    </div>
  );
}
