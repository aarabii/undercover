import type { RoomView } from "@game/types";
import { connection } from "@/lib/connection";
import AvatarTile from "@/components/common/AvatarTile";
import { Button } from "@/components/ui/button";
import { Hourglass, LogOut } from "lucide-react";

interface WaitingScreenProps {
  roomView: RoomView;
}

export default function WaitingScreen({ roomView }: WaitingScreenProps) {
  const activePlayers = roomView.players.filter((p) => p.status === "active" || p.status === "eliminated");

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center font-para">
      <div className="bg-white border-[3px] border-black rounded-base p-6 shadow-[4px_4px_0px_#000] space-y-4">
        <div className="size-16 rounded-full border-[3px] border-black bg-pink-200 mx-auto flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Hourglass className="size-8 text-black" />
        </div>

        <div className="space-y-1">
          <span className="font-heading font-black text-2xl text-black">
            Game in Progress
          </span>
          <p className="text-xs font-bold text-gray-700">
            You are in the waiting lounge. You will automatically join when the current game ends.
          </p>
        </div>

        <div className="p-3 bg-[#fdfbf7] border-2 border-black rounded-base font-mono text-xs font-bold flex justify-between items-center">
          <span>ROOM: {roomView.code}</span>
          <span className="capitalize">Round {roomView.round}</span>
        </div>
      </div>

      {/* Public Roster */}
      <div className="bg-white border-[3px] border-black rounded-base p-5 shadow-[4px_4px_0px_#000] space-y-3">
        <span className="block text-xs font-black uppercase tracking-wider text-black text-left">
          Current Players ({activePlayers.length})
        </span>

        <div className="grid grid-cols-4 gap-2.5 justify-items-center">
          {activePlayers.map((player) => (
            <AvatarTile
              key={player.id}
              avatar={player.avatar}
              name={player.name}
              isHost={player.isHost}
              isEliminated={player.status === "eliminated"}
              isAway={player.presence === "away"}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Leave Room Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={() => connection.leave()}
        className="text-xs font-bold text-red-600 hover:text-red-700 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center gap-1.5 mx-auto"
      >
        <LogOut className="size-3.5" /> Leave Room
      </Button>
    </div>
  );
}
