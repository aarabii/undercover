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
      <div className="bg-paper border-[3px] border-black rounded-base p-6 shadow-brutal space-y-4">
        <div className="size-16 rounded-full border-[3px] border-black bg-rose-tint mx-auto flex items-center justify-center shadow-brutal-sm">
          <Hourglass className="size-8 text-ink" />
        </div>

        <div className="space-y-1">
          <span className="font-heading font-black text-2xl text-ink">
            Round in Progress
          </span>
          <p className="text-xs font-bold text-ink-muted">
            Grab some popcorn and watch the accusations fly. You'll jump in once this bloodbath ends.
          </p>
        </div>

        <div className="p-3 bg-canvas border-2 border-black rounded-base font-mono text-xs font-bold flex justify-between items-center text-ink">
          <span>ROOM: {roomView.code}</span>
          <span className="capitalize">Round {roomView.round}</span>
        </div>
      </div>

      {/* Public Roster */}
      <div className="bg-paper border-[3px] border-black rounded-base p-5 shadow-brutal space-y-3">
        <span className="block text-xs font-black uppercase tracking-wider text-ink text-left font-mono">
          Current Suspects ({activePlayers.length})
        </span>

        <div className="grid grid-cols-4 gap-2.5 justify-items-center">
          {activePlayers.map((player) => (
            <AvatarTile
              key={player.id}
              avatar={player.avatar}
              name={player.name}
              isHost={player.isHost}
              isMe={player.id === roomView.me.id}
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
        className="text-xs font-bold text-crimson-shade hover:bg-crimson-fade border-2 border-black bg-paper shadow-brutal-sm flex items-center gap-1.5 mx-auto cursor-pointer font-mono"
      >
        <LogOut className="size-3.5" /> Leave Room
      </Button>
    </div>
  );
}
