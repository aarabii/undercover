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

  return (
    <div className="w-full bg-white border-[3px] border-black rounded-base p-5 shadow-[4px_4px_0px_#000] space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-2 text-left">
        <span className="font-heading font-black text-sm uppercase tracking-wider text-black">
          Players
        </span>
        {isVotingPhase && (
          <span className="text-xs font-black uppercase tracking-wider text-[#FF4B3E]">
            Tap player to vote
          </span>
        )}
      </div>

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
