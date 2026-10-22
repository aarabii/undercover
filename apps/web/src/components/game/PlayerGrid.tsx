import type { PlayerPublicView } from "@game/types";
import { connection } from "@/lib/connection";
import { useGameStore } from "@/stores/gameStore";
import AvatarTile from "@/components/common/AvatarTile";

interface PlayerGridProps {
  players: PlayerPublicView[];
  isVotingPhase: boolean;
  myVote?: string | null;
  voteCounts?: Record<string, number>;
}

export default function PlayerGrid({
  players,
  isVotingPhase,
  myVote,
  voteCounts,
}: PlayerGridProps) {
  const { roomView } = useGameStore();
  const myId = roomView?.me?.id;

  const handleVote = (targetId: string) => {
    if (!isVotingPhase) return;
    connection.castVote(targetId);
  };

  const votedTargetPlayer = myVote ? players.find((p) => p.id === myVote) : null;

  return (
    <div className="w-full bg-paper border-[3px] border-black rounded-base p-5 shadow-brutal space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 text-left">
        <span className="font-heading font-black text-sm uppercase tracking-wider text-ink">
          The Lineup
        </span>
        {isVotingPhase && (
          <span className="text-xs font-black uppercase tracking-wider text-crimson-shade font-mono">
            Tap a player to accuse them
          </span>
        )}
      </div>

      {/* Target confirmation banner */}
      {isVotingPhase && votedTargetPlayer && (
        <div className="p-2.5 bg-rose-fade border-2 border-black rounded-base text-xs font-bold text-ink flex items-center justify-between shadow-brutal-sm font-mono">
          <span>You accused: <strong className="font-black underline">{votedTargetPlayer.name}</strong></span>
          <span className="text-[10px] text-ink-muted hidden sm:inline">(Tap another suspect to change)</span>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5 justify-items-center pt-1">
        {players.map((player) => {
          const isMe = player.id === myId;
          const isEliminated = player.status === "eliminated";
          const isVotedByMe = myVote === player.id;
          const canVoteFor = isVotingPhase && !isMe && !isEliminated && player.status === "active";

          return (
            <AvatarTile
              key={player.id}
              avatar={player.avatar}
              name={player.name}
              isHost={player.isHost}
              isMe={isMe}
              isEliminated={isEliminated}
              eliminatedInfo={player.eliminated}
              isAway={player.presence === "away"}
              isSelected={isVotedByMe}
              isVotedForMe={isVotedByMe}
              voteCount={voteCounts?.[player.id]}
              onClick={canVoteFor ? () => handleVote(player.id) : undefined}
              size="md"
            />
          );
        })}
      </div>
    </div>
  );
}
