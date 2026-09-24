import type { RoomView } from "@game/types";
import { connection } from "@/lib/connection";
import GameCountdown from "@/components/game/GameCountdown";
import RoleCard from "@/components/game/RoleCard";
import PlayerGrid from "@/components/game/PlayerGrid";
import EliminationResultCard from "@/components/game/EliminationResultCard";
import MrWhiteGuessScreen from "@/components/game/MrWhiteGuessScreen";
import GameOverScreen from "@/components/game/GameOverScreen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pause,
  Play,
  FastForward,
  CheckCircle2,
  StopCircle,
} from "lucide-react";

interface InGameScreenProps {
  roomView: RoomView;
}

export default function InGameScreen({ roomView }: InGameScreenProps) {
  const isHost = roomView.players.find((p) => p.id === roomView.me.id)?.isHost ?? false;
  const isPaused = Boolean(roomView.paused);

  // If Game Over, render GameOverScreen
  if (roomView.phase === "GAME_OVER") {
    return <GameOverScreen roomView={roomView} />;
  }

  // If Mr. White Guess phase, render MrWhiteGuessScreen
  if (roomView.phase === "MRWHITE_GUESS") {
    return (
      <div className="w-full max-w-xl mx-auto space-y-5 text-center font-para pb-8">
        <MrWhiteGuessScreen roomView={roomView} />
      </div>
    );
  }

  const isRoleReveal = roomView.phase === "ROLE_REVEAL";
  const isDiscussion = roomView.phase === "DISCUSSION";
  const isVoting = roomView.phase === "VOTING";
  const isElimination = roomView.phase === "ELIMINATION";

  let phaseLabel = "Game in Progress";
  let phaseColor: "primary" | "secondary" | "lime" | "pink" = "primary";

  if (isRoleReveal) {
    phaseLabel = "Check Your Identity";
    phaseColor = "secondary";
  } else if (isDiscussion) {
    phaseLabel = "Discussion Phase";
    phaseColor = "lime";
  } else if (isVoting) {
    phaseLabel = "Voting Phase";
    phaseColor = "pink";
  } else if (isElimination) {
    phaseLabel = "Round Results";
    phaseColor = "primary";
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 text-center font-para pb-8">
      {/* 1. Top Bar: Secret Info Toggle & Round Meta */}
      <div className="flex items-center justify-between gap-3 bg-white border-[3px] border-black rounded-base p-3 shadow-[4px_4px_0px_#000]">
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="font-mono text-xs">
            R{roomView.round}
          </Badge>
          <span className="font-heading font-black text-sm uppercase tracking-wider text-black">
            ROOM: {roomView.code}
          </span>
        </div>

        {/* Secret Info Card Trigger */}
        <div className="flex-1 max-w-[180px]">
          <RoleCard card={roomView.me.card} />
        </div>
      </div>

      {/* 2. Host Controls Toolbar */}
      {isHost && (
        <div className="flex flex-wrap items-center justify-center gap-2 p-2.5 bg-[#fdfbf7] border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
          {/* Pause / Resume */}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => (isPaused ? connection.hostResume() : connection.hostPause())}
            className="h-8 px-2.5 text-xs font-black uppercase tracking-wider border-2 border-black bg-white hover:bg-yellow-200 shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1"
          >
            {isPaused ? <Play className="size-3.5 fill-black" /> : <Pause className="size-3.5 fill-black" />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </Button>

          {/* Skip Timer (during role reveal or discussion) */}
          {(isRoleReveal || isDiscussion) && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => connection.hostSkip()}
              className="h-8 px-2.5 text-xs font-black uppercase tracking-wider border-2 border-black bg-white hover:bg-yellow-200 shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1"
            >
              <FastForward className="size-3.5" />
              <span>Skip Timer</span>
            </Button>
          )}

          {/* End Voting Now (during voting) */}
          {isVoting && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => connection.hostEndVoting()}
              className="h-8 px-2.5 text-xs font-black uppercase tracking-wider border-2 border-black bg-lime-300 hover:bg-lime-200 shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1"
            >
              <CheckCircle2 className="size-3.5" />
              <span>End Voting</span>
            </Button>
          )}

          {/* End Game Button */}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => connection.hostEndGame()}
            className="h-8 px-2.5 text-xs font-black uppercase tracking-wider border-2 border-black bg-red-200 hover:bg-red-300 shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 text-red-900"
          >
            <StopCircle className="size-3.5" />
            <span>End Game</span>
          </Button>
        </div>
      )}

      {/* 3. Phase Banner & Countdown */}
      <div className="space-y-3">
        <Badge variant={phaseColor} className="text-sm font-black uppercase px-4 py-1 tracking-wider">
          {phaseLabel}
        </Badge>

        {!isElimination && (
          <div>
            <GameCountdown
              endsAt={roomView.endsAt}
              serverNow={roomView.serverNow}
              paused={roomView.paused}
            />
          </div>
        )}

        {/* Voting Progress Counter */}
        {isVoting && (
          <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
            {roomView.votedCount ?? 0} / {roomView.totalVoters ?? 0} voted
          </div>
        )}
      </div>

      {/* 4. Elimination Result Card (during ELIMINATION) */}
      {isElimination && (
        <EliminationResultCard
          lastElimination={roomView.lastElimination}
          players={roomView.players}
        />
      )}

      {/* 5. Player Grid */}
      <PlayerGrid
        players={roomView.players}
        isVotingPhase={isVoting}
        myVote={roomView.me.myVote}
        voteCounts={roomView.lastElimination?.voteCounts}
      />
    </div>
  );
}
