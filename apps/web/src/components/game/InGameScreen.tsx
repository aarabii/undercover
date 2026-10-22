import type { RoomView } from "@game/types";
import { connection } from "@/lib/connection";
import GameCountdown from "@/components/game/GameCountdown";
import RoleCard from "@/components/game/RoleCard";
import PlayerGrid from "@/components/game/PlayerGrid";
import EliminationResultCard from "@/components/game/EliminationResultCard";
import MrWhiteGuessScreen from "@/components/game/MrWhiteGuessScreen";
import GameOverScreen from "@/components/game/GameOverScreen";
import RoomCodeShare from "@/components/room/RoomCodeShare";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pause,
  Play,
  FastForward,
  CheckCircle2,
  StopCircle,
  LogOut,
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
    phaseLabel = "The Verdict";
    phaseColor = "primary";
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 text-center font-para pb-8">
      {/* 1. Top Bar: Round & Compact Room Code */}
      <div className="flex items-center justify-between gap-3 bg-paper border-[3px] border-black rounded-base p-3 shadow-brutal">
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="font-mono text-xs bg-amber-base text-ink">
            R{roomView.round}
          </Badge>
          <span className="font-heading font-black text-sm uppercase tracking-wider text-ink">
            Round {roomView.round}
          </span>
        </div>
        <RoomCodeShare code={roomView.code} variant="compact" />
      </div>

      {/* 2. Round Phase Stepper Bar */}
      <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-paper border-2 border-black rounded-base shadow-brutal-sm text-[10px] sm:text-xs font-mono font-black uppercase">
        <div
          className={`py-1 rounded-tight border transition-colors flex items-center justify-center gap-1 ${
            isRoleReveal
              ? "bg-sky-base text-ink border-black shadow-[1px_1px_0px_#000]"
              : "bg-canvas text-ink-muted border-transparent"
          }`}
        >
          <span>1.</span> <span className="hidden sm:inline">Intel</span><span className="sm:hidden">Word</span>
        </div>

        <div
          className={`py-1 rounded-tight border transition-colors flex items-center justify-center gap-1 ${
            isDiscussion
              ? "bg-lime-base text-ink border-black shadow-[1px_1px_0px_#000]"
              : "bg-canvas text-ink-muted border-transparent"
          }`}
        >
          <span>2.</span> <span>Discuss</span>
        </div>

        <div
          className={`py-1 rounded-tight border transition-colors flex items-center justify-center gap-1 ${
            isVoting
              ? "bg-rose-base text-ink border-black shadow-[1px_1px_0px_#000]"
              : "bg-canvas text-ink-muted border-transparent"
          }`}
        >
          <span>3.</span> <span>Vote</span>
        </div>

        <div
          className={`py-1 rounded-tight border transition-colors flex items-center justify-center gap-1 ${
            isElimination
              ? "bg-amber-base text-ink border-black shadow-[1px_1px_0px_#000]"
              : "bg-canvas text-ink-muted border-transparent"
          }`}
        >
          <span>4.</span> <span>Verdict</span>
        </div>
      </div>

      {/* 3. Role Card (Secret Info Trigger & Modal) */}
      <RoleCard card={roomView.me.card} />

      {/* 4. Host Controls Toolbar */}
      {isHost && (
        <div className="flex flex-wrap items-center justify-center gap-2 p-2.5 bg-canvas border-2 border-black rounded-base shadow-[2px_2px_0px_#000]">
          {/* Pause / Resume */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => (isPaused ? connection.hostResume() : connection.hostPause())}
            className="flex items-center gap-1"
          >
            {isPaused ? <Play className="size-3.5 fill-black" /> : <Pause className="size-3.5 fill-black" />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </Button>

          {/* Skip Timer (during role reveal or discussion) */}
          {(isRoleReveal || isDiscussion) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => connection.hostSkip()}
              className="flex items-center gap-1"
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
              variant="lime"
              onClick={() => connection.hostEndVoting()}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="size-3.5" />
              <span>End Voting</span>
            </Button>
          )}

          {/* End Game Button */}
          <Button
            type="button"
            size="sm"
            variant="subtleDanger"
            onClick={() => connection.hostEndGame()}
            className="flex items-center gap-1"
          >
            <StopCircle className="size-3.5" />
            <span>End Game</span>
          </Button>
        </div>
      )}

      {/* 5. Phase Banner & Countdown */}
      <div className="space-y-3">
        <Badge variant={phaseColor} className="text-sm font-black uppercase px-4 py-1 tracking-wider shadow-brutal-sm">
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

        {/* Voting Progress Counter & Bar */}
        {isVoting && (
          <div className="space-y-1.5 max-w-sm mx-auto pt-1">
            <div className="font-mono text-xs font-black uppercase tracking-wider text-ink">
              {roomView.votedCount ?? 0} of {roomView.totalVoters ?? 0} votes locked in
            </div>
            <div className="w-full h-3 rounded-full bg-canvas border-2 border-black overflow-hidden shadow-brutal-sm">
              <div
                className="h-full bg-rose-base transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    ((roomView.votedCount ?? 0) / Math.max(1, roomView.totalVoters ?? 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Elimination Result Card (during ELIMINATION) */}
      {isElimination && (
        <EliminationResultCard
          lastElimination={roomView.lastElimination}
          players={roomView.players}
        />
      )}

      {/* 7. Player Grid */}
      <PlayerGrid
        players={roomView.players}
        isVotingPhase={isVoting}
        myVote={roomView.me.myVote}
        voteCounts={roomView.lastElimination?.voteCounts}
      />

      {/* 8. Leave Room Action */}
      <div className="pt-2">
        <Button
          type="button"
          variant="subtleDanger"
          size="sm"
          onClick={() => connection.leave()}
          className="mx-auto flex items-center gap-1.5"
        >
          <LogOut className="size-3.5" />
          <span>Leave Room</span>
        </Button>
      </div>
    </div>
  );
}
