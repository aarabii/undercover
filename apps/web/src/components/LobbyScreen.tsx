import { useState } from "react";
import type { RoomView, PlayerPublicView } from "@game/types";
import { connection } from "@/lib/connection";
import RoomCodeShare from "@/components/RoomCodeShare";
import AvatarTile from "@/components/AvatarTile";
import PendingRequestsPanel from "@/components/PendingRequestsPanel";
import LobbySettings from "@/components/LobbySettings";
import PlayerManageModal from "@/components/PlayerManageModal";
import SelfEditModal from "@/components/SelfEditModal";
import { Button } from "@/components/ui/button";
import { Play, Lock, Unlock, LogOut, Users } from "lucide-react";

interface LobbyScreenProps {
  roomView: RoomView;
}

export default function LobbyScreen({ roomView }: LobbyScreenProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPublicView | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selfEditOpen, setSelfEditOpen] = useState(false);

  const me = roomView.players.find((p) => p.id === roomView.me.id);
  const isHost = me?.isHost ?? false;
  const activePlayers = roomView.players.filter((p) => p.status === "active");

  const infiltrators = roomView.settings.undercoverCount + roomView.settings.mrWhiteCount;
  const civilians = activePlayers.length - infiltrators;
  const maxInfiltrators = Math.floor(Math.max(0, activePlayers.length - 1) / 2);

  // Compute disabled reason per spec 9.4
  let disabledReason: string | null = null;
  if (activePlayers.length < 4) {
    disabledReason = `Need 4 players (${activePlayers.length}/4)`;
  } else if (activePlayers.some((p) => p.presence === "away")) {
    disabledReason = "A player is away";
  } else if (infiltrators < 1) {
    disabledReason = "Need at least 1 infiltrator";
  } else if (infiltrators > maxInfiltrators || civilians < infiltrators + 1) {
    disabledReason = `Too many infiltrators (max ${maxInfiltrators} for ${activePlayers.length} players)`;
  }

  const handleStartGame = () => {
    if (disabledReason) return;
    connection.hostStart();
  };

  const handlePlayerClick = (player: PlayerPublicView) => {
    if (player.id === roomView.me.id) {
      setSelfEditOpen(true);
    } else if (isHost) {
      setSelectedPlayer(player);
      setManageModalOpen(true);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 text-center font-para pb-8">
      {/* 1. Header: Room Code & Share */}
      <RoomCodeShare code={roomView.code} />

      {/* 2. Host Pending Requests Panel */}
      {isHost && roomView.pendingRequests && (
        <PendingRequestsPanel pendingRequests={roomView.pendingRequests} />
      )}

      {/* 3. Player Roster Grid */}
      <div className="bg-white border-[3px] border-black rounded-base p-5 shadow-[4px_4px_0px_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2 text-left">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-black" />
            <span className="font-heading font-black text-sm uppercase tracking-wider text-black">
              Players ({activePlayers.length} / {roomView.settings.maxPlayers})
            </span>
          </div>
          {isHost && (
            <button
              type="button"
              onClick={() => connection.hostLock(!roomView.locked)}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-tight border-2 border-black bg-white hover:bg-yellow-200 cursor-pointer shadow-[1px_1px_0px_#000]"
              title={roomView.locked ? "Unlock room" : "Lock room"}
            >
              {roomView.locked ? <Lock className="size-3.5 text-red-600" /> : <Unlock className="size-3.5 text-gray-700" />}
              <span>{roomView.locked ? "Locked" : "Lock Room"}</span>
            </button>
          )}
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1 justify-items-center">
          {activePlayers.map((player) => {
            const isMe = player.id === roomView.me.id;
            return (
              <AvatarTile
                key={player.id}
                avatar={player.avatar}
                name={player.name}
                isHost={player.isHost}
                isAway={player.presence === "away"}
                canEdit={isMe}
                onEdit={isMe ? () => setSelfEditOpen(true) : undefined}
                onClick={() => handlePlayerClick(player)}
                size="md"
              />
            );
          })}
        </div>
      </div>

      {/* 4. Game Rules & Settings */}
      <LobbySettings
        settings={roomView.settings}
        isHost={isHost}
        playerCount={activePlayers.length}
      />

      {/* 5. Primary Host Action / Non-host Status */}
      <div className="space-y-2 pt-2">
        {isHost ? (
          <>
            <Button
              type="button"
              size="lg"
              disabled={Boolean(disabledReason)}
              onClick={handleStartGame}
              className="w-full h-14 text-lg font-black tracking-wide bg-yellow-400 hover:bg-yellow-300 text-black border-[3px] border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="size-5 fill-black" />
              <span>Start Game</span>
            </Button>
            {disabledReason && (
              <p className="text-xs font-black uppercase tracking-wider text-red-600 bg-red-100 py-1.5 px-3 border border-red-300 rounded-tight inline-block">
                {disabledReason}
              </p>
            )}
          </>
        ) : (
          <div className="p-4 bg-sky-100 border-[3px] border-black rounded-base shadow-[2px_2px_0px_#000] text-sm font-bold text-black">
            Waiting for host to start the game...
          </div>
        )}
      </div>

      {/* 6. Leave Room Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => connection.leave()}
          className="text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
        >
          <LogOut className="size-3.5" /> Leave Room
        </button>
      </div>

      {/* Host Player Management Modal */}
      <PlayerManageModal
        player={selectedPlayer}
        open={manageModalOpen}
        onOpenChange={setManageModalOpen}
      />

      {/* Self Profile Edit Modal */}
      <SelfEditModal
        open={selfEditOpen}
        onOpenChange={setSelfEditOpen}
      />
    </div>
  );
}
